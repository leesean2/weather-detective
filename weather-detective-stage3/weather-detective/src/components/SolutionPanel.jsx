// 사건 해결 화면. 정답 메커니즘 + 인과 체인 + 학습 정리.
export default function SolutionPanel({ solution, learning, confirmedAll, onReset }) {
  return (
    <section className="solved">
      <div className="solved__badge">사건 해결</div>

      <h2 className="solved__title">무슨 일이 있었나</h2>
      <p className="solved__mechanism">{solution.mechanism}</p>

      {!confirmedAll && (
        <p className="solved__note">
          핵심 단서를 다 열어보지 않고도 맞혔어. 아래 인과 과정을 보며 직접 확인해 보자.
        </p>
      )}

      <ol className="chain">
        {solution.causalChain.map((step, i) => (
          <li key={i} className="chain__step">
            <span className="chain__num">{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <div className="solved__factors">
        {solution.keyFactors.map((f) => (
          <span key={f} className="factor">{f}</span>
        ))}
      </div>

      <div className="learn">
        <h3 className="learn__title">오늘 배운 것</h3>
        <p className="learn__summary">{learning.summary}</p>
        <div className="learn__concepts">
          {learning.concepts.map((c) => (
            <span key={c} className="concept">{c}</span>
          ))}
        </div>
        {learning.curriculumLink && (
          <p className="learn__curr">연계: {learning.curriculumLink}</p>
        )}
      </div>

      <button className="btn btn--ghost" type="button" onClick={onReset}>처음부터 다시 풀기</button>
    </section>
  );
}
