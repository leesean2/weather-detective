# 데이터 파이프라인 (1단계)

사건 1(늦봄 산간 대설)의 placeholder 를 **실제 KMA 관측값**으로 교체하는 재현 가능한 파이프라인.

> 이 저장소 환경에서는 KMA 서버 접근이 막혀 있어, 실제 수치 교체는 **인증키를 가진 본인 환경**에서 아래 명령으로 실행합니다.

## 0. 인증키 발급

1. https://apihub.kma.go.kr 회원가입
2. 마이페이지에서 `authKey` 확인
3. `cp pipeline/.env.example pipeline/.env` 후 `KMA_AUTH_KEY` 채우기
   (또는 명령 앞에 `KMA_AUTH_KEY=...` 를 직접 붙여 실행)

## 1. 컬럼/지점 검증 (최초 1회)

apihub 응답의 컬럼 순서는 시기/버전에 따라 다를 수 있습니다. 한 번 확인해 `kma.mjs`의 `COLUMN_MAP`/`COLUMN_MAP_UPP`을 보정하세요.

```bash
KMA_AUTH_KEY=... node pipeline/kma.mjs --help-dump       # 지상 ASOS 컬럼
KMA_AUTH_KEY=... node pipeline/kma.mjs --help-dump-upp   # 고층(레윈존데) 컬럼
```

ASOS는 TA·RN·SD·PS·HM, 고층은 PA(기압면)·HT(고도)·TA(기온) 위치를 확인합니다.
또한 레윈존데 지점번호는 지상 ASOS와 다른 별도 관측망이므로, apihub **'고층관측 지점정보'** 로 `UPPER_STATIONS`(속초·오산)의 `stn`을 검증하세요.

### 파서 자체점검 (네트워크 불필요)

인증키 없이 고층 파서 로직(콤마/공백 형식, 마커 제거, 결측 제외, UTC→KST)을 먼저 확인할 수 있습니다.

```bash
node pipeline/selftest.mjs   # 9개 검사 통과 확인
```

이는 파싱 '로직'을 보장합니다. 컬럼 '순서'(`COLUMN_MAP_UPP`)는 위 `--help-dump-upp` 로 한 번 확인해야 합니다.

## 2. 사례일 찾기 (scout)

날짜를 사람이 단정하지 않고, 데이터가 사례일을 골라내게 합니다.

```bash
KMA_AUTH_KEY=... node pipeline/scout.mjs
```

대관령 적설이 증가했고 같은 날 강릉은 영상(=비)인 날에 `★후보` 표시가 붙습니다. 적설이 뚜렷한 날을 하나 고릅니다.

## 3. verified 케이스 생성 (build-case)

고른 사례일(YYYYMMDD)로 실제 데이터를 받아 단서 data 를 채웁니다.

```bash
KMA_AUTH_KEY=... node pipeline/build-case.mjs 20230429
# → src/cases/case-01-late-spring-snow.verified.json 생성
```

생성물은 단서 type별 형태 계약(`src/engine/clueData.js`)에 맞춰 검증됩니다.
ASOS 기반 3개 단서(기온비교·강수/적설·기압배치)에 더해, **상층기온(레윈존데)** 단서가 속초 아침 사운딩(00 UTC = 09 KST)에서 채워집니다. 850hPa 기온이 정상 추출되면 `dataStatus`가 `verified`로 바뀝니다.
※ 레윈존데 관측은 하루 2회(00·12 UTC = 09·21 KST)뿐이므로, `upp_temp`의 `tm`은 UTC로 넣습니다(빌드 스크립트가 자동 처리).

> **현재 verified 범위:** `build-case`는 사건 1(늦봄 대설)을 완전 검증 경로로 지원합니다(ASOS 3종 + 레윈존데 상층기온). 사건 2(푄: 강릉 풍향 + 원주 기온)와 사건 3(우박: 오산 레윈존데 + 평년값 기온)은 같은 파서·엔드포인트로 확장 가능하며, 각 사건의 사례일 확정과 평년값 소스 연결이 후속 작업으로 남습니다.

## 4. 앱에 반영

`src/cases/index.js` 의 import 를 verified 파일로 교체:

```js
import case01 from "./case-01-late-spring-snow.verified.json";
```

## 합성 fixture (2단계 UI 선개발용)

실제 키 없이 차트를 먼저 그려보려면 합성 데이터를 씁니다. **실제 관측이 아니며** 각 단서 data 에 `synthetic: true` 가 박혀 있습니다.

```bash
node pipeline/make-demo.mjs   # → case-01-late-spring-snow.demo.json
```

## 데이터원 / 출처

| 단서 | 데이터 | 엔드포인트 |
|------|--------|-----------|
| 기온비교·강수/적설·기압배치 | 종관기상관측(ASOS) 시간자료 | `kma_sfctm3.php` (apihub) |
| 상층기온 | 레윈존데(고층관측) 기온 | `upp_temp.php` (apihub) |

지점: 대관령(100, 772.6m) · 강릉(105, 26.0m) · 속초(90) · 원주(114). 레윈존데: 속초·오산(`UPPER_STATIONS`).
지상 고도는 `stn_inf.php`, 고층 지점번호는 '고층관측 지점정보'로 검증.

## 완료 기준 (1단계)

- [x] `node pipeline/selftest.mjs` 로 고층 파서 로직 확인 (네트워크 불필요, 9/9 통과)
- [ ] `--help-dump` / `--help-dump-upp` 로 컬럼 확인·보정
- [ ] '고층관측 지점정보'로 레윈존데 지점번호 검증
- [ ] `scout` 로 실제 사례일 1개 확정
- [ ] `build-case` 로 ASOS 3개 + 상층기온까지 채워 `dataStatus: "verified"` 달성
- [ ] `src/cases/index.js` 의 import 를 verified 파일로 교체
