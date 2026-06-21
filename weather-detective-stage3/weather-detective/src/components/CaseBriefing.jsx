export default function CaseBriefing({ meta }) {
  const { title, subtitle, event, difficulty, targetAudience, briefing } = meta;
  return (
    <header className="briefing">
      <div className="briefing__file">
        <span className="briefing__label">사건 파일</span>
        <span className="briefing__tags">
          <span className="tag">{event.region}</span>
          <span className="tag">{event.phenomenon}</span>
          <span className="tag tag--diff">난이도 {"●".repeat(difficulty)}{"○".repeat(3 - difficulty)}</span>
          <span className="tag">{targetAudience}</span>
        </span>
      </div>
      <h1 className="briefing__title">{title}</h1>
      {subtitle && <p className="briefing__subtitle">{subtitle}</p>}
      <p className="briefing__body">{briefing}</p>
    </header>
  );
}
