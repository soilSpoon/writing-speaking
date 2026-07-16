import type { IncomingMessage, ServerResponse } from "node:http";
import { forwardToGemini } from "../server/geminiForward";

// Vercel serverless function: POST /api/gemini → Gemini, key from the
// GEMINI_API_KEY env var (set in the Vercel dashboard). Untested until deployed;
// the local dev proxy in server/devProxy.ts is the tested equivalent.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end();
  }
  let body = "";
  for await (const chunk of req) body += chunk;
  const { status, text } = await forwardToGemini(body, process.env.GEMINI_API_KEY);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(text);
}
