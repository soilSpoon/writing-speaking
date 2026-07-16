import type { SituationPack, DocumentSection } from "../data/situationPacks";

// 템플릿의 {키} 치환 단일 출처(single source of truth).
// 이전에는 렌더/인쇄/복사 3곳에 같은 정규식 치환이 복제돼 있었다 → 여기로 통일.
// - 값 슬롯: 채워졌으면 값, 아니면 [라벨] placeholder
// - 분기 슬롯(lease_type 등): 항상 현재 선택값 (placeholder 없음)
const PLACEHOLDER = /\{([a-zA-Z0-9_]+)\}/g;

export function resolveKey(
  key: string,
  pack: SituationPack,
  slots: Record<string, string>,
  branches: Record<string, string>,
): { text: string; kind: "slot" | "branch"; filled: boolean } {
  if (pack.slots[key]) {
    const value = slots[key]?.trim() ?? "";
    return value
      ? { text: value, kind: "slot", filled: true }
      : { text: `[${pack.slots[key].label}]`, kind: "slot", filled: false };
  }
  if (branches[key] !== undefined) {
    return { text: branches[key], kind: "branch", filled: true };
  }
  return { text: `{${key}}`, kind: "slot", filled: false };
}

// 한 템플릿 문자열을 평문으로 치환 (복사·인쇄용)
export function fillTemplate(
  template: string,
  pack: SituationPack,
  slots: Record<string, string>,
  branches: Record<string, string>,
): string {
  return template.replace(PLACEHOLDER, (_, key) => resolveKey(key, pack, slots, branches).text);
}

// 어떤 분기 값에서 실제로 포함되는 섹션만 추린다 (조건부 조항)
export function visibleSections(
  pack: SituationPack,
  branches: Record<string, string>,
): DocumentSection[] {
  return pack.sections.filter(
    (s) => !s.condition || s.condition.in.includes(branches[s.condition.branch]),
  );
}

// 보이는 섹션 전체를 평문 문서로 (클립보드 복사·인쇄 미리보기)
export function draftToPlainText(
  pack: SituationPack,
  slots: Record<string, string>,
  branches: Record<string, string>,
  tone: "polite" | "default" | "firm",
): string {
  return visibleSections(pack, branches)
    .map((s) => fillTemplate(s.templates[tone], pack, slots, branches))
    .join("\n\n");
}

// 값 슬롯 기준 완성도(%). 분기 슬롯은 항상 값이 있으므로 제외.
export function completionPercent(pack: SituationPack, slots: Record<string, string>): number {
  const keys = Object.keys(pack.slots);
  if (keys.length === 0) return 0;
  const filled = keys.filter((k) => slots[k]?.trim()).length;
  return Math.round((filled / keys.length) * 100);
}
