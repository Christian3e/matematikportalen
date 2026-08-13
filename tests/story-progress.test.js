const test = require("node:test");
const assert = require("node:assert/strict");
const progress = require("../story-progress.js");

test("shows only the first checked question initially", () => {
  assert.deepEqual(progress.getVisibleQuestionIndexes([{}, {}, {}], {}, 0), [0]);
});

test("reveals the next question and keeps solved questions visible", () => {
  assert.deepEqual(
    progress.getVisibleQuestionIndexes([{}, {}, {}], {"q-0-0": "ok", "q-0-1": "ok"}, 0),
    [0, 1, 2]
  );
});

test("bad or empty answers do not reveal another question", () => {
  assert.deepEqual(progress.getVisibleQuestionIndexes([{}, {}], {"q-0-0": "bad"}, 0), [0]);
  assert.deepEqual(progress.getVisibleQuestionIndexes([{}, {}], {"q-0-0": "empty"}, 0), [0]);
});

test("open reflection questions do not block the next checked question", () => {
  assert.deepEqual(progress.getVisibleQuestionIndexes([{}, {open: true}, {}], {"q-0-0": "ok"}, 0), [0, 1, 2]);
});

test("only correct checked answers are locked", () => {
  assert.equal(progress.isQuestionLocked({"q-0-0": "ok"}, 0, 0), true);
  assert.equal(progress.isQuestionLocked({"q-0-0": "bad"}, 0, 0), false);
  assert.equal(progress.isQuestionLocked({"q-0-0": "empty"}, 0, 0), false);
});

test("focus moves to the first newly visible question after a correct answer", () => {
  assert.equal(
    progress.getNextEnabledQuestionIndex([{}, {open: true}, {}], {"q-0-0": "ok"}, 0, 0),
    1
  );
});

test("focus does not move after an incorrect answer or beyond the final question", () => {
  assert.equal(progress.getNextEnabledQuestionIndex([{}, {}], {"q-0-0": "bad"}, 0, 0), null);
  assert.equal(
    progress.getNextEnabledQuestionIndex([{}, {}], {"q-0-0": "ok", "q-0-1": "ok"}, 0, 1),
    null
  );
});
