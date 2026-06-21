import { scaleLinear, hourOf, niceDomain } from "./svgUtils.js";

// type: "timeseries" — 적설(cm) 선 + 강수(mm) 막대. 산간에 적설이 쌓이는 관측 사실 확인용.
const W = 460, H = 210, M = { t: 14, r: 12, b: 26, l: 30 };

export default function PrecipSnowChart({ data }) {
  const pts = data.points.map((p) => ({ h: hourOf(p.time), rn: p.rn, sd: p.sd }));
  const sx = scaleLinear([0, 23], [M.l, W - M.r]);

  const sdMax = niceDomain(pts.map((p) => p.sd), 0)[1] || 1;
  const rnMax = Math.max(1, ...pts.map((p) => p.rn ?? 0));
  const sySd = scaleLinear([0, sdMax], [H - M.b, M.t]);
  const syRn = scaleLinear([0, rnMax], [H - M.b, M.t + 40]); // 막대는 아래쪽 영역만
  const bw = (W - M.r - M.l) / 24 * 0.5;

  const sdSeg = pts.filter((p) => p.sd != null)
    .map((p) => `${sx(p.h).toFixed(1)},${sySd(p.sd).toFixed(1)}`).join(" ");

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="시간별 강수량과 적설">
        {/* 강수 막대 */}
        {pts.map((p) => (p.rn ? (
          <rect key={`r${p.h}`} x={sx(p.h) - bw / 2} y={syRn(p.rn)}
            width={bw} height={H - M.b - syRn(p.rn)} fill="#6fb3c9" opacity="0.35" />
        ) : null))}
        {/* 적설 선 */}
        <polyline points={sdSeg} fill="none" stroke="#e6b450" strokeWidth="2.4" strokeLinejoin="round" />
        {pts.filter((p) => p.sd != null).map((p) => (
          <circle key={`s${p.h}`} cx={sx(p.h)} cy={sySd(p.sd)} r="2" fill="#e6b450" />
        ))}
        {/* y(적설) 눈금 */}
        {[0, sdMax].map((t) => (
          <text key={t} x={M.l - 5} y={sySd(t) + 3} textAnchor="end" className="viz__tick">{t}</text>
        ))}
        {/* x 눈금 */}
        {[0, 6, 12, 18, 23].map((h) => (
          <text key={h} x={sx(h)} y={H - 8} textAnchor="middle" className="viz__tick">{h}시</text>
        ))}
      </svg>
      <figcaption className="viz__legend">
        <span className="viz__legend-item"><span className="viz__swatch" style={{ background: "#e6b450" }} />적설(cm)</span>
        <span className="viz__legend-item"><span className="viz__swatch" style={{ background: "#6fb3c9", opacity: 0.5 }} />강수(mm)</span>
        <span className="viz__sub">· {data.name}</span>
      </figcaption>
    </figure>
  );
}
