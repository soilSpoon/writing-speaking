import type { Plugin } from "vite";
import { forwardToGemini } from "./geminiForward.ts";

// Local-dev equivalent of the Vercel /api/gemini function: mounts the proxy on
// Vite's dev server so `npm run dev` works without exposing the key to the client.
export function geminiDevProxy(apiKey: string | undefined): Plugin {
  return {
    name: "gemini-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/api/gemini", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          return res.end();
        }
        let body = "";
        for await (const chunk of req) body += chunk;
        const { status, text } = await forwardToGemini(body, apiKey);
        res.statusCode = status;
        res.setHeader("Content-Type", "application/json");
        res.end(text);
      });
    },
  };
}
