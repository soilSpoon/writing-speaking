import { useEffect, useState } from "react";
import type { LawReference } from "../data/situationPacks";
import { fetchLawArticle } from "../utils/lawApi";
import { Modal } from "./Modal";

interface LawReferenceModalProps {
  law: LawReference;
  onClose: () => void;
}

type VerifyState =
  | { status: "loading" }
  | { status: "verified"; text: string; apiUrl: string }
  | { status: "fallback" }; // API 실패 → 큐레이션 원문 사용

// 파란 각주 클릭 시: law.go.kr(OC=test)로 해당 조문을 실시간 조회.
// "AI 제안 → API 증명"의 UI 측 — 실재하면 ✓ 검증 뱃지 + 실시간 원문, 실패하면 큐레이션 원문으로 폴백.
export function LawReferenceModal({ law, onClose }: LawReferenceModalProps) {
  const [state, setState] = useState<VerifyState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    fetchLawArticle(law.lawId, law.jo).then((res) => {
      if (cancelled) return;
      setState(
        res.found
          ? { status: "verified", text: res.text, apiUrl: res.apiUrl }
          : { status: "fallback" },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [law.lawId, law.jo]);

  const bodyText = state.status === "verified" ? state.text : law.content;

  return (
    <Modal title="법령 실시간 검증" onClose={onClose} className="law-modal-content">
      <span className="law-article-badge">{law.article}</span>
      <h4 className="law-modal-heading">{law.title} 원문</h4>

      <div className="law-verify-status" aria-live="polite">
        {state.status === "loading" && "⏳ law.go.kr에서 조문 확인 중…"}
        {state.status === "verified" && "✓ law.go.kr에서 실재 확인됨 (실시간 원문)"}
        {state.status === "fallback" && "⚠️ 실시간 조회 실패 — 저장된 조문을 표시합니다"}
      </div>

      <div className="law-text-box">{bodyText}</div>

      <div className="law-btn-group">
        <a
          href={law.link}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary law-source-link"
        >
          🌐 국가법령정보 원문 열기
        </a>
        <button className="btn-primary law-confirm-btn" onClick={onClose}>
          확인 완료
        </button>
      </div>
    </Modal>
  );
}
