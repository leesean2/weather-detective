// type: "wind" — 풍향/풍속. 바람이 어느 쪽에서 부는지(기상학적 풍향=불어오는 방향)를
// 나침반으로 보여준다. 푄 사건에서 "서풍 계열" 단서를 드러내는 핵심 시각화.
const W = 340, H = 220, CX = 170, CY = 108, R = 74;
const DIRS = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];

function meanWind(points) {
  let sx = 0, sy = 0, n = 0, spd = 0;
  for (const p of points) {
    if (p.wd == null || p.ws == null) continue;
    const a = (p.wd * Math.PI) / 180;
    sx += p.ws * Math.sin(a);
    sy += p.ws * Math.cos(a);
    spd += p.ws;
    n += 1;
  }
  if (!n) return null;
  let deg = (Math.atan2(sx, sy) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return { deg, speed: spd / n };
}

function dirLabel(deg) {
  return DIRS[Math.round(deg / 45) % 8];
}

function onCircle(deg, r) {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
}

export default function WindCompass({ data }) {
  const m = meanWind(data.points);
  if (!m) return <p className="viz__sub">풍향 데이터가 부족합니다.</p>;

  const [ex, ey] = onCircle(m.deg, R);          // 바람이 불어오는 가장자리
  const [hx, hy] = onCircle(m.deg, 14);         // 중심 근처(화살촉)
  const label = dirLabel(m.deg);

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="평균 풍향 나침반">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#2c3340" />
        <circle cx={CX} cy={CY} r={R / 2} fill="none" stroke="#222a36" />
        {DIRS.map((d, i) => {
          const [lx, ly] = onCircle(i * 45, R + 13);
          return <text key={d} x={lx} y={ly + 3} textAnchor="middle" className="viz__tick">{d}</text>;
        })}
        {/* 바람이 불어오는 방향 → 중심 */}
        <line x1={ex} y1={ey} x2={hx} y2={hy} stroke="#e6b450" strokeWidth="3" />
        <polygon
          points={arrowHead(ex, ey, hx, hy)}
          fill="#e6b450"
        />
        <circle cx={CX} cy={CY} r="3" fill="#e6b450" />
      </svg>
      <figcaption className="viz__legend">
        <span className="viz__hi" style={{ fontSize: 13 }}>{label}풍 계열</span>
        <span className="viz__sub">· 평균 풍속 {m.speed.toFixed(1)} m/s · 바람이 불어오는 쪽 → 중심</span>
      </figcaption>
    </figure>
  );
}

// (ex,ey)에서 (hx,hy)로 향하는 화살촉 삼각형
function arrowHead(ex, ey, hx, hy) {
  const ang = Math.atan2(hy - ey, hx - ex);
  const len = 11, spread = 0.42;
  const p1 = [hx - len * Math.cos(ang - spread), hy - len * Math.sin(ang - spread)];
  const p2 = [hx - len * Math.cos(ang + spread), hy - len * Math.sin(ang + spread)];
  return `${hx},${hy} ${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
}
