// 사건 선택 탭. 난이도 순으로 사건을 고른다.
export default function CasePicker({ cases, activeId, onSelect }) {
  return (
    <nav className="picker" aria-label="사건 선택">
      {cases.map((c, i) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            type="button"
            className={`picker__tab ${active ? "is-active" : ""}`}
            aria-current={active ? "true" : undefined}
            onClick={() => onSelect(c.id)}
          >
            <span className="picker__no">사건 {i + 1}</span>
            <span className="picker__name">{c.meta.title}</span>
            <span className="picker__diff" aria-label={`난이도 ${c.meta.difficulty}`}>
              {"●".repeat(c.meta.difficulty)}{"○".repeat(3 - c.meta.difficulty)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
