// svgUtils.js — 의존성 없는 경량 SVG 차트용 헬퍼.

export function scaleLinear([d0, d1], [r0, r1]) {
  const span = d1 - d0 || 1;
  return (v) => r0 + (r1 - r0) * ((v - d0) / span);
}

// {time:"...THH:00"} → 시(hour) 숫자
export function hourOf(time) {
  return Number(String(time).slice(11, 13));
}

// 결측(null) 구간을 끊어 polyline 점 문자열 배열로
export function toSegments(points, sx, sy) {
  const segs = [];
  let cur = [];
  for (const p of points) {
    if (p.y == null || Number.isNaN(p.y)) {
      if (cur.length) segs.push(cur), (cur = []);
    } else {
      cur.push(`${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`);
    }
  }
  if (cur.length) segs.push(cur);
  return segs;
}

export function niceDomain(values, pad = 1) {
  const v = values.filter((x) => x != null && !Number.isNaN(x));
  if (!v.length) return [0, 1];
  let min = Math.min(...v), max = Math.max(...v);
  if (min === max) { min -= 1; max += 1; }
  return [Math.floor(min - pad), Math.ceil(max + pad)];
}
