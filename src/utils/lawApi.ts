// 국가법령정보 공동활용 Open API (law.go.kr) 실시간 조문 검증.
//
// 왜 이게 "AI 제안 → API 증명"의 핵심인가:
//  - 상황 팩에는 조문 "포인터"(법령ID + JO 코드)만 큐레이션해 두고,
//  - 실제 조문 텍스트는 이 API로 실시간 fetch 해서 "그 조문이 실재함"을 증명한다.
//  - 조문이 존재하지 않으면(found=false) 인용을 신뢰하지 않는다 = 할루시네이션 게이트.
//
// 두 가지 실측 근거(2026-07-16 확인):
//  - CORS 가 열려 있어(Access-Control-Allow-Origin: *) 브라우저에서 직접 호출 가능(프록시 불필요).
//  - 공용 test 키는 JSON 이 깨져 {} 를 반환하므로 반드시 type=XML 로 요청한다.

const OC = "test"; // ponytail: 공용 개발키. 실서비스 전환 시 발급 OC + 고정 서버 IP 로 교체.
const BASE = "https://www.law.go.kr/DRF/lawService.do";

export interface LawFetchResult {
  found: boolean; // law.go.kr 에 해당 조문이 실재하는가
  text: string; // 실시간으로 가져온 조문 원문 (없으면 "")
  apiUrl: string; // 검증에 사용한 정확한 API 호출 URL (증거)
}

// XML 문자열에서 조문·항·호 내용을 문서 순서대로 추출한다.
// DOMParser 대신 정규식을 쓰는 이유: 노드/브라우저 양쪽에서 동작 → 테스트 가능(네트워크·DOM 불필요).
export function extractArticleText(xml: string): string {
  const pieces: string[] = [];
  const re = /<(조문내용|항내용|호내용)>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const inner = m[2]
      .replace(/<!\[CDATA\[/g, "")
      .replace(/\]\]>/g, "")
      .trim();
    if (inner) pieces.push(inner);
  }
  return pieces.join("\n");
}

// 특정 법령의 특정 조문(JO)을 실시간 조회한다.
// lawId: 법령ID (예: 주택임대차보호법 "001248"), jo: 6자리 JO 코드 (예: 제4조 "000400", 제3조의3 "000303")
export async function fetchLawArticle(lawId: string, jo: string): Promise<LawFetchResult> {
  const apiUrl = `${BASE}?OC=${OC}&target=law&type=XML&ID=${lawId}&JO=${jo}`;
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) return { found: false, text: "", apiUrl };
    const text = extractArticleText(await res.text());
    return { found: text.length > 0, text, apiUrl };
  } catch {
    // 네트워크 실패 시 조용히 실패 처리 → 호출부가 큐레이션된 fallback 텍스트를 쓰게 한다.
    return { found: false, text: "", apiUrl };
  }
}
