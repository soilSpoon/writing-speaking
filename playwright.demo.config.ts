import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  /* 데모가 여유 있게 동작하도록 타임아웃을 120초(120000ms)로 연장 */
  timeout: 120000,
  /* 데모 전용 테스트만 실행하도록 필터링 */
  testMatch: "demo.spec.ts",
  /* 데모 비디오 녹화 시에는 순차적으로 실행되도록 단일 워커 설정 */
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    /* 🎥 비디오 녹화 옵션 활성화 */
    video: "on",
    /* 🖥️ 픽셀 깨짐과 흐릿함을 물리적으로 극복하기 위해 UHD 4K (3840x2160) 해상도로 설정 */
    viewport: { width: 3840, height: 2160 },
    /* 🍏 레티나를 능가하는 극도의 선명한 텍스트 렌더링을 위해 3배 스케일(High-DPI) 지정 */
    deviceScaleFactor: 3,
    /* ⏳ 조작 간격 기본 딜레이 (부드러운 마우스 무브먼트와 병행하기 위해 500ms로 조율) */
    launchOptions: {
      slowMo: 500,
      args: [
        "--force-device-scale-factor=3", // Chromium 렌더러에 고밀도 스케일 강제
        "--font-render-hinting=full", // 텍스트 외곽선을 가장 또렷하게 힌팅 설정
        "--enable-font-antialiasing", // 폰트 안티앨리어싱 활성화
      ],
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "./node_modules/.bin/vp dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
});
