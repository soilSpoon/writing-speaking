import { useState } from "react";
import type { LetterDraft, Tone } from "./useLetterDraft";
import { DocumentPaper } from "./DocumentPaper";
import { draftToPlainText } from "./fillTemplate";
import { reviewLetterWithGemini } from "../utils/geminiApi";

interface EditorStepProps {
  draft: LetterDraft;
  apiKey: string;
  onSlotClick: (key: string) => void;
  onLawClick: (lawId: string) => void;
  onProceed: () => void;
}

const TONES: { value: Tone; label: string }[] = [
  { value: "polite", label: "정중하게" },
  { value: "default", label: "기본 어조" },
  { value: "firm", label: "강력하게" },
];

export function EditorStep({ draft, apiKey, onSlotClick, onLawClick, onProceed }: EditorStepProps) {
  const { pack, slots, branches, tone, completion, sections, setTone, setBranch } = draft;
  const [reviewing, setReviewing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [reviewError, setReviewError] = useState(false);

  if (!pack) return null;

  const runReview = async () => {
    setReviewing(true);
    setReviewError(false);
    try {
      const text = draftToPlainText(pack, slots, branches, tone);
      setSuggestions(await reviewLetterWithGemini(text, pack.documentType, apiKey));
    } catch (err) {
      console.error("AI 문서 검토 실패:", err);
      setReviewError(true);
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="editor-workspace">
      <div className="document-column">
        <div className="editor-toolbar">
          <div className="meter-wrapper">
            <span className="meter-label">문서 완성도</span>
            <div
              className="meter-bar-bg"
              role="progressbar"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="meter-bar-fill" style={{ width: `${completion}%` }} />
            </div>
            <span className="meter-value">{completion}%</span>
          </div>

          <div className="tone-tabs" role="group" aria-label="문서 어조 선택">
            {TONES.map((t) => (
              <button
                key={t.value}
                className={`tone-tab ${tone === t.value ? "active" : ""}`}
                aria-pressed={tone === t.value}
                onClick={() => setTone(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <DocumentPaper
          pack={pack}
          slots={slots}
          branches={branches}
          tone={tone}
          sections={sections}
          completion={completion}
          onSlotClick={onSlotClick}
          onLawClick={onLawClick}
        />

        <p className="legal-disclaimer">
          <strong>🛡️ 법령 검증 안내:</strong> 인용 법령은 국가법령정보(law.go.kr) API로 실시간
          확인합니다(파란 근거 탭). 내용증명은 법적 강제력은 없으나{" "}
          <strong>언제 어떤 내용을 통지했는지에 대한 증거</strong>로 활용될 수 있습니다. 제출 전
          세부 내용을 확인하시고, 정식 분쟁 시에는 전문가 상담을 권합니다.
        </p>
      </div>

      <aside className="editor-sidebar">
        <div className="sidebar-title-block">
          <h3 className="sidebar-title">
            <span className="ai-avatar" aria-hidden="true">
              ✨
            </span>{" "}
            문서 다듬기
          </h3>
        </div>

        <div className="companion-message">
          {completion < 100 ? (
            <>
              본문의 <span className="inline-yellow">노란 칸 🟡</span>을 탭해 채워 주세요. 추천
              선택지가 뜨고, 직접 입력도 됩니다.
            </>
          ) : (
            <>
              모든 필수 항목이 채워졌습니다. 아래 <strong>[완성·인쇄]</strong> 버튼으로 넘어가세요.
            </>
          )}
        </div>

        {apiKey.trim() && (
          <div className="ai-review">
            <button className="btn-ai-review" onClick={runReview} disabled={reviewing}>
              {reviewing ? "⚙️ AI가 문서를 검토하는 중…" : "✨ AI로 문서 다듬기 (개선점 검토)"}
            </button>
            {reviewError && (
              <p className="ai-review-error">
                검토에 실패했어요. 잠시 후 다시 시도해 주세요.
              </p>
            )}
            {suggestions && suggestions.length > 0 && (
              <ul className="ai-review-list">
                {suggestions.map((s, i) => (
                  <li key={i} className="ai-review-item">
                    💡 {s}
                  </li>
                ))}
              </ul>
            )}
            {suggestions && suggestions.length === 0 && !reviewError && (
              <p className="ai-review-empty">✅ 지금도 충분히 잘 작성되었어요.</p>
            )}
          </div>
        )}

        {pack.branches && (
          <div className="branch-selector">
            <span className="rec-title">⚙️ 상황 설정 (고르면 문서 내용이 바뀝니다)</span>
            {Object.entries(pack.branches).map(([key, def]) => (
              <div key={key} className="branch-row">
                <div className="branch-label">{def.label}</div>
                <div className="branch-options" role="group" aria-label={def.label}>
                  {def.options.map((opt) => (
                    <button
                      key={opt}
                      className={`branch-chip ${branches[key] === opt ? "active" : ""}`}
                      aria-pressed={branches[key] === opt}
                      onClick={() => setBranch(key, opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="ai-recommendations">
          <span className="rec-title">📋 채울 항목</span>
          {Object.entries(pack.slots).map(([key, slotDef]) => {
            const filled = Boolean(slots[key]?.trim());
            return (
              <button
                key={key}
                className={`rec-card ${filled ? "filled" : "empty"}`}
                onClick={() => onSlotClick(key)}
              >
                <div className="rec-card-header">
                  <span aria-hidden="true">{filled ? "✅" : "🔔"}</span>
                  <span>{slotDef.label}</span>
                </div>
                <div className="rec-card-body">{filled ? `"${slots[key]}"` : "탭하여 지정"}</div>
              </button>
            );
          })}
        </div>

        <button className="btn-primary sidebar-proceed" onClick={onProceed}>
          완성 · 인쇄 및 가이드 →
        </button>
      </aside>
    </div>
  );
}
