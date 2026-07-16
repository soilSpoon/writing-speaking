import { useState } from "react";
import type { SituationPack } from "../data/situationPacks";
import { Modal } from "./Modal";

interface SlotEditorModalProps {
  pack: SituationPack;
  slotKey: string;
  currentValue: string;
  apiKey: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

// 거친 자유 입력 → 격식 있는 법조체로 다듬기 (Gemini). 실패/무키 시 입력 그대로 둔다(무근거 폴백 금지).
async function polishWithGemini(raw: string, label: string, apiKey: string): Promise<string> {
  const prompt = `다음 거친 입력을 내용증명의 "${label}" 항목에 들어갈 간결하고 정중한 격식체 한 문장으로 다듬어라. 사실을 지어내지 말고, 따옴표 없이 결과 문장만 출력. 입력: "${raw}"`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`Gemini rewrite failed: ${res.status}`);
  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  return text.replace(/^["']|["']$/g, "") || raw;
}

export function SlotEditorModal({
  pack,
  slotKey,
  currentValue,
  apiKey,
  onSave,
  onClose,
}: SlotEditorModalProps) {
  const slot = pack.slots[slotKey];
  const [isCustom, setIsCustom] = useState(false);
  const [draft, setDraft] = useState(currentValue);
  const [isPolishing, setIsPolishing] = useState(false);

  const handlePolish = async () => {
    if (!draft.trim() || !apiKey.trim()) return;
    setIsPolishing(true);
    try {
      setDraft(await polishWithGemini(draft, slot.label, apiKey));
    } catch (err) {
      console.error("법조체 정제 실패:", err);
    } finally {
      setIsPolishing(false);
    }
  };

  return (
    <Modal title={`${slot.label} 지정`} onClose={onClose}>
      {!isCustom ? (
        <>
          <p className="modal-label">상황에 맞는 선택지를 탭하세요 (없으면 직접 입력):</p>
          <div className="chip-selector">
            {slot.chips.map((chip) => (
              <button
                key={chip}
                className={`choice-chip ${currentValue === chip ? "active" : ""}`}
                onClick={() => onSave(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
          <button
            className="btn-secondary slot-custom-toggle"
            onClick={() => {
              setDraft(currentValue);
              setIsCustom(true);
            }}
          >
            ✏️ 직접 입력하기
          </button>
        </>
      ) : (
        <>
          <label className="modal-label" htmlFor="slot-custom-input">
            {slot.label} 직접 입력
          </label>
          <div className="slot-input-row">
            <input
              id="slot-custom-input"
              type="text"
              className="slot-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={slot.placeholder}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && draft.trim()) onSave(draft);
              }}
            />
            {apiKey.trim() && (
              <button
                className="btn-rewrite-ai"
                onClick={handlePolish}
                disabled={isPolishing || !draft.trim()}
                title="Gemini가 거친 입력을 격식체로 다듬어 줍니다"
              >
                {isPolishing ? "⚙️ 정제 중…" : "✨ 법조체로"}
              </button>
            )}
          </div>
          <div className="slot-actions">
            <button className="btn-secondary" onClick={() => setIsCustom(false)}>
              추천 칩 보기
            </button>
            <button className="btn-primary" disabled={!draft.trim()} onClick={() => onSave(draft)}>
              확정
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
