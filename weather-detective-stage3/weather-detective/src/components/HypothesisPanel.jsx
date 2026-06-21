// 가설 제출 패널. 선택지 중 하나를 골라 제출한다.
export default function HypothesisPanel({ hypotheses, selectedId, onSelect, onSubmit }) {
  return (
    <section className="hypo">
      <h2 className="hypo__title">가설 제출</h2>
      <p className="hypo__prompt">{hypotheses.prompt}</p>
      <div className="hypo__options" role="radiogroup" aria-label={hypotheses.prompt}>
        {hypotheses.options.map((o) => (
          <label key={o.id} className={`hypo__opt ${selectedId === o.id ? "is-selected" : ""}`}>
            <input
              type="radio"
              name="hypothesis"
              value={o.id}
              checked={selectedId === o.id}
              onChange={() => onSelect(o.id)}
            />
            <span>{o.text}</span>
          </label>
        ))}
      </div>
      <button className="btn" type="button" disabled={!selectedId} onClick={onSubmit}>
        이 가설로 결론 내리기
      </button>
    </section>
  );
}
