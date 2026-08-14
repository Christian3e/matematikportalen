(function (browserWindow, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (browserWindow) browserWindow.ANSWER_VALIDATOR = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  function blank(value) {
    return value == null || (typeof value === "string" && value.trim() === "");
  }

  function parsed(status, value, decimals) {
    return {status, value, decimals};
  }

  function numberValue(raw) {
    if (blank(raw)) return parsed("empty");
    if (typeof raw === "number") {
      if (!Number.isFinite(raw)) return parsed("format");
      const value = Object.is(raw, -0) ? 0 : raw;
      const text = String(value);
      if (!/^[+-]?\d+(?:[.,]\d+)?$/.test(text)) return parsed("format");
      const separator = text.match(/[.,](\d+)$/);
      return parsed("ok", value, separator ? separator[1].length : 0);
    }
    if (typeof raw !== "string") return parsed("format");
    const text = raw.trim();
    if (!/^[+-]?\d+(?:[.,]\d+)?$/.test(text)) return parsed("format");
    const separator = text.match(/[.,](\d+)$/);
    const value = Number(text.replace(",", "."));
    return parsed("ok", Object.is(value, -0) ? 0 : value, separator ? separator[1].length : 0);
  }

  function integerValue(raw) {
    if (blank(raw)) return parsed("empty");
    if (typeof raw === "number") {
      return Number.isSafeInteger(raw) ? parsed("ok", Object.is(raw, -0) ? 0 : raw) : parsed("format");
    }
    if (typeof raw !== "string") return parsed("format");
    const text = raw.trim();
    if (!/^[+-]?\d+$/.test(text)) return parsed("format");
    const value = Number(text);
    return Number.isSafeInteger(value) ? parsed("ok", Object.is(value, -0) ? 0 : value) : parsed("format");
  }

  function gcd(left, right) {
    let a = Math.abs(left);
    let b = Math.abs(right);
    while (b) {
      const remainder = a % b;
      a = b;
      b = remainder;
    }
    return a || 1;
  }

  function fractionValue(raw) {
    if (raw == null) return parsed("format");
    if (blank(raw)) return parsed("empty");
    if (typeof raw !== "object" || Array.isArray(raw)) return parsed("format");
    const numerator = integerValue(raw.n);
    const denominator = integerValue(raw.d);
    if (numerator.status === "empty" || denominator.status === "empty") return parsed("empty");
    if (numerator.status !== "ok" || denominator.status !== "ok" || denominator.value === 0) return parsed("format");
    let n = numerator.value;
    let d = denominator.value;
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const divisor = gcd(n, d);
    return parsed("ok", {n: n / divisor, d: d / divisor});
  }

  function choiceValue(raw) {
    if (blank(raw)) return parsed("empty");
    if ((typeof raw === "object" && raw !== null) || typeof raw === "function" || typeof raw === "symbol") return parsed("format");
    return parsed("ok", raw);
  }

  function timeValue(raw) {
    if (blank(raw)) return parsed("empty");
    if (typeof raw !== "string") return parsed("format");
    const value = raw.trim();
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return parsed("format");
    return parsed("ok", value);
  }

  function intervalValue(raw) {
    if (raw == null) return parsed("format");
    if (blank(raw)) return parsed("empty");
    if (typeof raw !== "object" || Array.isArray(raw)) return parsed("format");
    const from = timeValue(raw.from);
    const to = timeValue(raw.to);
    if (from.status === "empty" || to.status === "empty") return parsed("empty");
    if (from.status !== "ok" || to.status !== "ok" || from.value >= to.value) return parsed("format");
    return parsed("ok", {from: from.value, to: to.value});
  }

  function unitValue(raw) {
    if (raw == null) return parsed("format");
    if (blank(raw)) return parsed("empty");
    if (typeof raw !== "object" || Array.isArray(raw) || !Object.prototype.hasOwnProperty.call(raw, "value")) return parsed("format");
    const value = numberValue(raw.value);
    if (value.status !== "ok") return value;
    return parsed("ok", {value: value.value, unit: raw.unit}, value.decimals);
  }

  function normalize(type, raw) {
    const parser = {number: numberValue, fraction: fractionValue, choice: choiceValue, time: timeValue, interval: intervalValue, unit: unitValue}[type];
    if (!parser) return null;
    const value = parser(raw);
    return value.status === "ok" ? value.value : null;
  }

  function outcome(correct, empty, normalized, error) {
    return {correct, empty, normalized, error};
  }

  function precisionIsValid(question, value) {
    return Number.isInteger(question.precision) && question.precision >= 0 && value.decimals <= question.precision;
  }

  function answersMatch(type, answer, normalized) {
    if (type === "fraction") return answer.n === normalized.n && answer.d === normalized.d;
    if (type === "interval") return answer.from === normalized.from && answer.to === normalized.to;
    return Object.is(answer, normalized);
  }

  function check(question, raw) {
    if (!question || typeof question !== "object") return outcome(false, false, null, "format");
    const parser = {number: numberValue, fraction: fractionValue, choice: choiceValue, time: timeValue, interval: intervalValue, unit: unitValue}[question.type];
    if (!parser) return outcome(false, false, null, "format");
    const value = parser(raw);
    if (value.status === "empty") return outcome(false, true, null, "empty");
    if (value.status !== "ok") return outcome(false, false, null, "format");
    if ((question.type === "number" || question.type === "unit") && !precisionIsValid(question, value)) {
      return outcome(false, false, null, "format");
    }

    if (question.type === "unit") {
      if (typeof value.value.unit !== "string" || value.value.unit.trim() === "" || value.value.unit !== question.unit) {
        return outcome(false, false, value.value, "unit");
      }
      const answer = numberValue(question.answer);
      return answer.status === "ok"
        ? outcome(Object.is(answer.value, value.value.value), false, value.value, null)
        : outcome(false, false, value.value, "format");
    }

    const answer = parser(question.answer);
    if (answer.status !== "ok") return outcome(false, false, value.value, "format");
    return outcome(answersMatch(question.type, answer.value, value.value), false, value.value, null);
  }

  return {normalize, check};
});

