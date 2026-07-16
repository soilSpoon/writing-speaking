import { test, expect } from "@playwright/test";

test.describe("Law Document Generator Full HD Demo (A to Z Hackathon Presentation)", () => {
  test("Record complete A to Z flow with high quality and description subtitles", async ({
    page,
  }) => {
    // 1. 브라우저가 열리면 자막용 오버레이와 클릭 이펙트 스타일을 전역으로 주입합니다.
    await page.goto("/");
    await page.evaluate(() => {
      // (1) 데모 자막(자막 오버레이) 추가
      const caption = document.createElement("div");
      caption.id = "demo-caption-overlay";
      Object.assign(caption.style, {
        position: "fixed",
        bottom: "40px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(15, 23, 42, 0.92)",
        color: "#f8fafc",
        padding: "16px 36px",
        borderRadius: "9999px",
        fontSize: "22px",
        fontWeight: "700",
        fontFamily: "'Pretendard', 'Inter', sans-serif",
        boxShadow: "0 15px 35px rgba(0, 0, 0, 0.35)",
        border: "1.5px solid rgba(255, 255, 255, 0.15)",
        zIndex: "100000",
        textAlign: "center",
        pointerEvents: "none",
        transition: "all 0.4s ease",
        letterSpacing: "-0.5px",
        lineHeight: "1.4",
      });
      document.body.appendChild(caption);

      // (2) 클릭 리플 이펙트 관련 CSS 추가
      const style = document.createElement("style");
      style.textContent = `
        .click-ripple {
          position: fixed;
          width: 40px;
          height: 40px;
          background: rgba(245, 158, 11, 0.3); /* 골드 엘로 */
          border: 4px solid rgba(245, 158, 11, 0.9);
          border-radius: 50%;
          pointer-events: none;
          transform: translate(-50%, -50%) scale(0.3);
          animation: ripple-anim 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
          z-index: 100001;
        }
        @keyframes ripple-anim {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
        }
      `;
      document.head.appendChild(style);

      // (3) 클릭 리플 이펙트 스크립트 리스너 등록
      window.addEventListener("click", (e) => {
        const ripple = document.createElement("div");
        ripple.className = "click-ripple";
        ripple.style.left = `${e.clientX}px`;
        ripple.style.top = `${e.clientY}px`;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 800);
      });
    });

    // 자막 업데이트 헬퍼 함수
    const updateCaption = async (msg: string) => {
      await page.evaluate((text) => {
        const el = document.getElementById("demo-caption-overlay");
        if (el) el.innerHTML = text;
      }, msg);
    };

    // ==========================================
    // STEP 1: 서비스 소개 및 보증금 반환 시나리오 선택
    // ==========================================
    await updateCaption(
      "🖋️ <strong>말보단글로</strong> - 일상의 억울한 사연을 격식 있는 내용증명으로 자동 변환해 주는 서비스",
    );
    await page.waitForTimeout(4000);

    await updateCaption(
      "💡 <strong>상황 선택</strong>: 보증금 미반환, 상가 갈등 등 나에게 맞는 법적 분쟁 카드를 클릭합니다.",
    );
    const card = page.locator(".situation-card").filter({ hasText: "전세/월세 보증금 미반환" });
    await expect(card).toBeVisible();
    await card.hover();
    await page.waitForTimeout(1500);
    await card.click();

    // ==========================================
    // STEP 2: 일상 어조 사연 접수 및 분석 시작
    // ==========================================
    await updateCaption(
      "🎙️ <strong>사연 작성</strong>: 법률 지식 없이 편안한 입말로 상황을 작성하거나 음성으로 녹음합니다.",
    );
    await expect(page.locator("h1")).toContainText("사연을 편하게 들려주세요");
    await page.waitForTimeout(2000);

    await updateCaption(
      "🤖 <strong>음성 인식 시뮬레이션</strong>: 마이크 버튼을 누르면 인공지능이 사연 입력을 대행합니다.",
    );
    const micBtn = page.locator(".mic-button");
    await expect(micBtn).toBeVisible();
    await micBtn.hover();
    await page.waitForTimeout(1000);
    await micBtn.click();
    await page.waitForTimeout(3000); // 텍스트 입력 후 감상 대기

    await updateCaption(
      "🚀 <strong>문서 생성</strong>: 준비가 완료되면 [문서 생성 시작 →] 버튼을 누릅니다.",
    );
    const submitBtn = page.locator("button:has-text('문서 생성 시작')");
    await submitBtn.hover();
    await page.waitForTimeout(1000);
    await submitBtn.click();

    // ==========================================
    // STEP 3: Gemini 3.5 기반 개체 추출 시뮬레이션
    // ==========================================
    await updateCaption(
      "✨ <strong>Gemini 3.5 분석</strong>: AI가 날짜, 인물, 보증금액, 주소 등의 법적 핵심 사실 관계를 정밀 분석합니다.",
    );
    await expect(page.locator(".loading-container")).toBeVisible();
    await page.waitForTimeout(5000); // 로딩 시각 연출을 위한 5초 대기

    // ==========================================
    // STEP 4: 에디터 진입 및 스마트 편집 기능 시연 (A to Z)
    // ==========================================
    await expect(page.locator(".editor-workspace")).toBeVisible();
    await expect(page.locator(".a4-document")).toBeVisible();
    await updateCaption(
      "📄 <strong>완성도 85% 초안 생성 완료</strong>: 채워진 사실관계와 법적 근거가 완벽하게 결합되었습니다.",
    );
    await page.waitForTimeout(3500);

    // 4-1. 어조 동적 튜닝 (Tone selection)
    await updateCaption(
      "🔥 <strong>동적 어조 튜닝</strong>: 상대방의 성향에 따라 '정중하게' / '기본' / '강력하게' 어조를 자유롭게 바꿀 수 있습니다.",
    );
    const firmToneTab = page.locator(".tone-tab:has-text('강력하게')");
    await expect(firmToneTab).toBeVisible();
    await firmToneTab.hover();
    await page.waitForTimeout(1000);
    await firmToneTab.click();
    await page.waitForTimeout(3000); // 문서가 더 엄격한 법조체로 바뀐 모습 대기

    // 4-2. 상황 설정 변경 (Branch chips)
    await updateCaption(
      "⚙️ <strong>조건부 논리 자동 조립</strong>: 우측 '상황 설정' 칩을 선택하면 실시간으로 법리적 일관성에 맞게 본문이 재구조화됩니다.",
    );
    const branchChip = page.locator(".branch-chip:has-text('묵시적 갱신 상태')");
    if (await branchChip.isVisible()) {
      await branchChip.hover();
      await page.waitForTimeout(1000);
      await branchChip.click();
      await page.waitForTimeout(3000); // 상황에 따라 법령 및 템플릿이 변화한 모습
    }

    // 4-3. 미입력 항목(노란 칸 🟡)을 모달로 채워 완성하기 (Slot modal editing)
    await updateCaption(
      "🟡 <strong>인터랙티브 빈칸 채우기</strong>: 본문의 미입력 공란을 클릭하면 추천 팁과 스마트 정제 기능이 노출됩니다.",
    );
    const emptySlot = page.locator(".interactive-slot.empty").first();
    await expect(emptySlot).toBeVisible();
    await emptySlot.hover();
    await page.waitForTimeout(1000);
    await emptySlot.click();

    await updateCaption(
      "📋 <strong>추천 선택지 입력</strong>: AI가 가이드라인에 부합하는 추천 칩을 제안해 클릭 한 번으로 작성합니다.",
    );
    const choiceChip = page.locator(".choice-chip").first();
    await expect(choiceChip).toBeVisible();
    await choiceChip.hover();
    await page.waitForTimeout(1000);
    await choiceChip.click(); // 칩을 클릭하여 저장하고 모달 닫기
    await page.waitForTimeout(3000);

    // 4-4. 실시간 국가법령정보 법리 검증 (Law click)
    await updateCaption(
      "🔵 <strong>실시간 법령 검증</strong>: 인용된 조항을 클릭하면 국가법령정보(law.go.kr) API를 기반으로 정합성을 검증합니다.",
    );
    const lawCitation = page.locator(".interactive-citation").first();
    await expect(lawCitation).toBeVisible();
    await lawCitation.hover();
    await page.waitForTimeout(1200);
    await lawCitation.click(); // 법률 원문 팝업 띄우기

    await updateCaption(
      "⚖️ <strong>국가법령 연동</strong>: 소송과 분쟁에서 완벽한 효력을 발휘할 수 있도록 실시간으로 실제 근거 조항을 확인해 줍니다.",
    );
    await page.waitForTimeout(4000); // 법령 모달 확인
    const closeLawBtn = page.locator(".modal-close");
    await expect(closeLawBtn).toBeVisible();
    await closeLawBtn.click(); // 모달 닫기
    await page.waitForTimeout(1500);

    // ==========================================
    // STEP 5: 최종 문서 완성 및 배송 가이드 제공 (Exporter)
    // ==========================================
    await updateCaption(
      "🏆 <strong>문서 완성</strong>: 모든 항목 작성을 끝마치고 최종 다운로드 및 가이드 페이지로 진입합니다.",
    );
    const proceedBtn = page.locator(".sidebar-proceed");
    await expect(proceedBtn).toBeVisible();
    await proceedBtn.hover();
    await page.waitForTimeout(1200);
    await proceedBtn.click();

    await expect(page.locator(".exporter-workspace")).toBeVisible();
    await updateCaption(
      "🖨️ <strong>인쇄 및 발송 가이드</strong>: 인쇄 및 등기 발송 방법, 효력 입증용 우체국 발송 매뉴얼까지 A to Z로 완벽하게 케어합니다.",
    );
    await page.waitForTimeout(7000); // 최종 피날레 화면 대기
  });
});
