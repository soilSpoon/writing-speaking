export interface SlotDefinition {
  type: "string" | "number" | "date";
  label: string;
  placeholder: string;
  chips: string[]; // Recommended choices (AI-simulated or curated)
}

// 분기 슬롯: 문서에 값으로 삽입되지 않고, 어떤 조항(section)을 포함할지 "게이트"한다.
// 예: 전세/월세 여부, 전입신고·확정일자 여부, 거주/이사 여부 → 문서 내용 자체가 달라짐.
export interface BranchDefinition {
  label: string;
  options: string[];
  default: string;
}

export interface LawReference {
  id: string;
  title: string;
  article: string;
  lawId: string; // law.go.kr 법령ID (실시간 검증용)
  jo: string; // law.go.kr JO 코드 (6자리: 조4 + 가지2). 실시간 조문 조회용
  content: string; // 큐레이션 fallback (API 실패 시 표시)
  link: string; // 사람이 볼 원문 링크
}

export interface DocumentSection {
  id: string;
  law_id?: string;
  // condition 이 있으면, 해당 분기 값이 in 목록에 있을 때만 이 조항을 포함한다. 없으면 항상 포함.
  condition?: { branch: string; in: string[] };
  templates: {
    polite: string;
    default: string;
    firm: string;
  };
}

export interface SituationPack {
  id: string;
  title: string;
  documentType: string;
  icon: string;
  tags: string[];
  description: string;
  slots: Record<string, SlotDefinition>;
  branches?: Record<string, BranchDefinition>;
  sections: DocumentSection[];
  laws: Record<string, LawReference>;
  nextSteps: {
    title: string;
    description: string;
  }[];
}

export const situationPacks: Record<string, SituationPack> = {
  deposit_refund: {
    id: "deposit_refund",
    title: "전세/월세 보증금 미반환",
    documentType: "내용증명",
    icon: "🏠",
    tags: ["#전월세", "#돈·환불", "#계약"],
    description:
      "임대차 계약이 끝났는데도 집주인이 보증금을 돌려주지 않을 때, 법적 대응 전 공식 반환 청구를 서면으로 남깁니다.",
    slots: {
      tenant_name: {
        type: "string",
        label: "임차인(발신인) 성함",
        placeholder: "보내는 사람(세입자) 성함",
        chips: ["김철수", "김철수(대리인)"],
      },
      tenant_address: {
        type: "string",
        label: "임차인(발신인) 주소",
        placeholder: "우편물을 받을 발신인 현재 주소",
        chips: ["서울시 마포구 독막로 123, 302호", "현재 임차 주택과 동일"],
      },
      landlord_name: {
        type: "string",
        label: "임대인(수신인) 성함",
        placeholder: "받는 사람(집주인) 성함",
        chips: ["홍길동", "이수민(임대인의 법정대리인)", "주식회사 빌라파트너스"],
      },
      landlord_address: {
        type: "string",
        label: "임대인(수신인) 주소",
        placeholder: "내용증명을 보낼 집주인 주소",
        chips: ["계약서상 임대인 주소", "서울시 강남구 테헤란로 45"],
      },
      house_address: {
        type: "string",
        label: "임차 주택(목적물) 주소",
        placeholder: "임차했던 주택의 상세 주소",
        chips: ["서울시 마포구 독막로 123, 302호", "부산시 해운대구 우동 456번지"],
      },
      deposit_amount: {
        type: "string",
        label: "보증금 액수",
        placeholder: "예: 5,000만 원",
        chips: ["5,000만 원", "1억 2,000만 원", "3,500만 원"],
      },
      contract_end_date: {
        type: "string",
        label: "계약 만료일",
        placeholder: "예: 2026년 3월 31일",
        chips: ["2026년 6월 30일", "2026년 2월 28일", "합의 해지일(즉시)"],
      },
      written_date: {
        type: "date",
        label: "작성일(발송일)",
        placeholder: "예: 2026년 7월 16일",
        chips: [],
      },
    },
    branches: {
      lease_type: {
        label: "임대차 유형",
        options: ["전세", "월세", "반전세"],
        default: "전세",
      },
      registration: {
        label: "전입신고·확정일자",
        options: ["전입신고+확정일자 완료", "전입신고만 함", "둘 다 안 함"],
        default: "전입신고+확정일자 완료",
      },
      occupancy: {
        label: "현재 점유 상태",
        options: ["아직 거주 중", "이미 이사 나감"],
        default: "아직 거주 중",
      },
    },
    sections: [
      {
        id: "header",
        templates: {
          polite:
            "발신인(임차인): {tenant_name}\n주소: {tenant_address}\n수신인(임대인): {landlord_name}\n주소: {landlord_address}\n부동산의 표시: {house_address}\n\n제목: 임대차 계약 종료에 따른 보증금 반환 요청의 건",
          default:
            "발신인(임차인): {tenant_name}\n주소: {tenant_address}\n수신인(임대인): {landlord_name}\n주소: {landlord_address}\n부동산의 표시: {house_address}\n\n제목: 임대차 계약 만료에 따른 보증금 반환 청구",
          firm: "발신인(임차인): {tenant_name}\n주소: {tenant_address}\n수신인(임대인): {landlord_name}\n주소: {landlord_address}\n부동산의 표시: {house_address}\n\n제목: [최고] 임대차 보증금 반환 청구 및 법적 조치 예고",
        },
      },
      {
        id: "facts",
        templates: {
          polite:
            "1. 안녕하세요. 발신인은 위 부동산에 관하여 수신인과 {lease_type} 임대차 계약(보증금 {deposit_amount})을 체결한 임차인입니다. 본 계약이 {contract_end_date}에 종료됨에 따라, 보증금 반환 일정을 정중히 여쭙고자 서신을 드립니다.",
          default:
            "1. 발신인은 위 부동산에 관하여 수신인과 {lease_type} 임대차 계약(보증금 {deposit_amount})을 체결한 임차인입니다. 계약 종료일인 {contract_end_date}이 지났음에도 발신인은 수신인으로부터 보증금을 반환받지 못하고 있습니다.",
          firm: "1. 발신인은 위 부동산에 관하여 수신인과 {lease_type} 임대차 계약(보증금 {deposit_amount})을 체결한 임차인입니다. 계약은 {contract_end_date} 부로 적법하게 종료되었으나, 수신인은 정당한 사유 없이 보증금 반환 의무를 이행하지 않고 있습니다.",
        },
      },
      {
        id: "deduction",
        condition: { branch: "lease_type", in: ["월세", "반전세"] },
        templates: {
          polite:
            "2. 미납된 차임이 있는 경우 이를 정산한 잔액으로 반환받고자 하오니, 정산 내역을 알려주시면 성실히 협의하겠습니다.",
          default:
            "2. 발신인은 미납 차임이 있다면 이를 공제한 나머지 보증금의 반환을 구합니다. 다만 통상적인 원상회복 범위를 벗어난 금액의 일방적 공제에는 동의하지 않습니다.",
          firm: "2. 미납 차임 등 정당하게 공제 가능한 금액을 정산한 잔여 보증금은 즉시 반환되어야 합니다. 임대인이 근거 없는 금액을 임의 공제할 경우 이에 대해서도 법적으로 다툴 것입니다.",
        },
      },
      {
        id: "legal_basis",
        law_id: "housing_lease_4_2",
        templates: {
          polite:
            "3. 주택임대차보호법 제4조 제2항은 임대차가 끝난 경우에도 임차인이 보증금을 반환받을 때까지 임대차관계가 존속되는 것으로 보며, 민법 제618조에 따라 보증금 반환은 임대인의 의무입니다. 원만한 이행을 부탁드립니다.",
          default:
            "3. 주택임대차보호법 제4조 제2항에 따르면 임대차 종료 후에도 임차인이 보증금을 반환받을 때까지 임대차관계는 존속되며, 임대인의 보증금 반환 의무와 임차인의 주택 인도 의무는 동시이행 관계에 있습니다(민법 제618조).",
          firm: "3. 주택임대차보호법 제4조 제2항 및 민법 제618조에 따라 보증금 반환은 임대인의 법적 의무이며, 임차인의 주택 인도와 동시이행 관계에 있습니다. 이행 지체로 발신인에게 발생하는 손해에 대한 책임은 수신인에게 있습니다.",
        },
      },
      {
        id: "priority_note",
        condition: { branch: "registration", in: ["전입신고+확정일자 완료"] },
        templates: {
          polite:
            "4. 참고로 발신인은 전입신고와 확정일자를 갖추어 대항력과 우선변제권을 보유하고 있음을 알려드립니다.",
          default:
            "4. 발신인은 전입신고 및 확정일자를 갖추어 대항력과 우선변제권을 보유하고 있으므로, 보증금 회수를 위한 법적 절차에서 우선적 지위에 있습니다.",
          firm: "4. 발신인은 전입신고와 확정일자를 갖추어 대항력 및 우선변제권을 보유하고 있습니다. 따라서 경매 등 절차에서 우선변제를 받을 지위에 있으며, 이 점을 분명히 고지합니다.",
        },
      },
      {
        id: "registration_order",
        law_id: "housing_lease_3_3",
        condition: { branch: "occupancy", in: ["이미 이사 나감"] },
        templates: {
          polite:
            "5. 발신인은 이미 주택을 인도하였으므로, 대항력 유지를 위하여 주택임대차보호법 제3조의3에 따른 임차권등기명령을 신청할 예정임을 미리 알려드립니다.",
          default:
            "5. 발신인은 이미 이사하여 주택을 인도하였는바, 보증금을 반환받지 못한 상태에서 대항력을 잃지 않기 위해 주택임대차보호법 제3조의3에 따른 임차권등기명령을 신청할 것입니다.",
          firm: "5. 발신인은 이미 주택을 인도하였으므로, 보증금 미반환 시 주택임대차보호법 제3조의3에 따른 임차권등기명령을 즉시 신청할 것이며, 이는 향후 보증금 반환 소송의 확실한 근거가 됩니다.",
        },
      },
      {
        id: "warning",
        templates: {
          polite:
            "6. 모쪼록 대화로 원만히 해결되기를 바라오니, 본 서신 수령 후 보증금 반환 일정을 서면 또는 유선으로 회신해 주시면 감사하겠습니다.",
          default:
            "6. 본 서신 수령 후 7일 이내에 보증금 반환 일정을 제시해 주시기 바랍니다. 기한 내 회신이 없을 경우 임차권등기명령 신청 및 보증금 반환 청구 소송 등 법적 절차를 진행할 예정입니다.",
          firm: "6. 본 최고서 수령 후 7일 이내에 보증금 {deposit_amount}을 반환하지 않을 경우, 발신인은 관할 법원에 임차권등기명령 및 보증금 반환 청구 소송을 제기할 것이며, 그에 따른 소송비용과 지연손해금(민법상 법정이율)의 부담 책임은 수신인에게 있음을 고지합니다.",
        },
      },
      {
        id: "closing",
        templates: {
          polite: "위와 같이 정중히 요청드립니다.\n\n{written_date}\n발신인: {tenant_name} (인)",
          default: "위와 같이 통고합니다.\n\n{written_date}\n발신인: {tenant_name} (인)",
          firm: "위와 같이 최고합니다.\n\n{written_date}\n발신인: {tenant_name} (인)",
        },
      },
    ],
    laws: {
      housing_lease_4_2: {
        id: "housing_lease_4_2",
        title: "주택임대차보호법 제4조",
        article: "제4조 제2항 (임대차기간 등)",
        lawId: "001248",
        jo: "000400",
        content:
          "② 임대차기간이 끝난 경우에도 임차인이 보증금을 반환받을 때까지는 임대차관계가 존속되는 것으로 본다.",
        link: "https://www.law.go.kr/법령/주택임대차보호법/제4조",
      },
      housing_lease_3_3: {
        id: "housing_lease_3_3",
        title: "주택임대차보호법 제3조의3",
        article: "제3조의3 (임차권등기명령)",
        lawId: "001248",
        jo: "000303",
        content:
          "임대차가 끝난 후 보증금이 반환되지 아니한 경우 임차인은 임차주택의 소재지를 관할하는 지방법원에 임차권등기명령을 신청할 수 있다. 임차권등기가 마쳐지면 임차인은 대항력과 우선변제권을 취득하며, 이미 취득한 대항력이나 우선변제권은 그대로 유지된다.",
        link: "https://www.law.go.kr/법령/주택임대차보호법/제3조의3",
      },
      civil_618: {
        id: "civil_618",
        title: "민법 제618조",
        article: "제618조 (임대차의 의의)",
        lawId: "001706",
        jo: "061800",
        content:
          "임대차는 당사자 일방이 상대방에게 목적물을 사용, 수익하게 할 것을 약정하고 상대방이 이에 대하여 차임을 지급할 것을 약정함으로써 그 효력이 생긴다.",
        link: "https://www.law.go.kr/법령/민법/제618조",
      },
    },
    nextSteps: [
      {
        title: "우체국 내용증명 발송 (3부 인쇄)",
        description:
          '작성한 문서를 동일하게 3부 출력합니다. 봉투에 수신인/발신인 주소를 정확히 적은 뒤 우체국 창구에서 "내용증명 보냅니다"라고 하면, 1부는 우체국 보관, 1부는 수신인 발송, 1부는 접수 도장을 찍어 발신인에게 돌려줍니다. 내용증명은 강제력은 없지만 "언제 어떤 내용을 통지했는지"를 공적으로 증명하는 자료가 됩니다.',
      },
      {
        title: "임차권등기명령 신청 (이사 예정·완료 시)",
        description:
          "보증금을 받지 못한 채 이사해야 한다면, 대항력을 잃지 않기 위해 관할 법원에 임차권등기명령을 신청하는 것이 안전합니다. 본 내용증명 사본은 임대인에게 반환을 청구한 사실을 뒷받침하는 자료로 활용될 수 있습니다.",
      },
    ],
  },
  unpaid_wages: {
    id: "unpaid_wages",
    title: "퇴직 후 임금 및 퇴직금 체불",
    documentType: "내용증명(최고서)",
    icon: "💼",
    tags: ["#직장", "#돈·환불", "#계약"],
    description:
      "퇴사 후 14일이 지났는데도 밀린 월급이나 퇴직금을 주지 않을 때, 고용노동부 진정 전 사업주에게 서면으로 지급을 청구합니다.",
    slots: {
      employee_name: {
        type: "string",
        label: "근로자(발신인) 성함",
        placeholder: "보내는 사람(근로자) 성함",
        chips: ["이영희", "이영희(퇴직근로자)"],
      },
      sender_address: {
        type: "string",
        label: "근로자(발신인) 주소",
        placeholder: "우편물을 받을 발신인 주소",
        chips: ["서울시 관악구 신림로 22", "경기도 성남시 분당구 판교로 10"],
      },
      employer_name: {
        type: "string",
        label: "대표자(수신인) 성함",
        placeholder: "받는 사람(사업주) 성함",
        chips: ["김태평", "박대표(대표이사)"],
      },
      recipient_address: {
        type: "string",
        label: "사업장(수신인) 주소",
        placeholder: "내용증명을 보낼 회사 주소",
        chips: ["사업자등록증상 소재지", "서울시 강서구 마곡중앙로 100"],
      },
      company_name: {
        type: "string",
        label: "회사명(사업장명)",
        placeholder: "근무하셨던 회사 이름",
        chips: ["테크스타트업", "(주)대박푸드", "청결세탁소"],
      },
      unpaid_amount: {
        type: "string",
        label: "체불 임금/퇴직금 합계",
        placeholder: "예: 420만 원",
        chips: ["350만 원 (월급 1회분)", "780만 원 (월급 및 퇴직금)", "150만 원 (미지급 수당)"],
      },
      quit_date: {
        type: "string",
        label: "퇴사일(근로 종료일)",
        placeholder: "예: 2026년 5월 15일",
        chips: ["2026년 4월 30일", "2026년 1월 15일"],
      },
      written_date: {
        type: "date",
        label: "작성일(발송일)",
        placeholder: "예: 2026년 7월 16일",
        chips: [],
      },
    },
    sections: [
      {
        id: "header",
        templates: {
          polite:
            "발신인: {employee_name}\n주소: {sender_address}\n수신인: {company_name} 대표 {employer_name}\n주소: {recipient_address}\n\n제목: 퇴직에 따른 미지급 임금 및 퇴직금 정산 요청",
          default:
            "발신인: {employee_name}\n주소: {sender_address}\n수신인: {company_name} 대표 {employer_name}\n주소: {recipient_address}\n\n제목: 체불 임금 및 퇴직금 지급 청구",
          firm: "발신인: {employee_name}\n주소: {sender_address}\n수신인: {company_name} 대표 {employer_name}\n주소: {recipient_address}\n\n제목: [최고] 체불 임금 지급 청구 및 노동청 진정 예고",
        },
      },
      {
        id: "facts",
        templates: {
          polite:
            "1. 발신인은 {company_name}에서 근무하다 {quit_date} 자로 퇴사하였습니다. 미지급된 급여 및 퇴직금 총 {unpaid_amount}의 정산 일정을 확인해 주시면 감사하겠습니다.",
          default:
            "1. 발신인은 {company_name}에서 근무하다 {quit_date} 자로 퇴직한 근로자입니다. 근로기준법상 퇴직 후 14일 이내에 모든 금품이 청산되어야 함에도, 현재까지 임금 및 퇴직금 {unpaid_amount}이 지급되지 않고 있습니다.",
          firm: "1. 발신인은 {quit_date} 부로 {company_name}에서 퇴직하였으나, 법정 기한인 14일이 지난 현재까지 임금 및 퇴직금 {unpaid_amount}을 지급받지 못하였습니다.",
        },
      },
      {
        id: "legal_basis",
        law_id: "labor_standards_36",
        templates: {
          polite:
            "2. 근로기준법 제36조에 따라 사용자는 근로자가 퇴직한 경우 그 사유가 발생한 날부터 14일 이내에 임금 등 모든 금품을 지급하여야 합니다. 조속한 처리를 부탁드립니다.",
          default:
            "2. 근로기준법 제36조(금품 청산)에 따라 사용자는 퇴직일부터 14일 이내에 임금·퇴직금 등 모든 금품을 지급할 의무가 있습니다. 이를 위반할 경우 형사처벌의 대상이 될 수 있습니다.",
          firm: "2. 근로기준법 제36조에 따라 귀하는 퇴직 후 14일 이내에 모든 금품을 청산할 의무가 있으며, 위반 시 동법 제109조에 따라 처벌될 수 있습니다. 또한 미청산 금액에 대해서는 지연이자가 발생할 수 있습니다.",
        },
      },
      {
        id: "warning",
        templates: {
          polite: "3. 회사 사정이 여의치 않다면 미리 연락 주시면 지급 일정을 협의하겠습니다.",
          default:
            "3. 본 서면 수령 후 7일 이내에 체불 금액이 지급되지 않을 경우, 발신인은 관할 지방고용노동청에 진정을 제기할 예정입니다.",
          firm: "3. 본 최고서 수령 후 7일 이내에 체불 금품 {unpaid_amount}을 지급하지 않을 경우, 발신인은 관할 고용노동청에 진정을 제기하고 필요한 민·형사상 절차를 진행할 것입니다.",
        },
      },
      {
        id: "closing",
        templates: {
          polite: "위와 같이 정중히 요청드립니다.\n\n{written_date}\n발신인: {employee_name} (인)",
          default: "위와 같이 통고합니다.\n\n{written_date}\n발신인: {employee_name} (인)",
          firm: "위와 같이 최고합니다.\n\n{written_date}\n발신인: {employee_name} (인)",
        },
      },
    ],
    laws: {
      labor_standards_36: {
        id: "labor_standards_36",
        title: "근로기준법 제36조",
        article: "제36조 (금품 청산)",
        lawId: "001872",
        jo: "003600",
        content:
          "사용자는 근로자가 사망 또는 퇴직한 경우에는 그 지급 사유가 발생한 때부터 14일 이내에 임금, 보상금, 그 밖의 모든 금품을 지급하여야 한다. 다만, 특별한 사정이 있을 경우에는 당사자 사이의 합의에 의하여 기일을 연장할 수 있다.",
        link: "https://www.law.go.kr/법령/근로기준법/제36조",
      },
    },
    nextSteps: [
      {
        title: "고용노동부 진정 접수",
        description:
          '내용증명 발송 후에도 지급되지 않으면 "고용노동부 민원마당"에서 임금체불 진정서를 온라인으로 접수할 수 있습니다. 본 내용증명은 지급을 청구한 사실을 뒷받침하는 자료가 됩니다.',
      },
      {
        title: "근로감독관 조사 대응",
        description:
          "진정이 접수되면 1~2주 내 고용노동청에서 출석 연락이 옵니다. 근로계약서, 급여명세서, 통장 입금 내역 등과 함께 본 내용증명을 준비하면 사실관계 입증에 도움이 됩니다.",
      },
    ],
  },
  refund_denial: {
    id: "refund_denial",
    title: "인터넷 쇼핑몰 환불 거부",
    documentType: "내용증명",
    icon: "🛍️",
    tags: ["#돈·환불", "#소비자", "#계약"],
    description:
      '"세일 상품이라서" 같은 자체 약관을 이유로 법정 7일 이내 청약철회를 거부당했을 때, 청약철회 이행을 서면으로 청구합니다.',
    slots: {
      buyer_name: {
        type: "string",
        label: "소비자(발신인) 성함",
        placeholder: "보내는 사람(소비자) 성함",
        chips: ["박지민", "박지민(구매자)"],
      },
      sender_address: {
        type: "string",
        label: "소비자(발신인) 주소",
        placeholder: "우편물을 받을 발신인 주소",
        chips: ["서울시 노원구 동일로 100", "인천시 연수구 송도과학로 5"],
      },
      seller_name: {
        type: "string",
        label: "쇼핑몰 상호/대표자명",
        placeholder: "받는 사람(쇼핑몰 및 대표자)",
        chips: ["주식회사 트렌디룩 대표이사", "러블리샵 (대표 황미정)"],
      },
      recipient_address: {
        type: "string",
        label: "쇼핑몰(수신인) 주소",
        placeholder: "사업자정보에 표시된 쇼핑몰 주소",
        chips: ["사업자정보 표시 소재지", "경기도 성남시 분당구 판교역로 12"],
      },
      product_name: {
        type: "string",
        label: "구매 상품명",
        placeholder: "예: 캐시미어 울 코트 (베이지)",
        chips: ["프리미엄 린넨 셔츠", "가죽 첼시 부츠 245mm", "블루투스 헤드폰"],
      },
      purchase_amount: {
        type: "string",
        label: "결제 금액",
        placeholder: "예: 18만 9,000원",
        chips: ["25만 원", "8만 9,000원", "45만 3,000원"],
      },
      receive_date: {
        type: "string",
        label: "상품 수령일",
        placeholder: "배송이 완료되어 물건을 받은 날",
        chips: ["2026년 7월 10일", "2026년 7월 15일"],
      },
      written_date: {
        type: "date",
        label: "작성일(발송일)",
        placeholder: "예: 2026년 7월 16일",
        chips: [],
      },
    },
    sections: [
      {
        id: "header",
        templates: {
          polite:
            "발신인: {buyer_name}\n주소: {sender_address}\n수신인: {seller_name}\n주소: {recipient_address}\n\n제목: 전자상거래법에 따른 청약철회(환불) 이행 요청",
          default:
            "발신인: {buyer_name}\n주소: {sender_address}\n수신인: {seller_name}\n주소: {recipient_address}\n\n제목: 청약철회 거부에 대한 환불 청구",
          firm: "발신인: {buyer_name}\n주소: {sender_address}\n수신인: {seller_name}\n주소: {recipient_address}\n\n제목: [최고] 위법한 청약철회 거부에 대한 환불 청구 및 소비자원 신고 예고",
        },
      },
      {
        id: "facts",
        templates: {
          polite:
            "1. 발신인은 귀사 쇼핑몰에서 {product_name}(결제금액 {purchase_amount})을 구매하여 {receive_date}에 수령하였고, 수령일로부터 7일 이내에 청약철회를 요청하였으나 거부 통보를 받았습니다.",
          default:
            '1. 발신인은 귀사 쇼핑몰에서 구매한 {product_name}(결제금액 {purchase_amount})에 대해 수령일 {receive_date}로부터 법정 기한인 7일 이내에 청약철회를 요청하였습니다. 그러나 귀사는 "자체 환불 불가" 등을 이유로 이를 거부하고 있습니다.',
          firm: '1. 발신인은 귀사 쇼핑몰에서 {product_name}(결제금액 {purchase_amount})을 구매하여 {receive_date}에 수령하였고, 법정 기한 이내에 적법하게 청약철회의 의사를 표시하였습니다. 그러나 귀사는 "세일 상품" 등 전자상거래법에 어긋나는 자체 약관을 이유로 이행을 거부하고 있습니다.',
        },
      },
      {
        id: "legal_basis",
        law_id: "e_commerce_17",
        templates: {
          polite:
            "2. 전자상거래법 제17조에 따라 소비자는 상품 수령 후 7일 이내에 청약철회를 할 수 있습니다. 환불 절차를 진행해 주시면 감사하겠습니다.",
          default:
            "2. 전자상거래법 제17조에 따라 소비자의 귀책사유로 상품이 멸실·훼손된 경우가 아니라면 7일 이내 청약철회가 가능합니다. 이를 제한하는 쇼핑몰 자체 약관은 소비자에게 불리하여 효력이 없을 수 있습니다.",
          firm: "2. 전자상거래법 제17조에 따른 7일 이내 청약철회는 법이 보장하는 소비자의 권리이며, 이를 배제하는 자체 약관은 소비자에게 불리한 범위에서 효력이 없습니다. 청약철회를 거부하는 행위는 관계 기관의 시정 대상이 될 수 있습니다.",
        },
      },
      {
        id: "warning",
        templates: {
          polite: "3. 반품 접수 및 환불 처리가 정상적으로 이루어지도록 조치해 주시기 바랍니다.",
          default:
            "3. 본 서면 수령 후 3일 이내에 결제대금 {purchase_amount}의 환불을 완료해 주십시오. 계속 거부될 경우 한국소비자원 피해구제 신청 등을 진행하겠습니다.",
          firm: "3. 본 서면 수령 후 3일 이내에 결제대금 {purchase_amount} 전액을 환불하지 않을 경우, 발신인은 한국소비자원(1372)에 피해구제를 신청하고 관할 기관에 신고할 것입니다.",
        },
      },
      {
        id: "closing",
        templates: {
          polite: "위와 같이 정중히 요청드립니다.\n\n{written_date}\n발신인: {buyer_name} (인)",
          default: "위와 같이 통고합니다.\n\n{written_date}\n발신인: {buyer_name} (인)",
          firm: "위와 같이 최고합니다.\n\n{written_date}\n발신인: {buyer_name} (인)",
        },
      },
    ],
    laws: {
      e_commerce_17: {
        id: "e_commerce_17",
        title: "전자상거래법 제17조",
        article: "제17조 (청약철회등)",
        lawId: "009318",
        jo: "001700",
        content:
          "통신판매업자와 재화등의 구매에 관한 계약을 체결한 소비자는 계약내용에 관한 서면을 받은 날부터 7일 이내에 청약철회등을 할 수 있다. 다만, 소비자에게 책임 있는 사유로 재화등이 멸실되거나 훼손된 경우 등에는 청약철회등이 제한될 수 있다.",
        link: "https://www.law.go.kr/법령/전자상거래등에서의소비자보호에관한법률/제17조",
      },
    },
    nextSteps: [
      {
        title: "1372 소비자상담센터 접수",
        description:
          '국번없이 "1372"로 전화하거나 온라인 소비자상담센터에 상담을 신청할 수 있습니다. 본 내용증명은 청약철회를 적법하게 요청한 사실을 뒷받침하는 자료가 됩니다.',
      },
      {
        title: "신용카드 할부 항변권 신청",
        description:
          "신용카드로 20만 원 이상, 3개월 이상 할부 결제한 경우라면 카드사에 할부항변권을 행사할 수 있습니다. 본 내용증명 사본을 첨부하면 카드사 심사에 도움이 될 수 있습니다.",
      },
    ],
  },
};
