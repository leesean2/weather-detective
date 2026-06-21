// clueData.js
// 1단계에서 확정하는 "단서 type별 data 형태" 계약.
// 0단계 스키마는 clue.data 를 generic object 로 뒀고, 여기서 type 별 구조를 못박는다.
// 파이프라인(build-case)의 출력과 2단계 렌더러가 이 형태를 공유한다.
//
// 공통 규칙:
//  - 시각(time)은 "YYYY-MM-DDTHH:00" (KST) 문자열.
//  - 결측값은 null (KMA 센티넬 -9/-99/-50 등은 파이프라인에서 null 로 변환).
//  - 단위: 기온 °C, 강수/적설 mm·cm, 기압 hPa, 풍속 m/s, 풍향 deg, 습도 %.

/**
 * @typedef {Object} TempComparisonData   // type: "temp-comparison"
 * @property {Array<{ stn:number, name:string, elevationM:number,
 *                    points: Array<{ time:string, ta:number|null }> }>} series
 */

/**
 * @typedef {Object} TimeseriesData       // type: "timeseries" (강수/적설 등)
 * @property {number} stn
 * @property {string} name
 * @property {Array<{ time:string, rn:number|null, sd:number|null }>} points
 */

/**
 * @typedef {Object} PressureMapData      // type: "pressure-map"
 * @property {string} time
 * @property {Array<{ stn:number, name:string, lat:number, lon:number,
 *                    ps:number|null }>} stations  // 해면기압 분포로 기압배치 근사
 * @property {string} [note]
 */

/**
 * @typedef {Object} UpperAirData         // type: "upper-air" (레윈존데)
 * @property {number} stn
 * @property {string} name
 * @property {string} time
 * @property {Array<{ pressureHpa:number, heightM:number|null,
 *                    ta:number|null }>} levels   // 850hPa 등 상층 기온
 */

/**
 * @typedef {Object} WindData             // type: "wind"
 * @property {number} stn
 * @property {string} name
 * @property {Array<{ time:string, wd:number|null, ws:number|null }>} points
 */

/**
 * @typedef {Object} SstData              // type: "sst" (해양기상부이)
 * @property {number} buoy
 * @property {string} name
 * @property {Array<{ time:string, sst:number|null }>} points
 */

/**
 * @typedef {Object} TextData             // type: "text"
 * @property {string} body
 */

// 형태가 계약을 지키는지 가볍게 점검 (개발 중 조기 발견용).
export function validateClueData(type, data) {
  const errs = [];
  const arr = (x) => Array.isArray(x);
  if (data == null) return [`data 없음 (type=${type})`];

  switch (type) {
    case "temp-comparison":
      if (!arr(data.series) || data.series.length < 1) errs.push("series 비어있음");
      else data.series.forEach((s, i) => {
        if (typeof s.elevationM !== "number") errs.push(`series[${i}].elevationM 누락`);
        if (!arr(s.points)) errs.push(`series[${i}].points 배열 아님`);
      });
      break;
    case "timeseries":
      if (!arr(data.points)) errs.push("points 배열 아님");
      break;
    case "pressure-map":
      if (!arr(data.stations) || data.stations.length < 2)
        errs.push("stations 2개 이상 필요(기압배치 근사)");
      break;
    case "upper-air":
      if (!arr(data.levels) || data.levels.length < 1) errs.push("levels 비어있음");
      else if (!data.levels.some((l) => l.pressureHpa === 850))
        errs.push("850hPa 레벨 권장(상층 한기 단서)");
      break;
    case "wind":
    case "sst":
      if (!arr(data.points)) errs.push("points 배열 아님");
      break;
    case "text":
      if (typeof data.body !== "string") errs.push("body 문자열 아님");
      break;
    default:
      errs.push(`알 수 없는 type: ${type}`);
  }
  return errs;
}
