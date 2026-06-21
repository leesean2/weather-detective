import { scaleLinear } from "./svgUtils.js";

// type: "pressure-map" — 지점 해면기압 분포로 기압배치를 근사.
// 정식 일기도는 아니지만, 어디가 고압/저압인지 상대 비교용.
const W = 360, H = 200, M = 30;

export default function PressureStations({ data }) {
  const st = data.stations.filter((s) => s.ps != null);
  if (st.length < 2) return <p className="viz__sub">표시할 기압 데이터가 부족합니다.</p>;

  const lats = st.map((s) => s.lat), lons = st.map((s) => s.lon), ps = st.map((s) => s.ps);
  const sx = scaleLinear([Math.min(...lons), Math.max(...lons)], [M, W - M]);
  const sy = scaleLinear([Math.min(...lats), Math.max(...lats)], [H - M, M]); // 북쪽이 위
  const pMin = Math.min(...ps), pMax = Math.max(...ps);
  const sr = scaleLinear([pMin, pMax], [10, 20]); // 기압 클수록 큰 원

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="지점별 해면기압 분포">
        <text x={W / 2} y={14} textAnchor="middle" className="viz__tick">▲ 북</text>
        {st.map((s) => {
          const high = s.ps === pMax;
          return (
            <g key={s.stn}>
              <circle cx={sx(s.lon)} cy={sy(s.lat)} r={sr(s.ps)}
                fill={high ? "#6fb3c9" : "#e6915a"} opacity="0.22"
                stroke={high ? "#6fb3c9" : "#e6915a"} />
              <text x={sx(s.lon)} y={sy(s.lat) - sr(s.ps) - 4} textAnchor="middle" className="viz__tick">{s.name}</text>
              <text x={sx(s.lon)} y={sy(s.lat) + 4} textAnchor="middle" className="viz__hi">{s.ps}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="viz__legend">
        <span className="viz__sub">단위 hPa · 큰 원=상대적 고압. {data.note || ""}</span>
      </figcaption>
    </figure>
  );
}
