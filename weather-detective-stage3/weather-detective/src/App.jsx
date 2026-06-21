import { useState } from "react";
import { cases, getRandomCase } from "./cases/index.js";
import CasePlay from "./components/CasePlay.jsx";

export default function App() {
  const [caseId, setCaseId] = useState(() => getRandomCase().id);
  const activeCase = cases.find((c) => c.id === caseId) ?? cases[0];
  const caseIndex = cases.findIndex((c) => c.id === caseId);

  function handleRandom() {
    setCaseId(getRandomCase(caseId).id);
  }

  function handlePrev() {
    setCaseId(cases[(caseIndex - 1 + cases.length) % cases.length].id);
  }

  function handleNext() {
    setCaseId(cases[(caseIndex + 1) % cases.length].id);
  }

  return (
    <div className="app">
      <div className="app__shell">
        <div className="random-header">
          <div className="case-nav">
            <button type="button" className="btn-nav" onClick={handlePrev} title="이전 사건">‹</button>
            <span className="case-counter">사건 {caseIndex + 1} / {cases.length}</span>
            <button type="button" className="btn-nav" onClick={handleNext} title="다음 사건">›</button>
          </div>
          <button type="button" className="btn-random" onClick={handleRandom} title="랜덤 사건 출제">
            🎲 랜덤 출제
          </button>
        </div>
        <CasePlay key={activeCase.id} caseData={activeCase} />
      </div>
    </div>
  );
}
