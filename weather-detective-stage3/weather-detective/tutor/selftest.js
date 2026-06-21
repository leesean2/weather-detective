// tutor/selftest.js
// 네트워크 없이 튜터 코어(프롬프트 조립 + 응답 파싱)를 검증한다.
// 실행: node tutor/selftest.js

import { buildMessages, parseTutorResponse } from "./core.js";

let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log(`${c ? "✓" : "✗"} ${m}`); };

// assess 프롬프트
const ms = buildMessages("assess", {
  systemContext: "정답: 상층 한기 + 고도차로 산간만 눈.",
  rules: ["정답 누설 금지"],
  openedClues: ["지상 기압배치"],
  unopenedClues: ["상층 기온", "지역별 기온"],
  optionText: "산간이 더 북쪽이라 춥다",
  verdict: "misconception",
  correctFactors: ["상층 기온", "고도"],
});
const sys = ms[0].content, usr = ms[1].content;
ok(ms.length === 2 && ms[0].role === "system" && ms[1].role === "user", "assess: system+user 2개");
ok(/정답을 직접 말하지 마/.test(sys), "assess: 정답 누설 금지 규칙 포함");
ok(sys.includes("상층 한기"), "assess: systemContext 주입");
ok(usr.includes("상층 기온") && usr.includes("지역별 기온"), "assess: 미개봉 단서 전달");
ok(/JSON/.test(sys) && sys.includes('"assessment"'), "assess: JSON 출력 형식 지시");

// hint 프롬프트
const mh = buildMessages("hint", {
  systemContext: "x", hintLadder: ["기압배치는 봤어?", "상층 기온을 봐"],
  prompt: "산간에만 눈이 내린 원인은?", openedClues: ["지상 기압배치"], unopenedClues: ["상층 기온"],
});
ok(mh[1].content.includes("힌트 흐름") && mh[1].content.includes("상층 기온을 봐"), "hint: hintLadder 전달");

// 파싱: 코드펜스 + 잡텍스트 섞인 응답
const fenced = '```json\n{"assessment":"좋은 시도야","hint":"상층 기온은 확인했니?","pointTo":"상층 기온"}\n```';
const p1 = parseTutorResponse(fenced);
ok(p1.assessment === "좋은 시도야" && p1.pointTo === "상층 기온", "파싱: 코드펜스 제거 후 추출");

const noisy = '여기 답이야: {"assessment":"음","hint":"왜 그럴까?","pointTo":null} 끝!';
const p2 = parseTutorResponse(noisy);
ok(p2.hint === "왜 그럴까?" && p2.pointTo === null, "파싱: 앞뒤 잡텍스트 무시 + null 처리");

let threw = false;
try { parseTutorResponse("그냥 텍스트일 뿐 JSON 아님"); } catch { threw = true; }
ok(threw, "파싱: 비정상 응답은 throw (→ 호출측 폴백)");

console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
process.exit(fail ? 1 : 0);
