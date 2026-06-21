import ClueViz from "./clues/ClueViz.jsx";

// 단서 카드.
// 열리지 않은 잠긴 단서는 '조사하기' 버튼. 열리면 요약 + type별 시각화를 보여준다.
export default function ClueCard({ clue, revealed, canAfford, onOpen }) {
  if (!revealed) {
    return (
      <button
        type="button"
        className="clue clue--locked"
        onClick={() => onOpen(clue)}
        disabled={!canAfford}
        aria-label={`${clue.title} 조사하기`}
      >
        <span className="clue__head">
          <span className="clue__type">{clue.type}</span>
          <span className="clue__seal">봉인 · 조사 {clue.cost ?? 1}</span>
        </span>
        <span className="clue__title">{clue.title}</span>
        <span className="clue__redacted" aria-hidden="true">▓▓▓▓▓▓▓ ▓▓▓▓ ▓▓▓▓▓▓ ▓▓▓</span>
        <span className="clue__cta">{canAfford ? "조사하기 →" : "조사 횟수 부족"}</span>
      </button>
    );
  }

  return (
    <article className="clue clue--open clue--revealed">
      <div className="clue__head">
        <span className="clue__type">{clue.type}</span>
        <span className="clue__open-badge">확보</span>
      </div>
      <h3 className="clue__title">{clue.title}</h3>
      <p className="clue__summary">{clue.summary}</p>
      <ClueViz clue={clue} />
    </article>
  );
}
