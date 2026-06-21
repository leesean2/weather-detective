import ClueCard from "./ClueCard.jsx";

export default function ClueBoard({ investigation, openedIds, remaining, onOpen }) {
  const { clues, maxInvestigations } = investigation;
  const isRevealed = (c) => !c.locked || openedIds.has(c.id);
  const revealedCount = clues.filter(isRevealed).length;
  const noLimit = !maxInvestigations;

  return (
    <section className="board">
      <div className="board__head">
        <h2 className="board__title">단서 보드</h2>
        <p className="board__meta">
          확보 {revealedCount} / 총 {clues.length}
          {noLimit ? "" : ` · 남은 조사 ${remaining}회`}
        </p>
      </div>
      <div className="board__grid">
        {clues.map((clue) => (
          <ClueCard
            key={clue.id}
            clue={clue}
            revealed={isRevealed(clue)}
            canAfford={noLimit || remaining >= (clue.cost ?? 1)}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  );
}
