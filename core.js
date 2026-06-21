// tutor/core.js
// 소크라테스 튜터의 순수 로직(네트워크 없음): 프롬프트 조립 + 모델 응답 파싱.
// api/tutor.js(서버리스)와 tutor/selftest.js 가 공유한다.

export const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

const list = (arr, empty = "없음") => (arr && arr.length ? arr.join(", ") : empty);

// mode: "assess"(가설 채점) | "hint"(조사 중 힌트)
export function buildMessages(mode, p = {}) {
  const system = [
    "너는 '기상 미스터리 탐정' 게임의 AI 조수야. 중학생이 기상 현상의 원인을 스스로 추리하도록 돕는 소크라테스식 튜터지.",
    "",
    "지켜야 할 규칙:",
    ...(p.rules || []).map((r) => `- ${r}`),
    "- 절대 정답을 직접 말하지 마. 학생이 스스로 깨닫게 질문으로 유도해.",
    "- 따뜻하고 격려하는 말투로, 모두 합쳐 3문장 이내.",
    "- 한국어로 답해.",
    "",
    "[사건 배경 — 학생에게 그대로 노출하지 말 것]",
    p.systemContext || "",
    "",
    '반드시 아래 JSON 형식으로만 답해(코드블록·다른 말 없이):',
    '{"assessment":"학생 생각에 대한 짧은 반응","hint":"다음에 살펴볼 것을 묻는 소크라테스식 질문","pointTo":"살펴볼 단서 제목 또는 null"}',
  ].join("\n");

  let user;
  if (mode === "assess") {
    user = [
      "[상황]",
      `학생이 확인한 단서: ${list(p.openedClues)}`,
      `아직 확인하지 않은 단서: ${list(p.unopenedClues)}`,
      "",
      `학생이 제출한 가설: "${p.optionText}"`,
      `(이 가설의 실제 판정: ${p.verdict})`,
      `정답의 핵심 요인: ${list(p.correctFactors)}`,
      "",
      p.verdict === "correct"
        ? "좋은 방향임을 격려하되 정답을 직접 확정해 주진 말고, 어떤 단서가 그 생각을 뒷받침하는지 스스로 확인하게 도와줘."
        : "정답은 말하지 말고, 왜 다시 생각해봐야 하는지 질문으로 짚어줘. 아직 안 본 핵심 단서가 있으면 그쪽으로 유도해.",
    ].join("\n");
  } else {
    user = [
      "[상황]",
      `학생이 확인한 단서: ${list(p.openedClues)}`,
      `아직 확인하지 않은 단서: ${list(p.unopenedClues)}`,
      `사건 질문: ${p.prompt || ""}`,
      "",
      `참고용 힌트 흐름: ${list(p.hintLadder)}`,
      "다음에 무엇을 살펴보면 좋을지, 정답을 말하지 말고 질문 하나로 유도해줘.",
    ].join("\n");
  }

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

// 모델 응답에서 JSON 추출·검증. 실패 시 throw → 호출측이 정적 폴백.
export function parseTutorResponse(text) {
  if (!text || typeof text !== "string") throw new Error("빈 응답");
  let s = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  if (!s.startsWith("{")) {
    const a = s.indexOf("{"), b = s.lastIndexOf("}");
    if (a >= 0 && b > a) s = s.slice(a, b + 1);
  }
  const obj = JSON.parse(s);
  if (typeof obj.assessment !== "string" || typeof obj.hint !== "string") {
    throw new Error("형식 불일치(assessment/hint 누락)");
  }
  return {
    assessment: obj.assessment.trim(),
    hint: obj.hint.trim(),
    pointTo: obj.pointTo && obj.pointTo !== "null" ? String(obj.pointTo) : null,
  };
}
