import { useState } from "react";
import { cases } from "./cases/index.js";
import CasePicker from "./components/CasePicker.jsx";
import CasePlay from "./components/CasePlay.jsx";

export default function App() {
  const [caseId, setCaseId] = useState(cases[0].id);
  const activeCase = cases.find((c) => c.id === caseId) ?? cases[0];

  return (
    <div className="app">
      <div className="app__shell">
        <CasePicker cases={cases} activeId={caseId} onSelect={setCaseId} />
        {/* key={caseId}: 사건 전환 시 CasePlay 를 리마운트해 플레이 상태를 초기화 */}
        <CasePlay key={activeCase.id} caseData={activeCase} />
      </div>
    </div>
  );
}
