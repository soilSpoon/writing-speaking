import type { SituationPack } from "../data/situationPacks";

/**
 * Simulates a structured AI parsing of a user's free text story.
 * It uses context-aware regex and heuristics to mock Gemini's slot-filling capability.
 */
export function simulateAIExtraction(story: string, pack: SituationPack): Record<string, string> {
  const slots: Record<string, string> = {};

  // Initialize all slots as empty strings
  Object.keys(pack.slots).forEach((key) => {
    slots[key] = "";
  });

  if (!story.trim()) return slots;

  // 1. Core Amount Extraction (Robust enough for commas, compound units like "18만 9,000원")
  const amountRegex =
    /([\d,]+\s*억\s*(?:[\d,]+\s*천)?\s*만?\s*원?|[\d,]+\s*만\s*(?:[\d,]+\s*)?원?|[\d,]+\s*원)/g;
  const amounts = story.match(amountRegex);

  // 2. Date Extraction
  const dateRegex = /(\d{4}년\s*\d{1,2}월\s*\d{1,2}일|\d{1,2}월\s*\d{1,2}일)/g;
  const dates = story.match(dateRegex);

  // 3. Name Parsing via Context Heuristics
  const parsedNames: any = {};

  // Title-First Regex (longer alternates FIRST to prevent greedy prefix matching, e.g. 사장님 over 사장)
  const titleFirstRegex =
    /(임차인|세입자|임대인|집주인|대표자|사장님|사장|대표|근로자|직원|구매자는|구매자|소비자)\s*([가-힣]{3})/g;
  let match;
  while ((match = titleFirstRegex.exec(story)) !== null) {
    const role = match[1];
    const name = match[2];
    if (role === "집주인" || role === "임대인") parsedNames.landlord = name;
    if (role === "세입자" || role === "임차인") parsedNames.tenant = name;
    if (role === "사장" || role === "사장님" || role === "대표자" || role === "대표")
      parsedNames.employer = name;
    if (role === "근로자" || role === "직원") parsedNames.employee = name;
    if (role === "구매자" || role === "구매자는" || role === "소비자") parsedNames.buyer = name;
  }

  // Name-First Regex (longer alternates FIRST, and we protect against overwriting highly-accurate title-first matches)
  const nameFirstRegex =
    /([가-힣]{3})\s*(?:임차인|세입자|임대인|집주인|대표자|사장님|사장|대표|근로자|직원|구매자는|구매자|소비자|씨|님)/g;
  while ((match = nameFirstRegex.exec(story)) !== null) {
    const name = match[1];
    const context = match[0];

    // Avoid mapping generic stop words as names
    if (
      !["보증금", "내용증", "임대차", "월세방", "계약서", "푸드"].some((word) =>
        name.includes(word),
      )
    ) {
      if ((context.includes("집주인") || context.includes("임대인")) && !parsedNames.landlord)
        parsedNames.landlord = name;
      if ((context.includes("세입자") || context.includes("임차인")) && !parsedNames.tenant)
        parsedNames.tenant = name;
      if ((context.includes("사장") || context.includes("대표")) && !parsedNames.employer)
        parsedNames.employer = name;
      if ((context.includes("근로자") || context.includes("직원")) && !parsedNames.employee)
        parsedNames.employee = name;
      if ((context.includes("구매자") || context.includes("소비자")) && !parsedNames.buyer)
        parsedNames.buyer = name;
    }
  }

  // Fallback candidate names
  const allNames = story.match(/[가-힣]{3}/g);
  const candidates =
    allNames?.filter(
      (n) =>
        ![
          "보증금",
          "내용증",
          "내용증명",
          "임대차",
          "임차인",
          "임대인",
          "월세방",
          "계약서",
          "집주인",
          "사장님",
          "근로자",
          "소비자",
          "구매자",
          "퇴직금",
          "회사명",
          "대박푸",
          "러블리",
          "푸드",
          "스타트",
        ].some((word) => n.includes(word)),
    ) || [];

  // Apply heuristics based on selected pack
  if (pack.id === "deposit_refund") {
    slots.landlord_name = parsedNames.landlord || (candidates.length > 0 ? candidates[0] : "");
    slots.tenant_name =
      parsedNames.tenant ||
      (candidates.length > 1
        ? candidates[1]
        : candidates.length > 0 && candidates[0] !== slots.landlord_name
          ? candidates[0]
          : "김철수");

    // Deposit Amount
    if (amounts && amounts.length > 0) {
      slots.deposit_amount = amounts[0];
    } else {
      const numMatch = story.match(/(\d+)\s*(?:만원|만)/);
      if (numMatch) slots.deposit_amount = `${parseInt(numMatch[1])}만 원`;
    }

    // Contract End Date
    if (dates && dates.length > 0) {
      slots.contract_end_date = dates[0];
    }

    // House Address (Extracted from Korean address structure: starting with 시/도/구/군)
    const addressKeywords = ["구", "시", "동", "길", "로", "동지", "호"];
    const sentences = story.split(/[.\n]/);
    const addressSentence = sentences.find((s) => addressKeywords.some((kw) => s.includes(kw)));

    const addressBlockRegex =
      /(?:[가-힣]+(?:시|도|구|군|동)\s+)+[가-힣a-zA-Z0-9-·\s]+(?:로|길|동|호)\s*\d+(?:-\d+)?/;

    if (addressSentence && addressSentence.length < 40) {
      const roadMatch = addressSentence.match(addressBlockRegex);
      if (roadMatch) {
        slots.house_address = roadMatch[0].trim();
      } else {
        slots.house_address = addressSentence.trim();
      }
    } else {
      const roadMatch = story.match(addressBlockRegex);
      if (roadMatch) {
        slots.house_address = roadMatch[0].trim();
      }
    }
  } else if (pack.id === "unpaid_wages") {
    slots.employer_name = parsedNames.employer || (candidates.length > 0 ? candidates[0] : "");
    slots.employee_name =
      parsedNames.employee ||
      (candidates.length > 1
        ? candidates[1]
        : candidates.length > 0 && candidates[0] !== slots.employer_name
          ? candidates[0]
          : "이영희");

    // Unpaid Amount
    if (amounts && amounts.length > 0) {
      slots.unpaid_amount = amounts[0];
    }

    // Quit Date
    if (dates && dates.length > 0) {
      slots.quit_date = dates[0];
    }

    // Company Name Heuristic: e.g., "대박푸드", "주식회사 XXX"
    const companyMatch = story.match(
      /([가-힣\w\s]+(?:푸드|스튜디오|컴퍼니|코리아|테크|상사|치킨|세탁소|식당|네트웍스|코퍼레이션|회사))/,
    );
    if (companyMatch) {
      slots.company_name = companyMatch[1].trim();
    }
  } else if (pack.id === "refund_denial") {
    slots.buyer_name = parsedNames.buyer || (candidates.length > 0 ? candidates[0] : "박지민");

    // Seller/Shop Name Heuristic
    const sellerMatch = story.match(/([가-힣\w\s]+(?:샵|룩|몰|스토어|닷컴|아웃렛|마켓))/);
    if (sellerMatch) {
      slots.seller_name = sellerMatch[1].trim();
    }

    // Product Name Heuristic
    const productKeywords = [
      "코트",
      "셔츠",
      "구두",
      "가방",
      "부츠",
      "헤드폰",
      "원피스",
      "패딩",
      "노트북",
      "티셔츠",
    ];
    const productWord = story.split(/\s+/).find((w) => productKeywords.some((k) => w.includes(k)));
    if (productWord) {
      slots.product_name = productWord.replace(/[조사은는을를이가]/g, "");
    }

    // Purchase Amount
    if (amounts && amounts.length > 0) {
      slots.purchase_amount = amounts[0];
    }

    // Receive Date
    if (dates && dates.length > 0) {
      slots.receive_date = dates[0];
    }
  }

  return slots;
}
