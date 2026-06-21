import { useState } from "react";
import { cases, getRandomCase } from "./cases/index.js";
import CasePicker from "./components/CasePicker.jsx";
import CasePlay from "./components/CasePlay.jsx";

export default function App() {
  const [caseId, setCaseId] = useState(() => getRandomCase().id);
  const activeCase = cases.find((c) => c.id === caseId) ?? cases[0];

  function handleRandom() {
    setCaseId(getRandomCase(caseId).id);
  }

  return (
    <div className="app">
      <div className="app__shell">
        <div className="picker-header">
          <CasePicker cases={cases} activeId={caseId} onSelect={setCaseId} />
          <button type="button" className="btn-random" onClick={handleRandom} title="랜덤 사건 출제">
            🎲 랜덤 출제
          </button>
        </div>
        {/* key={caseId}: 사건 전환 시 CasePlay 를 리마운트해 플레이 상태를 초기화 */}
        <CasePlay key={activeCase.id} caseData={activeCase} />
      </div>
    </div>
  );
}
