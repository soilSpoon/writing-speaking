import { describe, it, expect } from "vitest";
import { situationPacks } from "../data/situationPacks";
import { simulateAIExtraction } from "./aiSimulator";

describe("AI Heuristic Extraction Simulator Test Suite (TDD)", () => {
  it("should extract deposit refund slots correctly from realistic story", () => {
    const pack = situationPacks.deposit_refund;
    const story =
      "안녕하세요. 저는 세입자 김지수이고요, 집주인 홍길동한테 보증금 5,000만 원 돌려달라고 사정하고 있습니다. 원래 2026년 3월 31일 만기였는데 돈 없다고 안 주네요. 방 주소는 서울시 마포구 독막로 123입니다.";

    const extracted = simulateAIExtraction(story, pack);

    expect(extracted.landlord_name).toBe("홍길동");
    expect(extracted.tenant_name).toBe("김지수");
    expect(extracted.deposit_amount).toBe("5,000만 원");
    expect(extracted.contract_end_date).toBe("2026년 3월 31일");
    expect(extracted.house_address).toBe("서울시 마포구 독막로 123");
  });

  it("should extract unpaid wages slots correctly", () => {
    const pack = situationPacks.unpaid_wages;
    const story =
      "대박푸드 사장님 김태평 씨가 제 퇴직금하고 월급 밀린 거 420만 원을 퇴사한 지 14일 지났는데도 안 줘요. 제가 2026년 5월 15일 퇴사했거든요. 저 근로자 이영희입니다.";

    const extracted = simulateAIExtraction(story, pack);

    expect(extracted.employer_name).toBe("김태평");
    expect(extracted.employee_name).toBe("이영희");
    expect(extracted.company_name).toBe("대박푸드");
    expect(extracted.unpaid_amount).toBe("420만 원");
    expect(extracted.quit_date).toBe("2026년 5월 15일");
  });

  it("should extract shopping mall refund denial slots correctly", () => {
    const pack = situationPacks.refund_denial;
    const story =
      "러블리샵에서 7월 15일에 18만 9,000원짜리 캐시미어 울 코트 받았어요. 입어보지도 않고 바로 환불해달라고 했는데 세일 상품이라고 거절당했습니다. 구매자는 박지민입니다.";

    const extracted = simulateAIExtraction(story, pack);

    expect(extracted.buyer_name).toBe("박지민");
    expect(extracted.seller_name).toBe("러블리샵");
    expect(extracted.product_name).toBe("코트");
    expect(extracted.purchase_amount).toBe("18만 9,000원");
    expect(extracted.receive_date).toBe("7월 15일");
  });

  it("should return empty slots when story is empty", () => {
    const pack = situationPacks.deposit_refund;
    const extracted = simulateAIExtraction("", pack);

    expect(extracted.landlord_name).toBe("");
    expect(extracted.deposit_amount).toBe("");
    expect(extracted.contract_end_date).toBe("");
    expect(extracted.house_address).toBe("");
  });
});
