// 케이스 레지스트리.
// 사건 추가 = import 한 줄 + 배열에 추가 (엔진 코드 수정 없음).
// 2단계: 차트가 데이터를 가지도록 합성 fixture(demo)를 사용.
// 1단계 파이프라인으로 verified 파일을 만들면 해당 import 만 교체.
import case01 from "./case-01-late-spring-snow.demo.json";
import case02 from "./case-02-yeongdong-foehn.demo.json";
import case03 from "./case-03-summer-hail.demo.json";

export const cases = [case01, case02, case03].sort(
  (a, b) => a.meta.difficulty - b.meta.difficulty
);

export function getCase(id) {
  return cases.find((c) => c.id === id) ?? null;
}
