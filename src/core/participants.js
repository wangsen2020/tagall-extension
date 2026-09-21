(() => {
  const TagAll = globalThis.TagAll;
  const SEPARATORS = /[,，、،؛·]/;
  const EXCLUDED_STATUS = /\b(typing|recording|online|last seen|connecting|loading)\b/i;
  const SELF_LABELS = new Set(["you", "toi", "tú", "du", "sie", "你", "您", "你们", "你們", "あなた", "당신"]);

  function normaliseName(value) {
    return value.replace(/\s+/g, " ").trim();
  }

  function isPhoneNumber(value) {
    return /^\+?[\d\s().-]{7,}$/.test(value.trim());
  }

  function normalisePhone(value) {
    const digits = value.replace(/\D/g, "");
    return value.trim().startsWith("+") ? `+${digits}` : digits;
  }

  function mentionQueries(value) {
    const original = normaliseName(value);
    if (!isPhoneNumber(original)) return [original];

    const normalized = normalisePhone(original);
    const digits = normalized.replace(/^\+/, "");
    const variants = [original, normalized, digits, digits.slice(-8)];
    return [...new Set(variants.filter((item) => item.length >= 6))];
  }

  function splitCandidates(value) {
    if (!value || !SEPARATORS.test(value) || EXCLUDED_STATUS.test(value)) return [];

    const unique = new Map();
    for (const rawName of value.split(SEPARATORS)) {
      const name = normaliseName(rawName);
      const key = name.toLocaleLowerCase();
      if (!name || name.length > 80 || SELF_LABELS.has(key) || unique.has(key)) continue;
      unique.set(key, name);
    }
    return [...unique.values()];
  }

  function scoreCandidate(value) {
    const members = splitCandidates(value);
    if (members.length < 2) return -1;
    return members.length * 100 - Math.min(value.length, 1000) / 1000;
  }

  function collectFromHeader(header) {
    if (!header) return [];
    const candidates = [];
    for (const element of header.querySelectorAll("[title], [aria-label]")) {
      for (const attribute of ["title", "aria-label"]) {
        const value = element.getAttribute(attribute);
        const score = scoreCandidate(value || "");
        if (score >= 0) candidates.push({ value, score });
      }
    }
    const textScore = scoreCandidate(header.textContent || "");
    if (textScore >= 0) candidates.push({ value: header.textContent, score: textScore });
    candidates.sort((left, right) => right.score - left.score);
    return candidates.length ? splitCandidates(candidates[0].value) : [];
  }

  function collectFromPage() {
    return collectFromHeader(TagAll.dom.findConversationHeader());
  }

  TagAll.participants = Object.freeze({
    splitCandidates, collectFromHeader, collectFromPage, isPhoneNumber, mentionQueries
  });
})();
