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
