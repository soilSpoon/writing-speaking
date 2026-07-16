import { describe, it, expect } from "vitest";
import { extractArticleText } from "./lawApi";

// law.go.kr lawService.do 가 돌려주는 XML 형태(한글 태그 + CDATA)를 파싱하는지 검증.
// 네트워크·DOM 없이 순수 함수만 테스트 → 노드에서 그대로 돈다.
describe("extractArticleText", () => {
  it("조문내용·항내용을 문서 순서대로 뽑아낸다", () => {
    const xml = `<법령><조문단위>
      <조문내용><![CDATA[제4조(임대차기간 등)]]></조문내용>
      <항><항내용><![CDATA[① 기간을 정하지 아니한 임대차는 그 기간을 2년으로 본다.]]></항내용></항>
      <항><항내용><![CDATA[② 임대차기간이 끝난 경우에도 임차인이 보증금을 반환받을 때까지는 임대차관계가 존속되는 것으로 본다.]]></항내용></항>
    </조문단위></법령>`;
    const text = extractArticleText(xml);
    expect(text).toContain("제4조(임대차기간 등)");
    expect(text).toContain("보증금을 반환받을 때까지는 임대차관계가 존속");
    // 순서 보존: 조문내용이 항내용보다 먼저
    expect(text.indexOf("제4조")).toBeLessThan(text.indexOf("① 기간"));
  });

  it("조문이 없는(에러) 응답은 빈 문자열", () => {
    expect(extractArticleText(`<Law>일치하는 법령이 없습니다.</Law>`)).toBe("");
    expect(extractArticleText(`{}`)).toBe("");
  });
});
