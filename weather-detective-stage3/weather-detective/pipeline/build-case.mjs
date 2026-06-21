// build-case.mjs
// 선택한 사례일의 실제 KMA 데이터를 끌어와, 0단계 케이스의 단서 data 를 채우고
// dataStatus 를 "verified" 로 바꿔 새 파일로 떨군다.
//
// 실행: KMA_AUTH_KEY=... node pipeline/build-case.mjs 20230XYZ
//      (인자로 사례일 YYYYMMDD. 생략 시 아래 EVENT_DATE 사용)

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { AUTH_KEY, STATIONS, UPPER_STATIONS, UPPER_LEVELS } from "./config.mjs";
import { fetchAsosHourly, fetchUpperAir } from "./kma.mjs";
import { validateClueData } from "../src/engine/clueData.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dir, "../src/cases/case-01-late-spring-snow.json");
const OUT = join(__dir, "../src/cases/case-01-late-spring-snow.verified.json");

const EVENT_DATE = process.argv[2] || ""; // 예: "20230429"

async function main() {
  if (!AUTH_KEY) throw new Error("KMA_AUTH_KEY 미설정");
  if (!/^\d{8}$/.test(EVENT_DATE)) throw new Error("사례일을 인자로 주세요. 예: node pipeline/build-case.mjs 20230429");

  const tm1 = `${EVENT_DATE}0000`, tm2 = `${EVENT_DATE}2300`;
  const [dgw, gn] = await Promise.all([
    fetchAsosHourly({ stn: STATIONS.daegwallyeong.stn, tm1, tm2 }),
    fetchAsosHourly({ stn: STATIONS.gangneung.stn, tm1, tm2 }),
  ]);

  const c = JSON.parse(readFileSync(SRC, "utf8"));
  const setClue = (id, fields) => {
    const clue = c.investigation.clues.find((x) => x.id === id);
    if (!clue) throw new Error(`clue 없음: ${id}`);
    Object.assign(clue, fields);
  };

  // 1) 지역별 기온 (산간 vs 평지) — temp-comparison
  setClue("clue-temp-comparison", {
    data: {
      series: [
        seriesOf(STATIONS.daegwallyeong, dgw),
        seriesOf(STATIONS.gangneung, gn),
      ],
    },
  });

  // 2) 강수 형태와 적설 — timeseries (대관령 기준)
  setClue("clue-precip-type", {
    data: {
      stn: STATIONS.daegwallyeong.stn,
      name: STATIONS.daegwallyeong.name,
      points: dgw.map((r) => ({ time: r.time, rn: r.rn, sd: r.sd })),
    },
  });

  // 3) 지상 기압배치 — pressure-map (두 지점 해면기압로 근사)
  const noonIdx = (rows) => rows.findIndex((r) => r.time.endsWith("T12:00"));
  const psAt = (rows) => { const i = noonIdx(rows); return i >= 0 ? rows[i].ps : (rows.at(-1)?.ps ?? null); };
  setClue("clue-pressure", {
    data: {
      time: `${EVENT_DATE.slice(0,4)}-${EVENT_DATE.slice(4,6)}-${EVENT_DATE.slice(6,8)}T12:00`,
      stations: [
        { stn: STATIONS.daegwallyeong.stn, name: STATIONS.daegwallyeong.name, lat: STATIONS.daegwallyeong.lat, lon: STATIONS.daegwallyeong.lon, ps: psAt(dgw) },
        { stn: STATIONS.gangneung.stn, name: STATIONS.gangneung.name, lat: STATIONS.gangneung.lat, lon: STATIONS.gangneung.lon, ps: psAt(gn) },
      ],
      note: "점 관측의 해면기압 분포로 기압배치를 근사. 정식 일기도 이미지는 별도 자산.",
    },
  });

  // 4) 상층 기온 — upper-air (레윈존데, 속초 아침 사운딩 = 00 UTC = 09 KST)
  let upperOk = false;
  try {
    const up = await fetchUpperAir({
      stn: UPPER_STATIONS.sokcho.stn,
      dateYmd: EVENT_DATE,
      tmUtc: "0000",
      levels: UPPER_LEVELS,
    });
    if (up.levels.length >= 2 && up.levels.some((l) => l.pressureHpa === 850)) {
      setClue("clue-upper-air", {
        data: {
          stn: UPPER_STATIONS.sokcho.stn,
          name: UPPER_STATIONS.sokcho.name,
          time: up.timeKst,
          levels: up.levels,
        },
      });
      upperOk = true;
    } else {
      console.warn("상층 데이터가 부족(850hPa 누락 등) → clue-upper-air placeholder 유지. --help-dump-upp 로 컬럼/지점 확인.");
    }
  } catch (e) {
    console.warn(`상층 조회 실패 → clue-upper-air placeholder 유지: ${e.message}`);
  }

  // dataStatus / 출처 갱신
  c.dataStatus = upperOk ? "verified" : "placeholder";
  c.meta.event.date = `${EVENT_DATE.slice(0,4)}-${EVENT_DATE.slice(4,6)}-${EVENT_DATE.slice(6,8)}`;
  const today = new Date().toISOString().slice(0, 10);
  c.dataSources.forEach((s) => { if (!s.retrieved) s.retrieved = today; });

  // 형태 검증
  let problems = [];
  for (const clue of c.investigation.clues) {
    if (clue.data && !clue.data._placeholder) {
      const e = validateClueData(clue.type, clue.data);
      if (e.length) problems.push(`[${clue.id}] ${e.join(", ")}`);
    }
  }
  if (problems.length) console.warn("형태 경고:\n" + problems.join("\n"));

  writeFileSync(OUT, JSON.stringify(c, null, 2) + "\n");
  console.log(`완료 → ${OUT}`);
  console.log(`dataStatus=${c.dataStatus}, event.date=${c.meta.event.date}`);
}

function seriesOf(station, rows) {
  return {
    stn: station.stn,
    name: station.name,
    elevationM: station.elevationM,
    points: rows.map((r) => ({ time: r.time, ta: r.ta })),
  };
}

main().catch((e) => { console.error("실패:", e.message); process.exit(1); });
