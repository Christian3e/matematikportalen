(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PORTAL_STORY_PROGRESS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const key = (part, index) => `q-${part}-${index}`;

  function getVisibleQuestionIndexes(questions, status, part) {
    const visible = [];
    let mayReveal = true;
    questions.forEach((question, index) => {
      if (!mayReveal) return;
      visible.push(index);
      if (!question.open && status[key(part, index)] !== "ok") mayReveal = false;
    });
    return visible;
  }

  function isQuestionLocked(status, part, index) {
    return status[key(part, index)] === "ok";
  }

  return {getVisibleQuestionIndexes, isQuestionLocked};
});
