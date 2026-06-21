// kma.mjs
// apihub typ01 응답 파서. 응답은 '#' 주석/헤더 + 공백구분 데이터행 + '#7777END'.
// 컬럼은 지점/시기에 따라 약간 다를 수 있으므로, COLUMN_MAP(필드→인덱스)을
// 한 곳에 모아 두고 최초 1회 help=1 출력으로 검증·보정하는 방식.

import { AUTH_KEY, ENDPOINTS, num } from "./config.mjs";

// kma_sfctm(지상 시간자료) 표준 컬럼 인덱스(0-base, 공백 split 기준).
// ※ 최초 1회 `node pipeline/kma.mjs --help-dump` 로 헤더를 확인해 보정할 것.
export const COLUMN_MAP = {
  TM: 0,    // 관측시각 YYYYMMDDHHMM
  STN: 1,   // 지점번호
  WD: 2,    // 풍향(deg)
  WS: 3,    // 풍속(m/s)
  PS: 8,    // 해면기압(hPa)
  TA: 11,   // 기온(°C)
  HM: 13,   // 상대습도(%)
  RN: 15,   // 강수량(mm)
  SD_DAY: 20, // 일적설(cm)  ← 시기/버전에 따라 SD_HR3/SD_TOT 위치 확인 필요
};

export function buildUrl(endpoint, params) {
  const u = new URL(endpoint);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v));
  u.searchParams.set("authKey", AUTH_KEY);
  return u.toString();
}

export async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const text = await res.text();
  if (/인증키|authKey|로그인|LOGIN/i.test(text) && !/#7777END/.test(text)) {
    throw new Error("인증 실패로 보임. KMA_AUTH_KEY 를 확인하세요.");
  }
  return text;
}

// 데이터행(주석 제외)만 추출 (공백 구분 · ASOS용)
export function dataLines(text) {
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => l.trim().split(/\s+/));
}

// 고층 응답은 콤마/공백 혼용 + #START7777/#7777END 마커가 있을 수 있다.
// 마커·주석을 걷어내고 콤마·공백 어느 쪽으로 구분돼 있어도 셀로 쪼갠다.
export function dataLinesFlexible(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !/^7777|7777END|START7777/.test(l))
    .map((l) => l.replace(/[=]+$/, "").trim().split(/[\s,]+/).filter(Boolean));
}

// ASOS 시간자료: 한 지점·기간을 시계열 객체 배열로
export async function fetchAsosHourly({ stn, tm1, tm2 }) {
  const url = buildUrl(ENDPOINTS.asosHourly, { tm1, tm2, stn, help: 0 });
  const text = await fetchText(url);
  return dataLines(text).map((c) => ({
    time: toIso(c[COLUMN_MAP.TM]),
    stn: Number(c[COLUMN_MAP.STN]),
    wd: num(c[COLUMN_MAP.WD]),
    ws: num(c[COLUMN_MAP.WS]),
    ps: num(c[COLUMN_MAP.PS]),
    ta: num(c[COLUMN_MAP.TA]),
    hm: num(c[COLUMN_MAP.HM]),
    rn: num(c[COLUMN_MAP.RN]),
    sd: num(c[COLUMN_MAP.SD_DAY]),
  }));
}

// "YYYYMMDDHHMM" → "YYYY-MM-DDTHH:00"
export function toIso(tm) {
  const s = String(tm);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:00`;
}

// upp_temp(고층 기온) 표준 컬럼 인덱스. ※ `--help-dump-upp` 로 검증·보정할 것.
// 일반적 순서: TM, STN, PA(hPa), HT(고도 m), TA(°C), TD(°C), WD, WS
export const COLUMN_MAP_UPP = { TM: 0, STN: 1, PA: 2, HT: 3, TA: 4 };

// UTC tm 문자열(YYYYMMDD + HHMM)을 KST 시각 문자열로
export function utcToKstIso(dateYmd, hhmmUtc) {
  const d = new Date(`${dateYmd.slice(0,4)}-${dateYmd.slice(4,6)}-${dateYmd.slice(6,8)}T${hhmmUtc.slice(0,2)}:${hhmmUtc.slice(2,4)}:00Z`);
  d.setUTCHours(d.getUTCHours() + 9); // KST
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth()+1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

// 레윈존데 연직 기온: 한 지점·한 시각(UTC)을 레벨 배열로.
// dateYmd: KST 기준 날짜(YYYYMMDD). tmUtc: "0000"(=09KST) 또는 "1200"(=21KST).
// 순수 파서(네트워크 없음) — 오프라인 self-test 대상.
export function parseUpperAir(text, levels) {
  const rows = dataLinesFlexible(text)
    .map((c) => ({
      pressureHpa: Number(c[COLUMN_MAP_UPP.PA]),
      heightM: num(c[COLUMN_MAP_UPP.HT]),
      ta: num(c[COLUMN_MAP_UPP.TA]),
    }))
    .filter((r) => Number.isFinite(r.pressureHpa) && r.ta != null);
  const keep = levels || [1000, 925, 850, 700, 500];
  const picked = keep.map((p) => rows.find((r) => r.pressureHpa === p)).filter(Boolean);
  return { levels: picked, rawCount: rows.length };
}

export async function fetchUpperAir({ stn, dateYmd, tmUtc = "0000", levels }) {
  const url = buildUrl(ENDPOINTS.upperAir, { tm: `${dateYmd}${tmUtc}`, stn, pa: 0, help: 0 });
  const text = await fetchText(url);
  const { levels: picked, rawCount } = parseUpperAir(text, levels);
  return { levels: picked, timeKst: utcToKstIso(dateYmd, tmUtc), rawCount };
}

// help=1 헤더 덤프 (컬럼 검증용)
async function helpDump(kind) {
  if (!AUTH_KEY) { console.error("KMA_AUTH_KEY 미설정"); process.exit(1); }
  const url = kind === "upp"
    ? buildUrl(ENDPOINTS.upperAir, { tm: "202305010000", stn: 90, pa: 0, help: 1 })
    : buildUrl(ENDPOINTS.asosHourly, { tm1: "202305010000", tm2: "202305010300", stn: 100, help: 1 });
  console.log("GET", url, "\n");
  console.log(await fetchText(url));
}

if (process.argv[1] && process.argv[1].endsWith("kma.mjs")) {
  if (process.argv.includes("--help-dump")) helpDump("asos").catch((e) => { console.error(e.message); process.exit(1); });
  if (process.argv.includes("--help-dump-upp")) helpDump("upp").catch((e) => { console.error(e.message); process.exit(1); });
}
