import type { SituationPack } from "../data/situationPacks";

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
  apiKey: string,
): Promise<Record<string, string>> {
  if (!apiKey) {
    throw new Error("Gemini API Key가 등록되지 않았습니다.");
  }

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

  // gemini-3.5-flash only. (Retired fallbacks 2.5/2.0-flash returned 404, so they are removed;
  // a failure here surfaces to the caller which falls back to the local heuristic simulator.)
  const model = "gemini-3.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
  }

  const responseData = await response.json();
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
  apiKey: string,
): Promise<string[]> {
  if (!apiKey) throw new Error("Gemini API Key가 등록되지 않았습니다.");

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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResult) throw new Error("API response text content is empty.");
  const parsed = JSON.parse(textResult);
  return Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
}
