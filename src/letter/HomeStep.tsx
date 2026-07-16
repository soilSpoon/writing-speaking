import { useState } from "react";
import { situationPacks } from "../data/situationPacks";

const TAGS = [
  { label: "전체 상황", value: "all" },
  { label: "🏠 전월세/부동산", value: "#전월세" },
  { label: "💰 돈·환불/소비자", value: "#돈·환불" },
  { label: "💼 노동/직장", value: "#직장" },
  { label: "📑 계약/기타", value: "#계약" },
];

interface HomeStepProps {
  onSelectPack: (packId: string) => void;
}

export function HomeStep({ onSelectPack }: HomeStepProps) {
  const [tagFilter, setTagFilter] = useState("all");
  const packs = Object.values(situationPacks).filter(
    (p) => tagFilter === "all" || p.tags.includes(tagFilter),
  );

  return (
    <div>
      <div className="step-header">
        <p className="step-subtitle">Recognition-First</p>
        <h1 className="step-title">어떤 억울한 일을 겪고 계신가요?</h1>
        <p className="step-desc">
          상황을 고르면 미리 준비된 <strong>법적 뼈대(상황 팩)</strong>에 국가법령정보(law.go.kr)
          API로 <strong>인용 법령을 실시간 검증</strong>해 내용증명 초안을 만들어 드립니다.
        </p>
      </div>

      <div className="tag-container">
        {TAGS.map((t) => (
          <button
            key={t.value}
            className={`tag-btn ${tagFilter === t.value ? "active" : ""}`}
            onClick={() => setTagFilter(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="situation-grid">
        {packs.map((pack) => (
          <button
            key={pack.id}
            type="button"
            className="situation-card"
            onClick={() => onSelectPack(pack.id)}
          >
            <div className="situation-card-header">
              <div className="situation-icon-box">{pack.icon}</div>
              <span className="doc-type-badge">{pack.documentType}</span>
            </div>
            <div className="situation-card-title">{pack.title}</div>
            <p className="situation-card-desc">{pack.description}</p>
            <div className="situation-card-tags">
              {pack.tags.map((tag) => (
                <span key={tag} className="card-tag">
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}

        {/* 도피구: 목록에 없는 상황 → 우선 보증금 팩으로 자유 작성 진입 */}
        <button
          type="button"
          className="situation-card escape-card"
          onClick={() => onSelectPack("deposit_refund")}
        >
          <div className="situation-icon-box escape-icon">🎤</div>
          <div className="escape-title">여기에 상황이 없어요</div>
          <p className="situation-card-desc escape-desc">
            상황을 고르지 않고 자유롭게 말씀해 주시면, 가장 가까운 문서 골격으로 시작합니다.
          </p>
          <span className="doc-type-badge escape-badge">음성/텍스트 자유 작성</span>
        </button>
      </div>
    </div>
  );
}
