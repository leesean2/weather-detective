// src/api/tutor.js — 프런트에서 튜터 프록시 호출.
// 절대 throw 하지 않는다. 실패하면 { ok:false } 를 돌려 호출측이 정적 폴백을 쓰게 한다.
// (npm run dev 에는 /api/tutor 가 없어 404 → ok:false → 폴백)
export async function requestTutor(payload) {
  try {
    const res = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false };
    const json = await res.json();
    return json?.ok && json?.tutor ? { ok: true, tutor: json.tutor } : { ok: false };
  } catch {
    return { ok: false };
  }
}
