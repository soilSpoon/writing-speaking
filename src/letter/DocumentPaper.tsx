import { type ReactNode } from "react";
import type { SituationPack, DocumentSection } from "../data/situationPacks";
import { resolveKey } from "./fillTemplate";
import type { Tone } from "./useLetterDraft";

interface DocumentPaperProps {
  pack: SituationPack;
  slots: Record<string, string>;
  branches: Record<string, string>;
  tone: Tone;
  sections: DocumentSection[];
  completion: number;
  onSlotClick: (key: string) => void;
  onLawClick: (lawId: string) => void;
}

const PLACEHOLDER = /\{([a-zA-Z0-9_]+)\}/g;

// 템플릿 한 줄 → React 노드: 값 슬롯은 탭 가능한 버튼(빈칸이면 노랑), 분기는 평문.
function renderTemplate(
  template: string,
  pack: SituationPack,
  slots: Record<string, string>,
  branches: Record<string, string>,
  onSlotClick: (key: string) => void,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  PLACEHOLDER.lastIndex = 0;

  while ((match = PLACEHOLDER.exec(template)) !== null) {
    if (match.index > lastIndex) nodes.push(template.slice(lastIndex, match.index));
    const key = match[1];
    const resolved = resolveKey(key, pack, slots, branches);

    if (resolved.kind === "branch") {
      nodes.push(resolved.text);
    } else {
      const label = pack.slots[key]?.label ?? key;
      nodes.push(
        <button
          key={`${key}-${match.index}`}
          type="button"
          className={`interactive-slot ${resolved.filled ? "filled" : "empty"}`}
          onClick={() => onSlotClick(key)}
          aria-label={`${label} ${resolved.filled ? "수정" : "입력"}`}
        >
          {resolved.filled ? resolved.text : `${label} 🟡`}
        </button>,
      );
    }
    lastIndex = PLACEHOLDER.lastIndex;
  }
  if (lastIndex < template.length) nodes.push(template.slice(lastIndex));
  return nodes;
}

export function DocumentPaper({
  pack,
  slots,
  branches,
  tone,
  sections,
  completion,
  onSlotClick,
  onLawClick,
}: DocumentPaperProps) {
  return (
    <div className="a4-document-container">
      <div className="a4-document">
        <div
          className={`legal-seal-stamp ${completion === 100 ? "stamped" : ""}`}
          aria-hidden="true"
        >
          <span>내용</span>
          <span>증명</span>
        </div>

        <h3>{pack.documentType}</h3>

        {sections.map((section) => {
          const law = section.law_id ? pack.laws[section.law_id] : null;
          return (
            <div key={section.id} className="doc-section">
              {renderTemplate(section.templates[tone], pack, slots, branches, onSlotClick)}
              {law && (
                <button
                  type="button"
                  className="interactive-citation"
                  onClick={() => onLawClick(law.id)}
                  aria-label={`${law.title} 원문 확인 (law.go.kr 실시간 검증)`}
                >
                  [근거: {law.title}] 🔵
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
