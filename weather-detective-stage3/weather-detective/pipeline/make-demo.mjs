// make-demo.mjs
// 2단계 UI 개발용 합성 fixture 생성(전 사건). 실제 관측이 아니며 synthetic:true 로 명시.
// 차트형 단서만 합성하고, text 단서의 authored body 는 그대로 둔다.
// build-case 가 verified 파일을 만들면 그걸로 교체.
//
// 실행: node pipeline/make-demo.mjs

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { STATIONS } from "./config.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const CASES = join(__dir, "../src/cases");
const r1 = (x) => Math.round(x * 10) / 10;
const hours = (date) => Array.from({ length: 24 }, (_, h) => `${date}T${String(h).padStart(2, "0")}:00`);
// 기온 일변화: 15시 최고, 3시 최저
const diurnal = (h, base, amp) => r1(base + amp * Math.cos((2 * Math.PI * (h - 15)) / 24));

function tempSeries(date, specs) {
  const hs = hours(date);
  return {
    synthetic: true,
    series: specs.map((s) => ({
      stn: s.stn, name: s.name, elevationM: s.elevationM,
      points: hs.map((t, h) => ({ time: t, ta: diurnal(h, s.base, s.amp) })),
    })),
  };
}

// 사건별 합성 사양
const SPECS = {
  "case-01-late-spring-snow": {
    file: "case-01-late-spring-snow.json", date: "2023-04-29",
    gen: {
      "clue-temp-comparison": (d) => tempSeries(d, [
        { stn: 100, name: "대관령", elevationM: 772.57, base: -0.3, amp: 1.6 },
        { stn: 105, name: "강릉", elevationM: 26.04, base: 5.0, amp: 3.0 },
      ]),
      "clue-precip-type": (d) => ({
        synthetic: true, stn: 100, name: "대관령",
        points: hours(d).map((t, h) => ({ time: t, rn: (h >= 3 && h <= 14 ? r1(0.4 + Math.random() * 0.3) : 0), sd: r1(Math.max(0, Math.min(4.5, (h - 2) * 0.32))) })),
      }),
      "clue-pressure": (d) => ({
        synthetic: true, time: `${d}T12:00`,
        stations: [
          { stn: 100, name: "대관령", lat: 37.6771, lon: 128.7183, ps: 1018.3 },
          { stn: 105, name: "강릉", lat: 37.7515, lon: 128.8910, ps: 1020.1 },
          { stn: 90, name: "속초", lat: 38.2509, lon: 128.5647, ps: 1020.6 },
        ],
        note: "합성 예시. 북쪽 고압(한기 남하)을 가정.",
      }),
      "clue-upper-air": (d) => ({
        synthetic: true, stn: 90, name: "속초(레윈존데)", time: `${d}T09:00`,
        levels: [
          { pressureHpa: 1000, heightM: 110, ta: 3.2 },
          { pressureHpa: 925, heightM: 760, ta: -0.8 },
          { pressureHpa: 850, heightM: 1480, ta: -6.4 },
          { pressureHpa: 700, heightM: 3050, ta: -12.1 },
        ],
      }),
    },
  },

  "case-02-yeongdong-foehn": {
    file: "case-02-yeongdong-foehn.json", date: "2023-01-12",
    gen: {
      "clue-wind": (d) => ({
        synthetic: true, stn: 105, name: "강릉",
        // 서~남서풍(250~260도) 강하게 지속
        points: hours(d).map((t, h) => ({ time: t, wd: 250 + Math.round(Math.sin(h) * 8), ws: r1(6 + 3 * Math.max(0, Math.cos((2 * Math.PI * (h - 15)) / 24))) })),
      }),
      "clue-temp-east-west": (d) => tempSeries(d, [
        { stn: 105, name: "강릉(영동)", elevationM: 26.04, base: 12, amp: 7 },
        { stn: 114, name: "원주(영서)", elevationM: 150.0, base: -3, amp: 4 },
      ]),
      "clue-pressure": (d) => ({
        synthetic: true, time: `${d}T12:00`,
        stations: [
          { stn: 114, name: "원주", lat: 37.3375, lon: 127.9466, ps: 1026.4 },
          { stn: 108, name: "서울", lat: 37.5714, lon: 126.9658, ps: 1027.1 },
          { stn: 105, name: "강릉", lat: 37.7515, lon: 128.8910, ps: 1018.2 },
        ],
        note: "합성 예시. 서고동저로 강한 서풍.",
      }),
    },
  },

  "case-03-summer-hail": {
    file: "case-03-summer-hail.json", date: "2023-06-05",
    gen: {
      "clue-upper-air": (d) => ({
        synthetic: true, stn: 47122, name: "내륙 레윈존데", time: `${d}T15:00`,
        // 지표 덥고 상층 매우 참 → 가파른 기온감률
        levels: [
          { pressureHpa: 1000, heightM: 100, ta: 27.0 },
          { pressureHpa: 925, heightM: 770, ta: 18.0 },
          { pressureHpa: 850, heightM: 1500, ta: 11.5 },
          { pressureHpa: 700, heightM: 3120, ta: -2.0 },
          { pressureHpa: 500, heightM: 5800, ta: -16.5 },
        ],
      }),
      "clue-surface-heating": (d) => tempSeries(d, [
        { stn: 131, name: "당일", elevationM: 60, base: 25, amp: 6 },
        { stn: 131, name: "평년", elevationM: 60, base: 22, amp: 3.5 },
      ]),
      "clue-precip": (d) => ({
        synthetic: true, stn: 131, name: "내륙 관측소",
        points: hours(d).map((t, h) => ({ time: t, rn: (h === 15 ? 9.2 : h === 16 ? 4.1 : h === 14 ? 1.0 : 0), sd: 0 })),
      }),
    },
  },
};

let count = 0;
for (const [id, spec] of Object.entries(SPECS)) {
  const c = JSON.parse(readFileSync(join(CASES, spec.file), "utf8"));
  c.dataStatus = "placeholder";
  c.meta.event.date = spec.date;
  for (const clue of c.investigation.clues) {
    const gen = spec.gen[clue.id];
    if (gen) clue.data = gen(spec.date);
  }
  const out = join(CASES, spec.file.replace(/\.json$/, ".demo.json"));
  writeFileSync(out, JSON.stringify(c, null, 2) + "\n");
  console.log("생성:", out.split("/cases/")[1]);
  count++;
}
console.log(`총 ${count}개 합성 fixture 생성 완료`);
