// Server-side only. Forwards a Gemini generateContent payload to Google with the
// secret key injected here — the key never reaches the browser bundle.
// Shared by the local Vite dev proxy and the Vercel serverless function.

const MODEL = "gemini-3.5-flash";

export async function forwardToGemini(
  body: string,
  apiKey: string | undefined,
): Promise<{ status: number; text: string }> {
  if (!apiKey) {
    return {
      status: 500,
      text: JSON.stringify({ error: { message: "GEMINI_API_KEY not configured on server" } }),
    };
  }
  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body },
  );
  return { status: upstream.status, text: await upstream.text() };
}
