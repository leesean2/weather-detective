# 기상 미스터리 탐정 — 0단계 골격

이상기상 사건을 KMA 관측 데이터로 추리하는 웹 기반 교육 게임. 이 저장소는 **0단계(설계 확정)** 산출물입니다.

## 0단계가 한 일

- **케이스 JSON 스키마 확정** — 프론트 엔진 / 데이터 파이프라인 / AI 프롬프트 세 갈래가 공유하는 단일 계약. `src/cases/case.schema.json`
- **예시 사건 1개 작성** — 늦봄 산간 대설(`case-01-late-spring-snow.json`). 데이터는 `dataStatus: "placeholder"`로 표시했고 1단계에서 실제 KMA 값으로 교체합니다.
- **최소 셸** — 케이스를 불러와 계약을 검증하고, 브리핑 + 단서 보드를 렌더. 잠긴 단서는 봉인 카드로 표시됩니다.

**완료 기준 충족:** 케이스 JSON 한 개를 import 해 화면에 사건 제목·브리핑·단서 보드가 뜬다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 생성 (배포 검증용)
```

## 폴더 구조

```
src/
  cases/
    case.schema.json              # ← 계약(JSON Schema). 모든 사건이 따른다
    case-01-late-spring-snow.json # 예시 사건 (placeholder 데이터)
    index.js                      # 케이스 레지스트리 (사건 추가 지점)
  engine/
    validateCase.js               # 계약 런타임 검증 (스키마 우선 강제)
    clueData.js                   # 단서 type별 data 형태 계약 (1단계)
  components/
    CaseBriefing.jsx              # 사건 브리핑
    ClueBoard.jsx                 # 단서 보드
    ClueCard.jsx                  # 단서 카드 (잠금=봉인)
  App.jsx                         # 케이스 로드 → 검증 → 렌더
  main.jsx
  styles.css
```

## 케이스 스키마 한눈에

| 필드 | 역할 | 소비 단계 |
|------|------|-----------|
| `meta` | 제목·브리핑·난이도·실제 사례(시점/지역/현상) | 0단계 |
| `investigation.clues` | 단서 레이어(type·잠금·요약·data) | 0(메타)·2(시각화) |
| `hypotheses` | 가설 선택지(verdict·requiredClues) | 2·3 |
| `solution` | 정답 메커니즘·인과 체인·핵심 요인 | 2·3 |
| `misconceptions` | 오개념·교정 | 3 |
| `aiTutor` | LLM 주입 컨텍스트·규칙·힌트 사다리 | 3 |
| `learning` | 교과 개념·정리·교육과정 연계 | 2 |
| `dataSources` | 출처(공개검증 대비, 데이터 1종 이상 요건) | 전 단계 |

`aiTutor` / `misconceptions` 등은 0단계에선 **정의만** 하고 호출하지 않습니다. 계약을 지금 못박아 두면 3단계 AI 연동에서 전면 재작업이 없습니다(스키마 우선).

## 다음 단계

- **1단계 (완료/진행)** — `pipeline/` 에 재현 가능한 KMA 데이터 파이프라인. 사례일 탐색(scout) → verified 케이스 생성(build-case). 단서 type별 data 형태는 `src/engine/clueData.js` 로 고정. 실제 수치 교체는 인증키로 `pipeline/README.md` 절차 실행. 2단계 선개발용 합성 fixture: `case-01-late-spring-snow.demo.json`
- **2단계 (완료)** — `clue.type`별 경량 SVG 렌더러(temp-comparison·timeseries·upper-air·pressure-map·wind·text) + 단서 열기 → 가설 제출 → 정적 해설(mock AI) → 사건 해결 루프. 사건 3개(난이도 1·2·3: 늦봄 대설 / 겨울 푄 / 여름 우박)를 사건 선택 탭으로 전환. 사건 추가는 authoring JSON + `make-demo` 만으로(엔진 코드 무수정) 검증됨
- **3단계 (완료)** — `VerdictPanel`에 OpenRouter 소크라테스 튜터를 서버리스 프록시(`api/tutor.js`)로 연동. 오답 시 AI가 정답을 말하지 않고 질문으로 유도, 조사 중 "AI 힌트" 버튼 제공. 키 미설정·호출 실패·`npm run dev`(함수 없음)에서는 **case JSON 기반 정적 해설로 자동 폴백**. 프롬프트 조립·파싱은 `tutor/core.js`, 오프라인 검증은 `node tutor/selftest.js`(9/9). 자세한 설정·배포는 아래 'AI 튜터(3단계)' 참고

## AI 튜터 (3단계)

소크라테스 튜터는 **서버리스 함수에서만** OpenRouter를 호출해 API 키를 숨깁니다. 프런트는 절대 키를 보지 못합니다.

```
api/tutor.js     # Vercel 서버리스 함수 (OpenRouter 프록시)
tutor/core.js    # 프롬프트 조립 + 응답 파싱 (순수 · 테스트 대상)
tutor/selftest.js
src/api/tutor.js # 프런트 호출 (실패 시 ok:false → 정적 폴백)
```

설정: `cp .env.example .env` 후 `OPENROUTER_API_KEY` 입력(발급: https://openrouter.ai/keys). 모델은 `OPENROUTER_MODEL`(기본 `openai/gpt-4o-mini`)로 교체 가능.

로컬 실행:
- `npm run dev` — 함수가 없어 `/api/tutor` 404 → **정적 폴백**으로 동작(앱은 그대로 작동).
- `vercel dev` — 서버리스 함수까지 실행돼 실제 AI 튜터 동작.

배포: `vercel` (Vite + `api/` 자동 인식). 대시보드의 환경변수에 `OPENROUTER_API_KEY` 등록.

폴백 원칙: 키 미설정·네트워크 실패·형식 깨짐 등 어떤 경우에도 `case JSON`의 `hypotheses[].feedback`/`aiTutor.hintLadder`로 자동 대체되어 게임이 멈추지 않습니다.
