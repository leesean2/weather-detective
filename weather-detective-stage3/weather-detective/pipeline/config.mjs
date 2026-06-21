// config.mjs
// 파이프라인 설정. 인증키는 환경변수(KMA_AUTH_KEY)에서 읽는다.
// 키 발급: https://apihub.kma.go.kr 회원가입 → 마이페이지에서 authKey 확인.
// (공고가 안내한 data.kma.go.kr 대용량 API 와 동일한 KMA 데이터원이며,
//  apihub 가 URL·authKey 방식이라 스크립트화에 가장 깔끔하다.)

export const AUTH_KEY = process.env.KMA_AUTH_KEY || "";

export const ENDPOINTS = {
  // 지상(종관, ASOS) 시간자료. 검증된 엔드포인트.
  // 예: kma_sfctm3.php?tm1=YYYYMMDDHHMM&tm2=YYYYMMDDHHMM&stn=108&help=1&authKey=...
  asosHourly: "https://apihub.kma.go.kr/api/typ01/url/kma_sfctm3.php",

  // 고층(레윈존데) 기온 시간자료. tm=UTC, stn=지점, pa=기압레벨(0=전체).
  // 예: upp_temp.php?tm=201806210000&stn=0&pa=0&help=1&authKey=...
  upperAir: process.env.KMA_UPPER_AIR_ENDPOINT || "https://apihub.kma.go.kr/api/typ01/url/upp_temp.php",
};

// 지점 정의. 고도(elevationM)는 stn_inf.php 로 검증 가능.
export const STATIONS = {
  daegwallyeong: { stn: 100, name: "대관령", role: "산간(고지대)", elevationM: 772.57, lat: 37.6771, lon: 128.7183 },
  gangneung:     { stn: 105, name: "강릉",   role: "평지(해안)",  elevationM: 26.04,  lat: 37.7515, lon: 128.8910 },
  sokcho:        { stn: 90,  name: "속초",   role: "동해안",      elevationM: 18.06,  lat: 38.2509, lon: 128.5647 },
  wonju:         { stn: 114, name: "원주",   role: "영서",        elevationM: 150.4,  lat: 37.3375, lon: 127.9466 },
  seoul:         { stn: 108, name: "서울",   role: "수도권",      elevationM: 85.5,   lat: 37.5714, lon: 126.9658 },
};

// 레윈존데(고층관측) 지점. ※ 지점번호는 apihub '고층관측 지점정보'로 반드시 검증할 것.
// 지상 ASOS 번호와 다를 수 있다(별도 관측망).
export const UPPER_STATIONS = {
  sokcho: { stn: 90,    name: "속초(레윈존데)" },   // 영동/강원 사건용 (case-01, 02)
  osan:   { stn: 47122, name: "오산(레윈존데)" },   // 내륙 사건용 (case-03)
};

// 표시할 표준 기압면(hPa). upp_temp 응답에서 이 레벨만 추린다.
export const UPPER_LEVELS = [1000, 925, 850, 700, 500];

// 사건 1: 늦봄 산간 대설 후보 탐색 구간 (대관령 4월 하순~5월 초).
// scout 로 이 구간을 훑어 "대관령 적설 증가 & 강릉 강수는 비" 인 날을 찾는다.
export const SCOUT_WINDOW = {
  // 연도는 인증키 보유 기간/원하는 사례에 맞게 조정.
  ranges: [
    { startDt: "20230420", endDt: "20230510" },
    { startDt: "20220420", endDt: "20220510" },
  ],
};

// KMA 결측 센티넬 → null
export function num(v) {
  if (v === undefined || v === null) return null;
  const n = Number(String(v).trim());
  if (!Number.isFinite(n)) return null;
  if (n <= -50 || n === -9 || n === -99 || n === -999) return null; // 흔한 결측값
  return n;
}
