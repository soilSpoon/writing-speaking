import { defineConfig, loadEnv } from "vite-plus";
import react from "@vitejs/plugin-react";
import { geminiDevProxy } from "./server/devProxy.ts";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // GEMINI_API_KEY (no VITE_ prefix) stays server-side — never bundled into the client.
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), geminiDevProxy(env.GEMINI_API_KEY)],
    test: {
      exclude: ["e2e/**/*", "node_modules/**/*", "dist/**/*"],
    },
  };
});
