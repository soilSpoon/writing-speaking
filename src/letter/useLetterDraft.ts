import { useMemo, useState } from "react";
import { situationPacks, type SituationPack } from "../data/situationPacks";
import { completionPercent, visibleSections } from "./fillTemplate";

export type Tone = "polite" | "default" | "firm";

// 작성일(발송일) 기본값: 오늘 (한국식 표기). 사연에서 뽑는 값이 아니라 발송 시점.
const todayKorean = () => {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

const defaultBranches = (pack: SituationPack): Record<string, string> => {
  const b: Record<string, string> = {};
  Object.entries(pack.branches ?? {}).forEach(([key, def]) => (b[key] = def.default));
  return b;
};

// "작성 중인 내용증명"이라는 하나의 개념(슬롯·분기·톤 + 파생값)을 응집한 훅.
// funnel의 step 이동·모달 상태는 이 훅의 관심사가 아니라 App(오케스트레이터)이 소유한다.
export function useLetterDraft() {
  const [packId, setPackId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Record<string, string>>({});
  const [branches, setBranches] = useState<Record<string, string>>({});
  const [tone, setTone] = useState<Tone>("default");

  const pack = packId ? situationPacks[packId] : null;

  const selectPack = (id: string) => {
    setPackId(id);
    setSlots({});
    setBranches(defaultBranches(situationPacks[id]));
    setTone("default");
  };

  const clearPack = () => setPackId(null);

  const setSlot = (key: string, value: string) => setSlots((prev) => ({ ...prev, [key]: value }));
  const setBranch = (key: string, value: string) =>
    setBranches((prev) => ({ ...prev, [key]: value }));

  // 여러 슬롯을 한 번에 채움 (OCR/음성 데모용). 기존 값에 병합.
  const mergeSlots = (partial: Record<string, string>) =>
    setSlots((prev) => ({ ...prev, ...partial }));

  // Gemini/시뮬레이터 추출 결과 반영 (작성일은 오늘로 기본 채움)
  const applyExtractedSlots = (extracted: Record<string, string>) =>
    setSlots({ ...extracted, written_date: extracted.written_date || todayKorean() });

  // "바로 초안 만들기" — 빈 슬롯(작성일만 오늘)
  const initEmptySlots = () => {
    if (!pack) return;
    const empty: Record<string, string> = {};
    Object.keys(pack.slots).forEach((k) => (empty[k] = k === "written_date" ? todayKorean() : ""));
    setSlots(empty);
  };

  const completion = useMemo(() => (pack ? completionPercent(pack, slots) : 0), [pack, slots]);
  const sections = useMemo(() => (pack ? visibleSections(pack, branches) : []), [pack, branches]);

  return {
    pack,
    slots,
    branches,
    tone,
    completion,
    sections,
    selectPack,
    clearPack,
    setSlot,
    setBranch,
    setTone,
    mergeSlots,
    applyExtractedSlots,
    initEmptySlots,
  };
}

export type LetterDraft = ReturnType<typeof useLetterDraft>;
