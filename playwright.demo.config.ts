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
    /* 🖥️ 고화질 녹화를 위해 Full HD (1920x1080) 해상도로 설정 */
    viewport: { width: 1920, height: 1080 },
    /* 🍏 레티나(Retina) 디스플레이급 선명한 글자 표현을 위한 2배 스케일 지정 */
    deviceScaleFactor: 2,
    /* ⏳ 조작 간격 기본 딜레이 (부드러운 마우스 무브먼트와 병행하기 위해 500ms로 조율) */
    launchOptions: {
      slowMo: 500,
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
