import { scaleLinear, niceDomain } from "./svgUtils.js";

// type: "upper-air" — 연직 기온 분포. y는 기압(아래=1000hPa, 위=상층), x는 기온.
// 850hPa 기온이 영하면 떨어지는 강수가 눈 형태를 유지하는 핵심 단서.
const W = 360, H = 230, M = { t: 24, r: 16, b: 28, l: 40 };

export default function UpperAirProfile({ data }) {
  const levels = [...data.levels].sort((a, b) => b.pressureHpa - a.pressureHpa); // 1000 → 700
  const pMax = levels[0].pressureHpa, pMin = levels.at(-1).pressureHpa;
  const [xMin, xMax] = niceDomain(levels.map((l) => l.ta), 2);
  const sx = scaleLinear([xMin, xMax], [M.l, W - M.r]);
  const sy = scaleLinear([pMax, pMin], [H - M.b, M.t]); // 기압 큰 쪽이 아래
  const zeroX = sx(0);

  const line = levels.map((l) => `${sx(l.ta).toFixed(1)},${sy(l.pressureHpa).toFixed(1)}`).join(" ");
  const key850 = levels.find((l) => l.pressureHpa === 850);

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="상층 기온 연직 분포">
        {/* 영하 영역 음영 */}
        {xMin < 0 && (
          <rect x={M.l} y={M.t} width={zeroX - M.l} height={H - M.b - M.t} fill="#6fb3c9" opacity="0.07" />
        )}
        {/* 0°C 수직 기준선 */}
        {xMin < 0 && xMax > 0 && (
          <g>
            <line x1={zeroX} x2={zeroX} y1={M.t} y2={H - M.b} stroke="#9aa3b2" strokeDasharray="4 3" />
            <text x={zeroX} y={M.t - 4} textAnchor="middle" className="viz__ref">0°C</text>
          </g>
        )}
        {/* 기압 레벨 눈금 + 그리드 */}
        {levels.map((l) => (
          <g key={l.pressureHpa}>
            <line x1={M.l} x2={W - M.r} y1={sy(l.pressureHpa)} y2={sy(l.pressureHpa)}
              stroke="#2c3340" strokeWidth="1" />
            <text x={M.l - 6} y={sy(l.pressureHpa) + 3} textAnchor="end" className="viz__tick">{l.pressureHpa}</text>
          </g>
        ))}
        {/* 프로파일 선 + 점 */}
        <polyline points={line} fill="none" stroke="#e6915a" strokeWidth="2.2" strokeLinejoin="round" />
        {levels.map((l) => (
          <circle key={l.pressureHpa} cx={sx(l.ta)} cy={sy(l.pressureHpa)} r="3"
            fill={l.pressureHpa === 850 ? "#e6b450" : "#e6915a"} />
        ))}
        {/* 850hPa 강조 */}
        {key850 && (
          <text x={sx(key850.ta) + 8} y={sy(850) - 6} className="viz__hi">
            850hPa {key850.ta}°C{key850.ta < 0 ? " · 영하!" : ""}
          </text>
        )}
        <text x={(W) / 2} y={H - 8} textAnchor="middle" className="viz__tick">기온(°C) →</text>
        <text x={M.l - 6} y={M.t - 7} textAnchor="end" className="viz__tick">hPa</text>
      </svg>
      <figcaption className="viz__legend">
        <span className="viz__sub">{data.name} · {String(data.time).slice(11)} 관측</span>
      </figcaption>
    </figure>
  );
}
