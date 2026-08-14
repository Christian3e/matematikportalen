const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

let validator;
let moduleLoadError;
delete globalThis.ANSWER_VALIDATOR;
try {
  validator = require("../answer-validator.js");
} catch (error) {
  moduleLoadError = error;
}
const commonJsPollutedGlobal = Object.prototype.hasOwnProperty.call(globalThis, "ANSWER_VALIDATOR");
delete globalThis.ANSWER_VALIDATOR;

const required = () => ({skip: !validator});
const result = (correct, empty, normalized, error) => ({correct, empty, normalized, error});

test("exports the structured answer validator API", () => {
  assert.equal(moduleLoadError, undefined);
  assert.deepEqual(Object.keys(validator || {}).sort(), ["check", "normalize"]);
});

test("normalizes the required format matrix", required(), () => {
  const cases = [
    [{type: "number", answer: 12.5, precision: 1}, "12,5", true, 12.5],
    [{type: "fraction", answer: {n: 2, d: 3}}, {n: "4", d: "6"}, true, {n: 2, d: 3}],
    [{type: "choice", answer: "b"}, "b", true, "b"],
    [{type: "time", answer: "08:28"}, "08:28", true, "08:28"],
    [{type: "interval", answer: {from: "08:28", to: "08:36"}}, {from: "08:28", to: "08:36"}, true, {from: "08:28", to: "08:36"}],
    [{type: "unit", answer: 2.4, unit: "m", precision: 1}, {value: "2,4", unit: "m"}, true, {value: 2.4, unit: "m"}]
  ];

  for (const [question, raw, correct, normalized] of cases) {
    assert.deepEqual(validator.check(question, raw), result(correct, false, normalized, null));
  }
});

test("numbers accept trimmed comma and dot decimals and canonicalize negative zero", required(), () => {
  assert.deepEqual(validator.check({type: "number", answer: 12.5, precision: 1}, " 12,5 "), result(true, false, 12.5, null));
  assert.deepEqual(validator.check({type: "number", answer: 12.5, precision: 1}, "12.5"), result(true, false, 12.5, null));
  assert.deepEqual(validator.check({type: "number", answer: 0, precision: 0}, "-0"), result(true, false, 0, null));
  assert.equal(Object.is(validator.normalize("number", "-0"), -0), false);
});

test("numbers reject exponents, prose, nonfinite values, and excess precision", required(), () => {
  const question = {type: "number", answer: 12.5, precision: 1};
  for (const raw of ["1e1", "12.5 meters", "NaN", "Infinity", NaN, Infinity, "12,55"]) {
    assert.deepEqual(validator.check(question, raw), result(false, false, null, "format"));
  }
  assert.deepEqual(validator.check({type: "number", answer: 1.2, precision: 1}, "1.3"), result(false, false, 1.3, null));
});

test("required primitive values report whitespace-only input as empty", required(), () => {
  for (const question of [
    {type: "number", answer: 1, precision: 0},
    {type: "choice", answer: "a"},
    {type: "time", answer: "08:28"}
  ]) {
    assert.deepEqual(validator.check(question, "  "), result(false, true, null, "empty"));
  }
});

test("fractions require structured integer fields and reduce without mutating input", required(), () => {
  const raw = {n: "-4", d: "-6"};
  assert.deepEqual(validator.check({type: "fraction", answer: {n: 2, d: 3}}, raw), result(true, false, {n: 2, d: 3}, null));
  assert.deepEqual(raw, {n: "-4", d: "-6"});
  assert.deepEqual(validator.check({type: "fraction", answer: {n: 2, d: 3}}, {n: 4, d: 6}), result(true, false, {n: 2, d: 3}, null));
  assert.deepEqual(validator.check({type: "fraction", answer: {n: 2, d: 3}}, {n: 1, d: 2}), result(false, false, {n: 1, d: 2}, null));
});

test("fractions reject text, empty fields, zero denominators, and nonintegers", required(), () => {
  const question = {type: "fraction", answer: {n: 2, d: 3}};
  assert.deepEqual(validator.check(question, "2/3"), result(false, false, null, "format"));
  assert.deepEqual(validator.check(question, {n: "", d: "3"}), result(false, true, null, "empty"));
  assert.deepEqual(validator.check(question, {n: "2", d: ""}), result(false, true, null, "empty"));
  for (const raw of [{n: 2, d: 0}, {n: "2.5", d: 3}, {n: Infinity, d: 3}]) {
    assert.deepEqual(validator.check(question, raw), result(false, false, null, "format"));
  }
});

test("choices compare stable values exactly", required(), () => {
  const question = {type: "choice", answer: "b"};
  assert.deepEqual(validator.check(question, "b"), result(true, false, "b", null));
  assert.deepEqual(validator.check(question, " b"), result(false, false, " b", null));
  assert.deepEqual(validator.check(question, "B"), result(false, false, "B", null));
});

test("times enforce two-digit clock boundaries and preserve canonical strings", required(), () => {
  const question = {type: "time", answer: "08:28"};
  assert.deepEqual(validator.check(question, " 08:28 "), result(true, false, "08:28", null));
  for (const raw of ["8:28", "24:00", "23:60", "08:28:00", "08-28"]) {
    assert.deepEqual(validator.check(question, raw), result(false, false, null, "format"));
  }
});

test("intervals require structured increasing same-day times", required(), () => {
  const question = {type: "interval", answer: {from: "08:28", to: "08:36"}};
  assert.deepEqual(validator.check(question, {from: "08:28", to: "08:36"}), result(true, false, {from: "08:28", to: "08:36"}, null));
  for (const raw of [
    {from: "08:36", to: "08:36"},
    {from: "08:36", to: "08:28"},
    {from: "23:50", to: "00:10"},
    {from: "", to: "08:36"},
    {from: "08:28", to: "8:36"}
  ]) {
    const empty = raw.from === "";
    assert.deepEqual(validator.check(question, raw), result(false, empty, null, empty ? "empty" : "format"));
  }
});

test("unit answers validate numeric precision and distinguish unit errors from wrong values", required(), () => {
  const question = {type: "unit", answer: 2.4, unit: "m", precision: 1};
  assert.deepEqual(validator.check(question, {value: "2.4", unit: "m"}), result(true, false, {value: 2.4, unit: "m"}, null));
  assert.deepEqual(validator.check(question, {value: "2.4", unit: "cm"}), result(false, false, {value: 2.4, unit: "cm"}, "unit"));
  assert.deepEqual(validator.check(question, {value: "2.4", unit: ""}), result(false, false, {value: 2.4, unit: ""}, "unit"));
  assert.deepEqual(validator.check(question, {value: "2.5", unit: "m"}), result(false, false, {value: 2.5, unit: "m"}, null));
  assert.deepEqual(validator.check(question, {value: "2.44", unit: "m"}), result(false, false, null, "format"));
  assert.deepEqual(validator.check(question, {value: "", unit: "m"}), result(false, true, null, "empty"));
});

test("malformed structures are format errors and normalized results are defensive copies", required(), () => {
  for (const [question, raw] of [
    [{type: "fraction", answer: {n: 1, d: 2}}, null],
    [{type: "interval", answer: {from: "08:00", to: "09:00"}}, ["08:00", "09:00"]],
    [{type: "unit", answer: 1, unit: "m", precision: 0}, 1]
  ]) {
    assert.deepEqual(validator.check(question, raw), result(false, false, null, "format"));
  }
  const normalized = validator.normalize("fraction", {n: 4, d: 6});
  normalized.n = 99;
  assert.deepEqual(validator.normalize("fraction", {n: 4, d: 6}), {n: 2, d: 3});
});

test("browser and CommonJS APIs have parity without polluting the Node global", required(), () => {
  assert.equal(commonJsPollutedGlobal, false);
  const source = fs.readFileSync(path.resolve(__dirname, "..", "answer-validator.js"), "utf8");
  const browser = {};
  browser.window = browser;
  vm.runInNewContext(source, browser, {filename: "answer-validator.js"});
  assert.deepEqual(Object.keys(browser.ANSWER_VALIDATOR).sort(), Object.keys(validator).sort());
  assert.deepEqual(
    JSON.parse(JSON.stringify(browser.ANSWER_VALIDATOR.check({type: "fraction", answer: {n: 2, d: 3}}, {n: 4, d: 6}))),
    JSON.parse(JSON.stringify(validator.check({type: "fraction", answer: {n: 2, d: 3}}, {n: 4, d: 6})))
  );
});

