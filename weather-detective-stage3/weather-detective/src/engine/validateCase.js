// validateCase.js
// 0단계의 핵심 원칙(스키마 우선)을 런타임에서 가볍게 강제한다.
// 외부 의존성(ajv 등) 없이 필수 필드/형태만 점검해, 케이스 데이터가
// 계약을 어기면 개발 중 콘솔에서 바로 드러나게 한다.
// (3단계 이후 ajv + case.schema.json으로 교체해도 좋다.)

const CLUE_TYPES = [
  "pressure-map", "temp-comparison", "upper-air",
  "timeseries", "wind", "sst", "text",
];
const VERDICTS = ["correct", "partial", "misconception"];

function req(obj, path, errors, label) {
  if (obj === undefined || obj === null || obj === "") {
    errors.push(`필수값 누락: ${label || path}`);
    return false;
  }
  return true;
}

export function validateCase(c) {
  const errors = [];

  req(c, "id", errors, "id");
  if (c.id && !/^case-\d{2}-[a-z0-9-]+$/.test(c.id)) {
    errors.push(`id 형식 오류: ${c.id} (예상: case-01-foo-bar)`);
  }
  req(c, "version", errors, "version");

  // meta
  if (req(c.meta, "meta", errors, "meta")) {
    req(c.meta.title, "meta.title", errors, "meta.title");
    if (typeof c.meta.difficulty !== "number" || c.meta.difficulty < 1 || c.meta.difficulty > 3) {
      errors.push("meta.difficulty 는 1~3 정수여야 함");
    }
    req(c.meta.briefing, "meta.briefing", errors, "meta.briefing");
    if (req(c.meta.event, "meta.event", errors, "meta.event")) {
      req(c.meta.event.region, "meta.event.region", errors, "meta.event.region");
      req(c.meta.event.phenomenon, "meta.event.phenomenon", errors, "meta.event.phenomenon");
    }
  }

  // investigation
  if (req(c.investigation, "investigation", errors, "investigation")) {
    const clues = c.investigation.clues;
    if (!Array.isArray(clues) || clues.length < 3) {
      errors.push("investigation.clues 는 최소 3개여야 함 (평가표: 단서 3개 이상)");
    } else {
      clues.forEach((clue, i) => {
        req(clue.id, `clues[${i}].id`, errors);
        req(clue.title, `clues[${i}].title`, errors);
        req(clue.summary, `clues[${i}].summary`, errors);
        if (!CLUE_TYPES.includes(clue.type)) {
          errors.push(`clues[${i}].type 값이 허용 목록 밖: ${clue.type}`);
        }
      });
      const ids = clues.map((x) => x.id);
      if (new Set(ids).size !== ids.length) errors.push("clue id 가 중복됨");
    }
  }

  // hypotheses
  if (req(c.hypotheses, "hypotheses", errors, "hypotheses")) {
    req(c.hypotheses.prompt, "hypotheses.prompt", errors);
    const opts = c.hypotheses.options;
    if (!Array.isArray(opts) || opts.length < 2) {
      errors.push("hypotheses.options 는 최소 2개여야 함");
    } else {
      opts.forEach((o, i) => {
        req(o.id, `options[${i}].id`, errors);
        req(o.text, `options[${i}].text`, errors);
        if (!VERDICTS.includes(o.verdict)) {
          errors.push(`options[${i}].verdict 값 오류: ${o.verdict}`);
        }
      });
      if (!opts.some((o) => o.verdict === "correct")) {
        errors.push("정답(verdict=correct) 가설이 최소 1개 필요");
      }
    }
  }

  // solution
  if (req(c.solution, "solution", errors, "solution")) {
    req(c.solution.mechanism, "solution.mechanism", errors);
    if (!Array.isArray(c.solution.causalChain) || c.solution.causalChain.length === 0) {
      errors.push("solution.causalChain 은 비어있지 않은 배열이어야 함");
    }
  }

  // learning / dataSources
  if (req(c.learning, "learning", errors, "learning")) {
    req(c.learning.summary, "learning.summary", errors);
  }
  if (!Array.isArray(c.dataSources) || c.dataSources.length === 0) {
    errors.push("dataSources 는 최소 1종 명시 (KMA 데이터 1종 이상 요건)");
  }

  return { valid: errors.length === 0, errors };
}
