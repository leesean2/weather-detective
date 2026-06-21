import { useMemo, useState } from "react";
import { validateCase } from "../engine/validateCase.js";
import { requestTutor } from "../api/tutor.js";
import CaseBriefing from "./CaseBriefing.jsx";
import ClueBoard from "./ClueBoard.jsx";
import HypothesisPanel from "./HypothesisPanel.jsx";
import VerdictPanel from "./VerdictPanel.jsx";
import SolutionPanel from "./SolutionPanel.jsx";

export default function CasePlay({ caseData }) {
  const { valid, errors } = useMemo(() => validateCase(caseData), [caseData]);
  const clues = caseData.investigation.clues;
  const tutorCfg = caseData.aiTutor || {};

  // ── 단서 열기 ──
  const maxInv = caseData.investigation.maxInvestigations || 0;
  const [openedIds, setOpenedIds] = useState(() => new Set());
  const spent = clues.filter((c) => openedIds.has(c.id)).reduce((s, c) => s + (c.cost ?? 1), 0);
  const remaining = maxInv ? Math.max(0, maxInv - spent) : 0;
  const isRevealed = (c) => !c.locked || openedIds.has(c.id);
  const openedTitles = clues.filter(isRevealed).map((c) => c.title);
  const unopenedTitles = clues.filter((c) => !isRevealed(c)).map((c) => c.title);

  const handleOpen = (clue) => {
    if (openedIds.has(clue.id)) return;
    if (maxInv && remaining < (clue.cost ?? 1)) return;
    setOpenedIds((prev) => new Set(prev).add(clue.id));
  };

  // ── 가설/결론 ──
  const [selectedId, setSelectedId] = useState(null);
  const [result, setResult] = useState(null);
  const [tutor, setTutor] = useState({ loading: false, data: null });

  const handleSubmit = () => {
    const option = caseData.hypotheses.options.find((o) => o.id === selectedId);
    if (!option) return;
    if (option.verdict === "correct") {
      setResult({ status: "solved", option });
      return;
    }
    setResult({ status: "wrong", option });
    setTutor({ loading: true, data: null });
    requestTutor({
      mode: "assess",
      systemContext: tutorCfg.systemContext,
      rules: tutorCfg.rules,
      openedClues: openedTitles,
      unopenedClues: unopenedTitles,
      optionText: option.text,
      verdict: option.verdict,
      correctFactors: caseData.solution.keyFactors,
    }).then((r) => setTutor({ loading: false, data: r.ok ? r.tutor : null }));
  };
  const handleRetry = () => { setResult(null); setSelectedId(null); setTutor({ loading: false, data: null }); };
  const handleReset = () => { handleRetry(); setOpenedIds(new Set()); setHint({ loading: false, data: null }); };

  // ── 조사 중 힌트 (소크라테스) ──
  const [hint, setHint] = useState({ loading: false, data: null });
  const handleHint = () => {
    setHint({ loading: true, data: null });
    requestTutor({
      mode: "hint",
      systemContext: tutorCfg.systemContext,
      rules: tutorCfg.rules,
      hintLadder: tutorCfg.hintLadder,
      prompt: caseData.hypotheses.prompt,
      openedClues: openedTitles,
      unopenedClues: unopenedTitles,
    }).then((r) => {
      if (r.ok) { setHint({ loading: false, data: r.tutor.hint }); return; }
      // 폴백: hintLadder 에서 진행도에 맞는 힌트
      const ladder = tutorCfg.hintLadder || [];
      const opened = openedTitles.length;
      const fb = ladder.length ? ladder[Math.min(opened, ladder.length - 1)] : "아직 열지 않은 단서를 조사해 보자.";
      setHint({ loading: false, data: fb });
    });
  };

  const correctOpt = caseData.hypotheses.options.find((o) => o.verdict === "correct");
  const confirmedAll = (correctOpt?.requiredClues || []).every((id) => openedIds.has(id));
  const solved = result?.status === "solved";

  return (
    <>
      {!valid && (
        <div className="schema-error" role="alert">
          <strong>케이스 스키마 검증 실패</strong>
          <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      <CaseBriefing meta={caseData.meta} />

      <ClueBoard
        investigation={caseData.investigation}
        openedIds={openedIds}
        remaining={remaining}
        onOpen={handleOpen}
      />

      {solved ? (
        <SolutionPanel
          solution={caseData.solution}
          learning={caseData.learning}
          confirmedAll={confirmedAll}
          onReset={handleReset}
        />
      ) : result?.status === "wrong" ? (
        <VerdictPanel
          option={result.option}
          unopenedTitles={unopenedTitles}
          loading={tutor.loading}
          tutor={tutor.data}
          onRetry={handleRetry}
        />
      ) : (
        <>
          <div className="hintbar">
            <button className="btn btn--ghost btn--sm" type="button" onClick={handleHint} disabled={hint.loading}>
              {hint.loading ? "조수 생각 중…" : "AI 조수에게 힌트 받기"}
            </button>
            {hint.data && <p className="hintbar__text">💡 {hint.data}</p>}
          </div>
          <HypothesisPanel
            hypotheses={caseData.hypotheses}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onSubmit={handleSubmit}
          />
        </>
      )}

      <footer className="app__foot">
        <span>
          {caseData.id} · v{caseData.version} ·{" "}
          <span className={`status status--${caseData.dataStatus}`}>
            {caseData.dataStatus === "verified" ? "데이터 검증됨" : "데이터 placeholder (1단계에서 교체)"}
          </span>
        </span>
        <span className="app__foot-src">출처: {caseData.dataSources.map((d) => d.name).join(" · ")}</span>
      </footer>
    </>
  );
}
