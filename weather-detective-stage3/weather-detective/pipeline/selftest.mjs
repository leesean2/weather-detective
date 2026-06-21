// selftest.mjs
// 네트워크 없이 upp_temp 파서 로직을 검증한다.
// (실제 KMA 응답이 콤마/공백 어느 쪽이든, 마커가 있든 동작하는지 확인.
//  단, 컬럼 '순서'는 가정값이므로 최초 1회 `--help-dump-upp` 로 반드시 확인할 것.)
//
// 실행: node pipeline/selftest.mjs

import { parseUpperAir, utcToKstIso } from "./kma.mjs";

let pass = 0, fail = 0;
const ok = (cond, msg) => { (cond ? pass++ : fail++); console.log(`${cond ? "✓" : "✗"} ${msg}`); };

// 가정 컬럼 순서: TM(0) STN(1) PA(2) HT(3) TA(4) ...
// 콤마 구분 + START7777/7777END 마커 (sea_obs 류 형식)
const commaSample = [
  "#START7777",
  "# TM, STN, PA, HT, TA, TD, WD, WS",
  "202304290000, 90, 1000, 110, 3.2, 1.0, 270, 8.0,=",
  "202304290000, 90, 925, 760, -0.8, -3.0, 275, 12.0,=",
  "202304290000, 90, 850, 1480, -6.4, -9.0, 280, 16.0,=",
  "202304290000, 90, 700, 3050, -12.1, -16.0, 285, 20.0,=",
  "#7777END",
].join("\n");

// 공백 구분 (kma_sfctm 류 형식) + 결측(-999)
const spaceSample = [
  "#START7777",
  "202304290000  90  1000  110   3.2  1.0  270   8.0",
  "202304290000  90   925  760  -0.8 -3.0 275  12.0",
  "202304290000  90   850 1480  -6.4 -9.0 280  16.0",
  "202304290000  90   700 3050 -999.0 -999.0 285 20.0",
  "#7777END",
].join("\n");

const a = parseUpperAir(commaSample, [1000, 925, 850, 700, 500]);
ok(a.rawCount === 4, `콤마형: 데이터행 4개 파싱 (got ${a.rawCount})`);
ok(a.levels.length === 4, `콤마형: 표준레벨 4개 추출 (500은 없음) (got ${a.levels.length})`);
const l850 = a.levels.find((l) => l.pressureHpa === 850);
ok(l850 && l850.ta === -6.4, `콤마형: 850hPa 기온 = -6.4 (got ${l850 && l850.ta})`);
ok(l850 && l850.heightM === 1480, `콤마형: 850hPa 고도 = 1480 (got ${l850 && l850.heightM})`);
ok(a.levels.every((l) => l.ta < 5), "콤마형: 추출된 레벨 모두 기온 존재");

const b = parseUpperAir(spaceSample, [1000, 925, 850, 700]);
ok(b.levels.length === 3, `공백형: 결측(700hPa -999) 제외하고 3개 추출 (got ${b.levels.length})`);
ok(!b.levels.some((l) => l.pressureHpa === 700), "공백형: 결측 레벨(700hPa)은 제외됨");

ok(utcToKstIso("20230429", "0000") === "2023-04-29T09:00", "시각변환: 00 UTC → 09 KST");
ok(utcToKstIso("20230429", "1200") === "2023-04-29T21:00", "시각변환: 12 UTC → 21 KST");

console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
process.exit(fail ? 1 : 0);
