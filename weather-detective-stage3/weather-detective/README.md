# 기상 미스터리 탐정 (Weather Detective)

이상기상 사건을 KMA 관측 데이터로 추리하는 **웹 기반 교육 게임**입니다.  
실제 기상 사례와 데이터를 바탕으로 단서를 수집하고, 가설을 세우고, 사건을 해결하세요.

## 게임 소개

플레이어는 기상 탐정이 되어 실제로 발생한 이상기상 사건을 분석합니다.

- **단서 수집** — 기온 변화, 강수량, 기압 분포, 상층 대기 등 관측 데이터를 단서로 열어봅니다
- **가설 제출** — 수집한 단서를 바탕으로 이상기상의 원인 메커니즘을 추론합니다
- **AI 튜터** — 오답 시 정답을 알려주지 않고 소크라테스식 질문으로 생각을 유도합니다
- **사건 해결** — 인과 체인과 핵심 기상 요인을 학습하며 사건을 종결합니다

### 수록 사건 (총 7개)

| # | 사건 | 현상 | 난이도 |
|---|------|------|--------|
| 1 | 4월에 웬 함박눈? | 늦봄 산간 대설 | ★☆☆ |
| 2 | 가을 새벽에 짙은 안개? | 복사 안개 | ★☆☆ |
| 3 | 새벽 3시에도 28도? | 열대야·도시 열섬 | ★☆☆ |
| 4 | 한겨울에 강릉만 봄날? | 영동 겨울 푄 현상 | ★★☆ |
| 5 | 동해에서 눈구름이 밀려온다? | 강원 영동 동풍 폭설 | ★★☆ |
| 6 | 맑은 여름 오후에 우박? | 여름철 우박 | ★★★ |
| 7 | 3시간에 200mm, 왜 여기만? | 장마 정체 전선 집중호우 | ★★★ |

## 기술 스택

- **Frontend** — React 18 + Vite 6
- **시각화** — 순수 SVG (기온 비교, 강수/적설, 기압 분포, 상층 대기, 풍향 나침반)
- **AI 튜터** — OpenRouter API (서버리스 프록시 경유, 키 노출 없음)
- **랜덤 출제** — 앱 시작 시 랜덤 사건 선택 + 🎲 버튼으로 즉시 전환
- **배포** — Vercel (Vite + `api/` 서버리스 함수 자동 인식)

## 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버 시작 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build
```

> **참고:** `npm run dev`에서는 서버리스 함수가 없어 `/api/tutor` 404 → 자동으로 정적 폴백으로 동작합니다.  
> AI 튜터까지 로컬에서 테스트하려면 `vercel dev`를 사용하세요.

## AI 튜터 설정 (선택)

AI 튜터 없이도 게임 전체가 정상 동작합니다. 키 미설정·네트워크 오류 시 `case JSON`의 정적 해설로 자동 대체됩니다.

1. [OpenRouter](https://openrouter.ai/keys)에서 API 키 발급
2. 환경변수 설정:

```bash
cp .env.example .env
# .env 파일에 OPENROUTER_API_KEY 입력
```

```env
OPENROUTER_API_KEY=sk-or-...
# OPENROUTER_MODEL=openai/gpt-4o-mini  # 기본값, 변경 가능
```

3. Vercel 배포 시 대시보드 → Settings → Environment Variables에 `OPENROUTER_API_KEY` 등록

## 폴더 구조

```
weather-detective/
├── api/
│   └── tutor.js              # Vercel 서버리스 함수 (OpenRouter 프록시)
├── pipeline/                 # KMA 데이터 파이프라인 (사례 발굴 · 케이스 생성)
│   ├── scout.mjs             # 사례일 탐색
│   ├── build-case.mjs        # verified 케이스 JSON 생성
│   └── README.md             # 파이프라인 실행 방법
├── src/
│   ├── cases/
│   │   ├── case.schema.json  # 케이스 계약 (JSON Schema)
│   │   ├── case-01-*.json    # 늦봄 산간 대설
│   │   ├── case-02-*.json    # 영동 겨울 푄
│   │   ├── case-03-*.json    # 여름 우박
│   │   └── index.js          # 케이스 레지스트리
│   ├── components/
│   │   ├── clues/            # 단서 타입별 SVG 시각화
│   │   ├── CasePicker.jsx    # 사건 선택 화면
│   │   ├── CaseBriefing.jsx  # 사건 브리핑
│   │   ├── ClueBoard.jsx     # 단서 보드
│   │   ├── HypothesisPanel.jsx
│   │   ├── SolutionPanel.jsx
│   │   └── VerdictPanel.jsx  # 판정 + AI 튜터 연동
│   ├── engine/
│   │   ├── validateCase.js   # 케이스 스키마 런타임 검증
│   │   └── clueData.js       # 단서 data 형태 계약
│   ├── api/
│   │   └── tutor.js          # 프런트 튜터 호출 (실패 → 폴백)
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── tutor/
│   ├── core.js               # 프롬프트 조립 + 응답 파싱 (순수 모듈)
│   └── selftest.js           # 오프라인 튜터 로직 검증 (9/9)
└── .env.example
```

## 새 사건 추가

케이스 JSON + `make-demo` 실행만으로 엔진 코드 수정 없이 사건을 추가할 수 있습니다.

```bash
# 케이스 JSON 작성 후
node pipeline/make-demo.mjs src/cases/case-08-new.json
# src/cases/index.js에 import 추가 → cases 배열에 포함 → 자동으로 랜덤 출제 풀에 포함
```

## 라이선스

MIT
