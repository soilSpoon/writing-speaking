import { useEffect, useState } from "react";
import { Agentation } from "agentation";

import { Funnel } from "./components/Funnel";
import { simulateAIExtraction } from "./utils/aiSimulator";
import { extractEntitiesWithGemini } from "./utils/geminiApi";
import { useLetterDraft } from "./letter/useLetterDraft";
import { HomeStep } from "./letter/HomeStep";
import { StoryStep } from "./letter/StoryStep";
import { EditorStep } from "./letter/EditorStep";
import { ExporterStep } from "./letter/ExporterStep";
import { SlotEditorModal } from "./letter/SlotEditorModal";
import { LawReferenceModal } from "./letter/LawReferenceModal";
import "./App.css";

type Step = "home" | "story" | "loading" | "editor" | "exporter";

// Gemini는 서버 프록시(/api/gemini)를 통해 호출한다. 서버에 키가 없거나 호출 실패 시
// 아래 추출 로직이 로컬 휴리스틱 시뮬레이터로 자동 폴백한다.

const LOADING_CUES = [
  { text: "사연 분석 중…", sub: "날짜·인물·금액 등 핵심 정보를 구조화하는 중입니다." },
  { text: "문서 초안 조립 중…", sub: "구조화된 정보와 큐레이션된 조문 포인터를 결합합니다." },
  { text: "법령 포인터 매칭…", sub: "각 조문은 문서에서 탭할 때 law.go.kr로 실시간 검증됩니다." },
];

function App() {
  const [step, setStep] = useState<Step>("home");
  const [userStory, setUserStory] = useState("");
  const [activeSlotKey, setActiveSlotKey] = useState<string | null>(null);
  const [activeLawId, setActiveLawId] = useState<string | null>(null);
  const [loadingCue, setLoadingCue] = useState(0);

  const draft = useLetterDraft();
  const { pack } = draft;

  // 사연 → 슬롯 추출(Gemini, 실패 시 시뮬레이터) 후 편집 화면으로 전이
  useEffect(() => {
    if (step !== "loading" || !pack) return;
    let cancelled = false;

    (async () => {
      setLoadingCue(0);
      let extracted: Record<string, string> = {};
      try {
        extracted = await extractEntitiesWithGemini(userStory, pack);
      } catch (err) {
        console.error("Gemini 추출 실패 → 시뮬레이터 폴백:", err);
        extracted = simulateAIExtraction(userStory, pack);
      }
      if (cancelled) return;

      setLoadingCue(1);
      await new Promise((r) => setTimeout(r, 700));
      if (cancelled) return;
      setLoadingCue(2);
      await new Promise((r) => setTimeout(r, 700));
      if (cancelled) return;

      draft.applyExtractedSlots(extracted);
      setStep("editor");
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, userStory, pack]);

  const goHome = () => {
    draft.clearPack();
    setStep("home");
  };

  const selectPack = (packId: string) => {
    draft.selectPack(packId);
    setUserStory("");
    setStep("story");
  };

  const skipToDraft = () => {
    draft.initEmptySlots();
    setStep("editor");
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <button className="brand" onClick={goHome} aria-label="처음으로">
          <span className="brand-logo" aria-hidden="true">
            🖋️
          </span>
          <span>말보단글로</span>
        </button>
        <div className="user-status">
          <span className="user-status-text">
            {step === "editor" && pack ? `${pack.icon} ${pack.title}` : "Google Social Good 2026"}
          </span>
        </div>
      </header>

      <main className="main-content">
        <Funnel step={step}>
          <Funnel.Step name="home">
            <HomeStep onSelectPack={selectPack} />
          </Funnel.Step>

          <Funnel.Step name="story">
            {pack && (
              <StoryStep
                pack={pack}
                userStory={userStory}
                setUserStory={setUserStory}
                onSubmit={() => setStep("loading")}
                onSkip={skipToDraft}
                onBack={goHome}
                mergeSlots={draft.mergeSlots}
                setBranch={draft.setBranch}
              />
            )}
          </Funnel.Step>

          <Funnel.Step name="loading">
            <div className="loading-container">
              <div className="loading-paper" aria-hidden="true">
                <div className="loading-line" />
                <div className="loading-line" />
                <div className="loading-line" />
                <div className="loading-line" />
                <div className="loading-line" />
              </div>
              <h2 className="loading-text">{LOADING_CUES[loadingCue].text}</h2>
              <p className="loading-subtext">{LOADING_CUES[loadingCue].sub}</p>
            </div>
          </Funnel.Step>

          <Funnel.Step name="editor">
            <EditorStep
              draft={draft}
              onSlotClick={setActiveSlotKey}
              onLawClick={setActiveLawId}
              onProceed={() => setStep("exporter")}
            />
          </Funnel.Step>

          <Funnel.Step name="exporter">
            <ExporterStep
              draft={draft}
              onBackToEditor={() => setStep("editor")}
              onRestart={goHome}
            />
          </Funnel.Step>
        </Funnel>
      </main>

      {activeSlotKey && pack && (
        <SlotEditorModal
          pack={pack}
          slotKey={activeSlotKey}
          currentValue={draft.slots[activeSlotKey] ?? ""}
          onSave={(value) => {
            draft.setSlot(activeSlotKey, value);
            setActiveSlotKey(null);
          }}
          onClose={() => setActiveSlotKey(null)}
        />
      )}

      {activeLawId && pack?.laws[activeLawId] && (
        <LawReferenceModal law={pack.laws[activeLawId]} onClose={() => setActiveLawId(null)} />
      )}

      {import.meta.env.DEV && <Agentation />}
    </div>
  );
}

export default App;
