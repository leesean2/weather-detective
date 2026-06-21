// 케이스 레지스트리.
// 사건 추가 = import 한 줄 + 배열에 추가 (엔진 코드 수정 없음).
import case01 from "./case-01-late-spring-snow.demo.json";
import case02 from "./case-02-yeongdong-foehn.demo.json";
import case03 from "./case-03-summer-hail.demo.json";
import case04 from "./case-04-autumn-fog.demo.json";
import case05 from "./case-05-east-wind-snow.demo.json";
import case06 from "./case-06-tropical-night.demo.json";
import case07 from "./case-07-changma-rain.demo.json";

export const cases = [case01, case02, case03, case04, case05, case06, case07].sort(
  (a, b) => a.meta.difficulty - b.meta.difficulty
);

export function getCase(id) {
  return cases.find((c) => c.id === id) ?? null;
}

export function getRandomCase(excludeId) {
  const pool = excludeId ? cases.filter((c) => c.id !== excludeId) : cases;
  return pool[Math.floor(Math.random() * pool.length)];
}
