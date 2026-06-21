import { useState } from "react";
import { cases, getRandomCase } from "./cases/index.js";
import CasePlay from "./components/CasePlay.jsx";

export default function App() {
  const [caseId, setCaseId] = useState(() => getRandomCase().id);
  const activeCase = cases.find((c) => c.id === caseId) ?? cases[0];
  const caseIndex = cases.findIndex((c) => c.id === caseId) + 1;

  function handleRandom() {
    setCaseId(getRandomCase(caseId).id);
  }

  return (
    <div className="app">
      <div className="app__shell">
        <div className="random-header">
          <span className="case-counter">사건 {caseIndex} / {cases.length}</span>
          <button type="button" className="btn-random" onClick={handleRandom} title="랜덤 사건 출제">
            🎲 랜덤 출제
          </button>
        </div>
        <CasePlay key={activeCase.id} caseData={activeCase} />
      </div>
    </div>
  );
}
