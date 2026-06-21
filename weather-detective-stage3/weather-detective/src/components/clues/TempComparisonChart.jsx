import { scaleLinear, hourOf, toSegments, niceDomain } from "./svgUtils.js";

// type: "temp-comparison" — 두 지점 기온 시계열 + 0°C 기준선(어는점).
// 산간(고지대)이 0℃ 안팎, 평지가 영상이면 "같은 강수, 다른 형태"의 핵심 증거.
const W = 460, H = 200, M = { t: 22, r: 12, b: 26, l: 40 };
const COLORS = ["#6fb3c9", "#e6915a"]; // 0: 산간(차가움), 1: 평지(따뜻함)

export default function TempComparisonChart({ data }) {
  const series = data.series;
  const allTa = series.flatMap((s) => s.points.map((p) => p.ta));
  const [yMin, yMax] = niceDomain(allTa, 1);
  const sx = scaleLinear([0, 23], [M.l, W - M.r]);
  const sy = scaleLinear([yMin, yMax], [H - M.b, M.t]);
  const zeroY = sy(0);

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="산간과 평지의 시간별 기온 비교">
        {/* 영하 구간 음영 */}
        {yMin < 0 && (
          <rect x={M.l} y={zeroY} width={W - M.r - M.l} height={H - M.b - zeroY}
            fill="#6fb3c9" opacity="0.07" />
        )}
        {/* 0°C 기준선 */}
        {yMin < 0 && yMax > 0 && (
          <g>
            <line x1={M.l} x2={W - M.r} y1={zeroY} y2={zeroY}
              stroke="#9aa3b2" strokeDasharray="4 3" strokeWidth="1" />
            <text x={W - M.r} y={zeroY - 4} textAnchor="end" className="viz__ref">0°C 어는점</text>
          </g>
        )}
        {/* y 눈금 */}
        <text x={M.l - 5} y={M.t - 5} textAnchor="end" className="viz__tick">°C</text>
        {[yMin, Math.round((yMin + yMax) / 2), yMax].map((t) => (
          <text key={t} x={M.l - 5} y={sy(t) + 3} textAnchor="end" className="viz__tick">{t}</text>
        ))}
        {/* x 눈금 */}
        {[0, 6, 12, 18, 23].map((h) => (
          <text key={h} x={sx(h)} y={H - 8} textAnchor="middle" className="viz__tick">{h}시</text>
        ))}
        {/* 시리즈 */}
        {series.map((s, i) => {
          const pts = s.points.map((p) => ({ x: hourOf(p.time), y: p.ta }));
          return toSegments(pts, sx, sy).map((seg, j) => (
            <polyline key={`${i}-${j}`} points={seg.join(" ")} fill="none"
              stroke={COLORS[i % 2]} strokeWidth="2.2" strokeLinejoin="round" />
          ));
        })}
      </svg>
      <figcaption className="viz__legend">
        {series.map((s, i) => (
          <span key={s.stn} className="viz__legend-item">
            <span className="viz__swatch" style={{ background: COLORS[i % 2] }} />
            {s.name} <span className="viz__sub">({Math.round(s.elevationM)}m)</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
