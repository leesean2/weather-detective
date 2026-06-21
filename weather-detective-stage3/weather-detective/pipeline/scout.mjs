// scout.mjs
// 사건 1(늦봄 산간 대설)의 "실제 발생일"을 데이터로 찾아낸다.
// 후보 구간을 훑어, 대관령 적설이 증가했고 같은 날 강릉은 기온이 영상(=비)인 날을 표시.
// 이렇게 하면 날짜를 사람이 단정하지 않고 관측이 골라내므로 공개검증에 강하다.
//
// 실행: KMA_AUTH_KEY=... node pipeline/scout.mjs

import { AUTH_KEY, STATIONS, SCOUT_WINDOW } from "./config.mjs";
import { fetchAsosHourly } from "./kma.mjs";

function dayMax(rows, key) {
  const vals = rows.map((r) => r[key]).filter((v) => v != null);
  return vals.length ? Math.max(...vals) : null;
}
function dayMin(rows, key) {
  const vals = rows.map((r) => r[key]).filter((v) => v != null);
  return vals.length ? Math.min(...vals) : null;
}

async function scanDay(dt) {
  const tm1 = `${dt}0000`, tm2 = `${dt}2300`;
  const [dgw, gn] = await Promise.all([
    fetchAsosHourly({ stn: STATIONS.daegwallyeong.stn, tm1, tm2 }),
    fetchAsosHourly({ stn: STATIONS.gangneung.stn, tm1, tm2 }),
  ]);
  const dgwSnow = dayMax(dgw, "sd");        // 대관령 일적설
  const dgwRain = dayMax(dgw, "rn");        // 대관령 강수
  const gnTmin = dayMin(gn, "ta");          // 강릉 최저기온
  const gnRain = dayMax(gn, "rn");          // 강릉 강수
  // 후보 조건: 대관령에 적설/강수 있고, 강릉은 영상(비) 쪽
  const candidate = (dgwSnow ?? 0) > 0 && (gnRain ?? 0) > 0 && (gnTmin ?? 99) > 1;
  return { dt, dgwSnow, dgwRain, gnTmin, gnRain, candidate };
}

function eachDay(startDt, endDt) {
  const out = [];
  const d = new Date(`${startDt.slice(0,4)}-${startDt.slice(4,6)}-${startDt.slice(6,8)}T00:00:00Z`);
  const end = new Date(`${endDt.slice(0,4)}-${endDt.slice(4,6)}-${endDt.slice(6,8)}T00:00:00Z`);
  while (d <= end) {
    out.push(d.toISOString().slice(0,10).replace(/-/g, ""));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

async function main() {
  if (!AUTH_KEY) { console.error("KMA_AUTH_KEY 미설정"); process.exit(1); }
  for (const range of SCOUT_WINDOW.ranges) {
    console.log(`\n=== ${range.startDt} ~ ${range.endDt} (대관령 vs 강릉) ===`);
    for (const dt of eachDay(range.startDt, range.endDt)) {
      try {
        const r = await scanDay(dt);
        const mark = r.candidate ? "★후보" : "      ";
        console.log(`${mark} ${dt}  대관령적설=${fmt(r.dgwSnow)}cm  대관령강수=${fmt(r.dgwRain)}mm  |  강릉최저=${fmt(r.gnTmin)}℃  강릉강수=${fmt(r.gnRain)}mm`);
      } catch (e) {
        console.log(`       ${dt}  (조회 실패: ${e.message})`);
      }
    }
  }
  console.log("\n★후보 중 적설이 뚜렷한 날을 골라 build-case.mjs 의 EVENT_DATE 로 지정하세요.");
}
const fmt = (v) => (v == null ? "—" : String(v));

main().catch((e) => { console.error(e); process.exit(1); });
