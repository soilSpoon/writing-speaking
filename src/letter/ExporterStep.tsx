import type { LetterDraft } from "./useLetterDraft";
import { fillTemplate, draftToPlainText } from "./fillTemplate";

interface ExporterStepProps {
  draft: LetterDraft;
  onBackToEditor: () => void;
  onRestart: () => void;
}

export function ExporterStep({ draft, onBackToEditor, onRestart }: ExporterStepProps) {
  const { pack, slots, branches, tone, sections } = draft;
  if (!pack) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draftToPlainText(pack, slots, branches, tone));
  };

  return (
    <div className="exporter-workspace">
      <div className="step-header">
        <p className="step-subtitle">Done</p>
        <h1 className="step-title">🎉 문서가 완성됐어요</h1>
        <p className="step-desc">
          인쇄(또는 PDF 저장)해서 발송하면 됩니다. 아래 발송 가이드를 확인하세요.
        </p>
      </div>

      <div className="export-actions">
        <button className="btn-secondary" onClick={onBackToEditor}>
          ← 다시 편집
        </button>
        <button className="btn-secondary" onClick={copyToClipboard}>
          📋 텍스트 복사
        </button>
        <button className="btn-primary" onClick={() => window.print()}>
          🖨️ PDF 저장 · 인쇄
        </button>
      </div>

      <div className="a4-document-container export-preview">
        <div className="a4-document export-paper">
          <div className="export-watermark">최종 출력 미리보기</div>
          <h3>{pack.documentType}</h3>
          {sections.map((section) => (
            <div key={section.id} className="doc-section export-section">
              {fillTemplate(section.templates[tone], pack, slots, branches)}
            </div>
          ))}
        </div>
      </div>

      <h3 className="guide-section-title">📬 발송 가이드</h3>
      <div className="guide-timeline">
        {pack.nextSteps.map((next, idx) => (
          <div key={next.title} className="timeline-item">
            <div className="timeline-step">{idx + 1}</div>
            <div className="timeline-content">
              <h4>{next.title}</h4>
              <p>{next.description}</p>
            </div>
          </div>
        ))}
        <div className="timeline-item">
          <div className="timeline-step">{pack.nextSteps.length + 1}</div>
          <div className="timeline-content">
            <h4>상대가 무응답이면</h4>
            <p>
              상대가 내용증명을 받으면 합의에 나서는 경우가 많습니다. 무응답 시에는 이 문서 사본을
              증거로 첨부해 소송·진정 등 다음 절차로 이어갈 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="exporter-restart">
        <button className="btn-primary restart-btn" onClick={onRestart}>
          첫 화면으로 (새 문서 작성)
        </button>
      </div>
    </div>
  );
}
