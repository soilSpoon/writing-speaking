import { test, expect } from "@playwright/test";

test.describe("Law Document Generator E2E Flow (Playwright)", () => {
  test("should complete full funnel: situation selection -> story typing -> AI mock extraction -> editor", async ({
    page,
  }) => {
    // 1. Navigate to home
    await page.goto("/");
    await expect(page).toHaveTitle(/말보단글로/);

    // Check main branding header
    const mainHeader = page.locator("h1");
    await expect(mainHeader).toContainText("억울");

    // 2. Select Housing Deposit Refund situation card
    const card = page.locator(".situation-card").filter({ hasText: "전세/월세 보증금 미반환" });
    await expect(card).toBeVisible();
    await card.click();

    // 3. Verify story input step transitions
    await expect(page.locator("h1")).toContainText("사연을 편하게 들려주세요");
    await expect(page.locator(".story-text-area")).toBeVisible();

    // Click microphone / voice simulation button to fill demo preset story
    const micBtn = page.locator(".mic-button");
    await expect(micBtn).toBeVisible();
    await micBtn.click();

    // Verify textarea has captured preset text
    const storyValue = await page.locator(".story-text-area").inputValue();
    expect(storyValue.length).toBeGreaterThan(20);

    // 4. Click Submission button and watch loading transition
    const submitBtn = page.locator("button:has-text('문서 조립 및 생성 시작')");
    await submitBtn.click();

    // 5. Verify transition to loading screen
    await expect(page.locator(".loading-container")).toBeVisible();

    // Wait for simulated cascade extraction delay (about 4 seconds) to transition to editor step
    await page.waitForTimeout(4500);

    // 6. Verify we are in the Document Editor workspace step
    await expect(page.locator(".editor-workspace")).toBeVisible();

    // Verify the central A4 sheet is rendered
    await expect(page.locator(".a4-document")).toBeVisible();

    // Verify editable interactive slots exist
    await expect(page.locator(".interactive-slot").first()).toBeVisible();
  });
});
