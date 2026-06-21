// api/tutor.js — Vercel 서버리스 함수.
// OpenRouter 를 서버에서 호출해 API 키를 숨긴다. 키 미설정/오류 시 ok:false 로 응답해
// 프런트가 정적 폴백을 쓰게 한다. (vite `npm run dev` 에는 이 라우트가 없어 404 → 폴백)

import { buildMessages, parseTutorResponse, DEFAULT_MODEL } from "../tutor/core.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return res.status(503).json({ ok: false, error: "OPENROUTER_API_KEY 미설정" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  const mode = body.mode === "hint" ? "hint" : "assess";

  try {
    const messages = buildMessages(mode, body);
    const r = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "X-Title": "Weather Mystery Detective",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
        messages,
        temperature: 0.5,
        max_tokens: 320,
      }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return res.status(502).json({ ok: false, error: `OpenRouter ${r.status}`, detail: detail.slice(0, 300) });
    }
    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    const tutor = parseTutorResponse(content);
    return res.status(200).json({ ok: true, tutor });
  } catch (e) {
    return res.status(502).json({ ok: false, error: String(e.message || e) });
  }
}
