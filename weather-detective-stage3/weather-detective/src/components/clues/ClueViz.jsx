import TempComparisonChart from "./TempComparisonChart.jsx";
import PrecipSnowChart from "./PrecipSnowChart.jsx";
import UpperAirProfile from "./UpperAirProfile.jsx";
import PressureStations from "./PressureStations.jsx";
import WindCompass from "./WindCompass.jsx";

// clue.type → 시각화 렌더러. data 가 비었거나 placeholder면 안내만.
export default function ClueViz({ clue }) {
  const data = clue.data;
  if (!data || data._placeholder) {
    return <p className="viz__sub">데이터 준비 중 (1단계 파이프라인으로 채움).</p>;
  }

  let body;
  switch (clue.type) {
    case "temp-comparison": body = <TempComparisonChart data={data} />; break;
    case "timeseries":      body = <PrecipSnowChart data={data} />; break;
    case "upper-air":       body = <UpperAirProfile data={data} />; break;
    case "pressure-map":    body = <PressureStations data={data} />; break;
    case "wind":            body = <WindCompass data={data} />; break;
    case "text":            body = <p className="viz__text">{data.body}</p>; break;
    default:                body = <p className="viz__sub">미지원 시각화: {clue.type}</p>;
  }

  return (
    <div className="cluviz">
      {body}
      {data.synthetic && <p className="cluviz__synthetic">⚠ 합성 데이터 (실제 관측 아님 · 1단계에서 교체)</p>}
    </div>
  );
}
