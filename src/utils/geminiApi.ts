import type { SituationPack } from "../data/situationPacks";

/**
 * POSTs a Gemini payload to our server-side proxy (/api/gemini), which injects the
 * API key and forwards to Google. The key never lives in the browser.
 */
async function callGemini(payload: unknown): Promise<any> {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Dynamically builds a JSON schema for Gemini structured output based on the slots defined in the SituationPack.
 */
function buildSchemaForPack(pack: SituationPack) {
  const properties: Record<string, any> = {};

  Object.entries(pack.slots).forEach(([key, slot]) => {
    properties[key] = {
      type: "STRING",
      description: `${slot.label}. Extract this value from the user's story. For example, if it asks for ${slot.label}, find the matching person, amount, date, or address from the free text. Extract currency as written (e.g. '5,000만 원', '1억 원'). If this slot is not mentioned in the text at all, return an empty string "". Do not make up or hallucinate any values.`,
    };
  });

  return {
    type: "OBJECT",
    properties: properties,
    required: Object.keys(pack.slots),
  };
}

/**
 * Calls Google's Gemini 3.5 Flash API (with graceful model fallbacks) using a dynamic structured JSON schema.
 */
export async function extractEntitiesWithGemini(
  story: string,
  pack: SituationPack,
): Promise<Record<string, string>> {
  // Generate dynamic schema matching the target situation pack slots
  const schema = buildSchemaForPack(pack);

  // System instruction guiding Gemini on Korean legal document extraction rules
  const systemInstruction = `You are an expert Korean legal assistant specializing in document drafting. 
Your task is to analyze the user's unstructured story about a legal dispute (such as housing deposit refunds, unpaid wages, or consumer refunds) and extract the key details needed to fill out a formal legal demand letter (내용증명).

Follow these rules:
1. Extract values exactly as they are mentioned or implied in the user's text.
2. For dates, format them cleanly (e.g., '2026년 3월 31일' or '7월 15일').
3. For amounts, extract the full compound denomination (e.g., '5,000만 원', '18만 9,000원', '1억 2,000만 원').
4. Be extremely precise about names and roles (e.g., distinguishing between the tenant/sender and the landlord/recipient).
5. If a slot value is NOT mentioned or cannot be inferred from the user's story, you MUST return an empty string ("") for that slot. Do NOT make up or hallucinate any information.`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `User Story:\n"""\n${story}\n"""\n\nPlease extract the necessary parameters for the document: ${pack.title}.`,
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [
        {
          text: systemInstruction,
        },
      ],
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.1, // Ultra low temperature for deterministic, factual extraction
    },
  };

  // A failure here surfaces to the caller which falls back to the local heuristic simulator.
  const responseData = await callGemini(payload);
  const textResult = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResult) {
    throw new Error("API response text content is empty.");
  }

  // Parse the structured JSON returned by Gemini
  return JSON.parse(textResult);
}

/**
 * Reviews an assembled 내용증명 draft and returns concrete, actionable suggestions
 * to strengthen it — used in the editor's "문서 다듬기" step. Structure-preserving:
 * it critiques the letter instead of rewriting (keeps interactive slots/citations intact).
 */
export async function reviewLetterWithGemini(
  draftText: string,
  docTitle: string,
): Promise<string[]> {
  const systemInstruction = `당신은 대한민국 내용증명 작성을 돕는 법률 코치입니다. 사용자가 작성 중인 초안을 읽고, 문서를 더 강력하고 명확하게 만들 구체적이고 실행 가능한 개선점만 2~4개 제시하세요. 규칙:
1. 각 항목은 한 문장의 한국어로, 바로 실행 가능한 조언이어야 합니다.
2. 빠진 핵심 사실(금액·기한·근거), 모호하거나 감정적인 표현, 압박을 강화할 전략 등을 우선 지적하세요.
3. 사실을 지어내지 마세요. 일반론이 아니라 이 초안에 특정된 조언만 하세요.
4. 이미 충분히 잘 쓰였다면 억지 조언을 만들지 말고 그대로 두라고 하세요.`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `문서 종류: ${docTitle}\n\n초안:\n"""\n${draftText}\n"""\n\n위 초안의 개선점을 제시하세요.`,
          },
        ],
      },
    ],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          suggestions: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["suggestions"],
      },
      temperature: 0.4,
    },
  };

  const data = await callGemini(payload);
  const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResult) throw new Error("API response text content is empty.");
  const parsed = JSON.parse(textResult);
  return Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

/**
 * Multi-turn chat about the current draft, for the editor's "문서 다듬기" step.
 * The whole conversation history is sent each turn (Gemini is stateless); the current
 * draft rides along in the system instruction so the coach always sees the latest text.
 */
export async function chatAboutLetterWithGemini(
  history: ChatMessage[],
  draftText: string,
  docTitle: string,
): Promise<string> {
  const systemInstruction = `당신은 대한민국 내용증명 작성을 돕는 친절하고 명료한 AI 법률 도우미입니다. 아래는 사용자가 작성 중인 "${docTitle}" 초안이며, 참고 맥락으로만 제공됩니다.

- 문서와 관련된 요청(다듬기·대체 문장·표현 개선 등)에는 바로 쓸 수 있는 구체적 제안을 하세요.
- 문서와 무관한 질문(법 절차, 발송 방법, 일반 상식, 잡담 등)에도 자유롭게 친절히 답하세요. 대화 주제를 문서로 억지로 되돌리지 마세요.
- 한국어로 간결하게 답하고, 사실을 지어내지 말며, 법적 강제력을 과장하지 마세요. 확실치 않으면 전문가 상담을 권하세요.

=== 현재 초안(참고) ===
${draftText}`;

  const payload = {
    contents: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { temperature: 0.6 },
  };

  const data = await callGemini(payload);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("API response text content is empty.");
  return text;
}
