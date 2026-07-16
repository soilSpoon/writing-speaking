import { describe, it, expect } from "vitest";
import { fillTemplate, visibleSections, completionPercent } from "./fillTemplate";
import { situationPacks } from "../data/situationPacks";

const pack = situationPacks.deposit_refund;

describe("fillTemplate", () => {
  it("채워진 슬롯은 값, 빈 슬롯은 [라벨], 분기는 선택값으로 치환", () => {
    const out = fillTemplate(
      "{tenant_name} / {landlord_name} / {lease_type}",
      pack,
      { tenant_name: "김철수" },
      { lease_type: "월세" },
    );
    expect(out).toBe("김철수 / [임대인(수신인) 성함] / 월세");
  });
});

describe("visibleSections", () => {
  it("분기 조건에 따라 조항이 켜지고 꺼진다", () => {
    const 전세 = visibleSections(pack, {
      lease_type: "전세",
      registration: "둘 다 안 함",
      occupancy: "아직 거주 중",
    });
    const 월세이사 = visibleSections(pack, {
      lease_type: "월세",
      registration: "전입신고+확정일자 완료",
      occupancy: "이미 이사 나감",
    });
    // 전세+미등기+거주중: 월세공제·우선변제·임차권등기 조항 모두 빠짐
    expect(전세.map((s) => s.id)).not.toContain("deduction");
    expect(전세.map((s) => s.id)).not.toContain("registration_order");
    // 월세+등기+이사: 월세공제 + 우선변제 + 임차권등기 조항 모두 포함
    expect(월세이사.map((s) => s.id)).toContain("deduction");
    expect(월세이사.map((s) => s.id)).toContain("priority_note");
    expect(월세이사.map((s) => s.id)).toContain("registration_order");
  });
});

describe("completionPercent", () => {
  it("값 슬롯이 다 차면 100", () => {
    const full: Record<string, string> = {};
    Object.keys(pack.slots).forEach((k) => (full[k] = "x"));
    expect(completionPercent(pack, full)).toBe(100);
    expect(completionPercent(pack, {})).toBe(0);
  });
});
