import { useState } from "react";
import type { SituationPack } from "../data/situationPacks";

interface StoryStepProps {
  pack: SituationPack;
  userStory: string;
  setUserStory: (v: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  onBack: () => void;
  mergeSlots: (partial: Record<string, string>) => void;
  setBranch: (key: string, value: string) => void;
}

// 상황별 음성 데모 사연 (실제 STT 대신 데모용 주입)
const DEMO_STORIES: Record<string, string> = {
  deposit_refund:
    "보증금 사연: 계약만료가 2026년 6월 30일인데 집주인 이수민이 보증금 1억 2000만원을 안 돌려주려고 해요. 주소는 해운대 우동 456번지입니다.",
  unpaid_wages:
    "임금체불 사연: 사장 김태평이가 퇴사일인 5월 15일 이후로 퇴직금 420만원을 안 주네요. 대박푸드 대표예요.",
  refund_denial:
    "환불거부 사연: 러블리샵에서 7월 15일에 18만 9,000원짜리 캐시미어 울 코트 받았는데 환불 요청했더니 세일 상품이라 안 된대요.",
};

export function StoryStep({
  pack,
  userStory,
  setUserStory,
  onSubmit,
  onSkip,
  onBack,
  mergeSlots,
  setBranch,
}: StoryStepProps) {
  const [mode, setMode] = useState<"text" | "contract">("text");
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // ponytail: 실제 OCR이 아니라 계약서 업로드 → 자동 채움 데모(고정 값 주입). 실 OCR은 Gemini Vision으로 승격 가능.
  const handleContractUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setPreview((e.target?.result as string) ?? null);
    reader.readAsDataURL(file);

    setIsScanning(true);
    setScanProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setScanProgress(progress);
      if (progress < 100) return;
      clearInterval(interval);
      setIsScanning(false);
      setUserStory(
        "[계약서 자동 추출] 부산시 해운대구 우동 456번지, 임대인 이수민·임차인 김철수, 보증금 1억 2,000만 원, 만기 2026년 6월 30일.",
      );
      mergeSlots({
        landlord_name: "이수민",
        tenant_name: "김철수",
        deposit_amount: "1억 2,000만 원",
        contract_end_date: "2026년 6월 30일",
        house_address: "부산시 해운대구 우동 456번지",
      });
      // 분기는 계약서에서 확실히 알 수 없는 값 → 합리적 기본만, 사용자가 편집에서 확인
      setBranch("lease_type", "전세");
      setBranch("occupancy", "아직 거주 중");
    }, 400);
  };

  const isContractAutoFilled = userStory.startsWith("[계약서 자동 추출]");

  return (
    <div className="story-container">
      <button className="back-btn" onClick={onBack}>
        ← 이전 상황 목록으로
      </button>
      <div className="step-header story-header">
        <p className="step-subtitle">Tell Your Story</p>
        <h1 className="step-title">{pack.icon} 사연을 편하게 들려주세요</h1>
        <p className="step-desc story-desc">
          음성이나 텍스트로 사연을 입력하거나, 임대차 계약서 사진을 올려 값을 자동으로 채울 수
          있습니다. 지저분한 말투로 적어도 정식 문서로 다듬어 드립니다.
        </p>
      </div>

      <div className="story-mode-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={mode === "text"}
          className={`story-mode-tab ${mode === "text" ? "active" : ""}`}
          onClick={() => setMode("text")}
        >
          ✏️ 사연 말하기/적기
        </button>
        <button
          role="tab"
          aria-selected={mode === "contract"}
          className={`story-mode-tab ${mode === "contract" ? "active" : ""}`}
          onClick={() => setMode("contract")}
        >
          📄 계약서 사진/PDF 올리기
        </button>
      </div>

      <div className="story-card">
        {mode === "text" ? (
          <>
            <textarea
              className="story-text-area"
              placeholder="예: 집주인 홍길동한테 전화했는데 보증금 5000만원을 안 줘요. 계약 만기는 2026년 3월 31일이고 주소는 마포구 독막로 123입니다."
              value={userStory}
              onChange={(e) => setUserStory(e.target.value)}
              aria-label="사연 입력"
            />
            <div className="mic-button-wrapper">
              <button
                className="mic-button"
                type="button"
                aria-label="음성 입력 데모 채우기"
                onClick={() => setUserStory(DEMO_STORIES[pack.id] ?? "")}
              >
                🎤
              </button>
              <span className="mic-hint">마이크 클릭 (음성 입력 데모 채우기)</span>
            </div>
            <div className="hint-chips-container">
              <h4 className="hint-title">💡 이런 내용이 있으면 분석이 정확해져요:</h4>
              <div className="hint-chips">
                <button
                  className="hint-chip"
                  onClick={() => setUserStory(userStory + " 상대방 이름은 홍길동이고,")}
                >
                  👤 상대방 성함
                </button>
                <button
                  className="hint-chip"
                  onClick={() => setUserStory(userStory + " 피해 금액은 5,000만 원이고,")}
                >
                  💰 피해 금액/보증금
                </button>
                <button
                  className="hint-chip"
                  onClick={() => setUserStory(userStory + " 계약 만기일은 2026년 3월 31일입니다.")}
                >
                  📅 사건일/만기일
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="contract-dropzone-container">
            {!isScanning ? (
              <label className="dropzone-box">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="visually-hidden-input"
                  onChange={(e) => e.target.files?.[0] && handleContractUpload(e.target.files[0])}
                />
                <div className="dropzone-icon">📄</div>
                <h3 className="dropzone-title">임대차 계약서 사진 또는 PDF 올리기</h3>
                <p className="dropzone-desc">
                  스마트폰으로 찍은 계약서(JPG/PNG)나 스캔 파일(PDF)을 올리면 값을 자동으로 채워
                  드립니다.
                </p>
                <span className="btn-secondary dropzone-cta">계약서 파일 찾기</span>
              </label>
            ) : (
              <div className="scanner-hud-box">
                <div className="scanning-laser-line" />
                <div className="scanner-thumb">
                  {preview ? (
                    <img
                      src={preview}
                      alt="업로드한 계약서 미리보기"
                      className="scanner-thumb-img"
                    />
                  ) : (
                    <span className="scanner-thumb-placeholder">📄</span>
                  )}
                  <div className="scanner-progress-badge">{scanProgress}%</div>
                </div>
                <h3 className="scanner-title">계약서에서 값 읽는 중…</h3>
                <div className="scanner-bar-bg">
                  <div className="scanner-bar-fill" style={{ width: `${scanProgress}%` }} />
                </div>
              </div>
            )}

            {isContractAutoFilled && !isScanning && (
              <div className="upload-success-summary">
                <strong className="upload-success-title">
                  ✅ 계약서에서 아래 값을 채웠어요 — 편집 화면에서 맞는지 확인해 주세요
                </strong>
                <ul className="upload-success-list">
                  <li>임대인: 이수민</li>
                  <li>임차인: 김철수</li>
                  <li>보증금: 1억 2,000만 원</li>
                  <li>계약 만료: 2026년 6월 30일</li>
                  <li className="upload-success-wide">임차지: 부산시 해운대구 우동 456번지</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="story-footer">
          <button className="btn-secondary story-skip-btn" onClick={onSkip}>
            바로 초안 만들기 (빈 문서)
          </button>
          <button
            className="btn-primary"
            disabled={userStory.trim().length < 5 || isScanning}
            onClick={onSubmit}
          >
            문서 생성 시작 →
          </button>
        </div>
      </div>
    </div>
  );
}
