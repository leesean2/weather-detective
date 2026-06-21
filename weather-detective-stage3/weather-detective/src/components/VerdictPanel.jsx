// 해설 패널. 우선순위: (1) 로딩 (2) AI 소크라테스 응답 (3) 정적 폴백.
// AI 호출이 실패하면 case JSON 의 option.feedback + 넛지로 자연스럽게 폴백한다.
export default function VerdictPanel({ option, unopenedTitles, loading, tutor, onRetry }) {
  const isMisconception = option.verdict === "misconception";

  return (
    <section className={`verdict ${isMisconception ? "verdict--wrong" : "verdict--partial"}`}>
      <div className="verdict__head">
        <span className="verdict__who">AI 조수</span>
        <span className="verdict__tag">
          {loading ? "생각 중…" : tutor ? "OpenRouter 연동" : "정적 폴백"}
        </span>
      </div>

      {loading ? (
        <p className="verdict__feedback">조수가 단서를 살펴보는 중…</p>
      ) : tutor ? (
        <>
          <p className="verdict__verdict">{tutor.assessment}</p>
          <p className="verdict__feedback">{tutor.hint}</p>
          {tutor.pointTo && (
            <p className="verdict__nudge">살펴볼 단서: <strong>{tutor.pointTo}</strong></p>
          )}
        </>
      ) : (
        <>
          <p className="verdict__verdict">
            {isMisconception ? "음, 그건 흔한 오해야." : "방향은 비슷한데 아직 부족해."}
          </p>
          <p className="verdict__feedback">{option.feedback}</p>
          {unopenedTitles.length > 0 && (
            <p className="verdict__nudge">
              아직 열지 않은 단서가 있어: <strong>{unopenedTitles.join(", ")}</strong>. 먼저 조사해 보고 다시 판단해 보자.
            </p>
          )}
        </>
      )}

      <button className="btn btn--ghost" type="button" onClick={onRetry} disabled={loading}>
        다시 추리하기
      </button>
    </section>
  );
}
