const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ANSWER_VALIDATOR = require("../answer-validator.js");
const runtime = require("../game-runtime.js");

class FakeTarget {
  constructor() {
    this.listeners = new Map();
    this.added = new Map();
    this.removed = new Map();
    this.children = [];
    this.parentNode = null;
    this.dataset = {};
    this.disabled = false;
    this.hidden = false;
    this.focusCount = 0;
  }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
    this.added.set(type, (this.added.get(type) || 0) + 1);
  }
  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
    this.removed.set(type, (this.removed.get(type) || 0) + 1);
  }
  emit(type, event = {}) {
    event.type = type;
    event.target ||= this;
    for (const listener of [...(this.listeners.get(type) || [])]) listener(event);
  }
  appendChild(child) {
    this.children.push(child);
    child.parentNode = this;
    return child;
  }
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index !== -1) this.children.splice(index, 1);
    child.parentNode = null;
  }
  remove() {
    this.parentNode?.removeChild(this);
  }
  setAttribute(name, value) {
    this[name] = String(value);
  }
  focus() {
    this.focusCount += 1;
  }
  total(map) {
    return [...map.values()].reduce((sum, count) => sum + count, 0);
  }
}

class FakeDocument extends FakeTarget {
  constructor() {
    super();
    this.hidden = false;
  }
  createElement() {
    return new FakeTarget();
  }
}

class FakeTimers {
  constructor() {
    this.now = 0;
    this.next = 1;
    this.tasks = new Map();
    this.cleared = [];
  }
  setTimeout(callback, delay) {
    const id = this.next++;
    this.tasks.set(id, {callback, due: this.now + delay});
    return id;
  }
  clearTimeout(id) {
    if (this.tasks.delete(id)) this.cleared.push(id);
  }
  advance(ms) {
    this.now += ms;
    for (;;) {
      const next = [...this.tasks.entries()].sort((a, b) => a[1].due - b[1].due)[0];
      if (!next || next[1].due > this.now) return;
      this.tasks.delete(next[0]);
      next[1].callback();
    }
  }
}

function harness(overrides = {}) {
  const document = new FakeDocument();
  const root = new FakeTarget();
  const unrelated = new FakeTarget();
  root.appendChild(unrelated);
  const touch = new FakeTarget();
  touch.dataset.gameAction = "left";
  const control = new FakeTarget();
  const timers = new FakeTimers();
  const game = {
    starts: 0, pauses: 0, resumes: 0, destroys: 0, inputs: [],
    start() { this.starts += 1; },
    pause() { this.pauses += 1; },
    resume() { this.resumes += 1; },
    destroy() { this.destroys += 1; },
    input(action, down) { this.inputs.push([action, down]); }
  };
  const copy = {
    empty: "Skriv et svar", format: "Tjek formatet", unit: "Vælg enhed", wrong: "Prøv igen",
    correct: "Korrekt", error: "Spillet kunne ikke fortsætte", retry: "Prøv igen", back: "Tilbage"
  };
  let gameContext;
  const options = {
    document,
    window: {matchMedia: query => ({matches: query.includes("reduced-motion")})},
    timers,
    ANSWER_VALIDATOR,
    language: "da",
    copy,
    touchControls: [touch],
    controls: () => [control],
    createGame(context) { gameContext = context; return game; },
    ...overrides
  };
  const session = runtime.mount(root, options);
  return {session, document, root, unrelated, touch, control, timers, game, copy, get gameContext() { return gameContext; }};
}

function key(target, value, interactive = false) {
  const event = {
    key: value,
    target: {closest: () => interactive ? {} : null},
    prevented: 0,
    preventDefault() { this.prevented += 1; }
  };
  target.emit("keydown", event);
  return event;
}

const numberQuestion = {type: "number", answer: 2, precision: 0, hint: "To er lige"};

test("mount starts one game, installs listeners once, and passes language, copy, and reduced motion", () => {
  const h = harness();
  assert.equal(runtime.QUIZ_RESUME_DELAY_MS, 1000);
  assert.equal(h.game.starts, 1);
  assert.equal(h.document.added.get("keydown"), 1);
  assert.equal(h.document.added.get("keyup"), 1);
  assert.equal(h.document.added.get("visibilitychange"), 1);
  assert.equal(h.gameContext.language, "da");
  assert.equal(h.gameContext.copy, h.copy);
  assert.equal(h.gameContext.reducedMotion, true);
  assert.equal(h.session.getState().status, "playing");
});

test("keyboard mappings dispatch through input and prevent defaults only for game shortcuts", () => {
  const h = harness();
  const left = key(h.document, "ArrowLeft");
  const ignored = key(h.document, "x");
  h.document.emit("keyup", {key: "a", target: {closest: () => null}, preventDefault() { this.prevented = true; }});
  assert.deepEqual(h.game.inputs, [["left", true], ["left", false]]);
  assert.equal(left.prevented, 1);
  assert.equal(ignored.prevented, 0);
});

test("game shortcuts ignore interactive and dialog targets before preventDefault or dispatch", () => {
  const h = harness();
  const event = key(h.document, "ArrowRight", true);
  assert.equal(event.prevented, 0);
  assert.deepEqual(h.game.inputs, []);
});

test("pointer and keyboard controls may alternate through the same input path", () => {
  const h = harness();
  h.touch.emit("pointerdown");
  key(h.document, "d");
  h.touch.emit("pointerup");
  assert.deepEqual(h.game.inputs, [["left", true], ["right", true], ["left", false]]);
  assert.equal(h.touch.added.get("pointerdown"), 1);
  assert.equal(h.touch.added.get("pointerup"), 1);
  assert.equal(h.touch.added.get("pointercancel"), 1);
  assert.equal(h.touch.added.get("pointerleave"), 1);
});

test("visibility pauses once and resumes once only from unobstructed play", () => {
  const h = harness();
  h.document.hidden = true;
  h.document.emit("visibilitychange");
  h.document.emit("visibilitychange");
  assert.equal(h.game.pauses, 1);
  h.document.hidden = false;
  h.document.emit("visibilitychange");
  h.document.emit("visibilitychange");
  assert.equal(h.game.resumes, 1);

  h.session.showQuestion(numberQuestion);
  h.document.hidden = true;
  h.document.emit("visibilitychange");
  h.document.hidden = false;
  h.document.emit("visibilitychange");
  assert.equal(h.game.resumes, 1);
});

test("showQuestion pauses once and ignores duplicate checkpoints", () => {
  const h = harness();
  assert.equal(h.session.showQuestion(numberQuestion), true);
  assert.equal(h.session.showQuestion({...numberQuestion, answer: 3}), false);
  assert.equal(h.game.pauses, 1);
  assert.equal(h.session.getState().status, "question");
  assert.equal(h.session.getState().question, numberQuestion);
});

test("empty, malformed, unit, and wrong answers stay enabled with localized feedback and refocus", () => {
  const cases = [
    [numberQuestion, "", "Skriv et svar"],
    [numberQuestion, "2e0", "Tjek formatet"],
    [{type: "unit", answer: 2, precision: 0, unit: "cm", hint: "Se enheden"}, {value: "2", unit: "m"}, "Vælg enhed"],
    [numberQuestion, "3", "Prøv igen"]
  ];
  for (const [question, raw, feedback] of cases) {
    const h = harness();
    h.session.showQuestion(question);
    assert.equal(h.session.submit(raw), false);
    const state = h.session.getState();
    assert.equal(state.status, "question");
    assert.equal(state.controlsEnabled, true);
    assert.equal(state.feedback, feedback);
    assert.equal(state.hint, question.hint);
    assert.equal(h.control.disabled, false);
    assert.equal(h.control.focusCount, 1);
  }
});

test("correct answers lock controls, enter resuming feedback, and schedule one timer", () => {
  const h = harness();
  h.session.showQuestion(numberQuestion);
  assert.equal(h.session.submit("2"), true);
  assert.equal(h.session.submit("2"), false);
  const state = h.session.getState();
  assert.equal(state.status, "resuming");
  assert.equal(state.controlsEnabled, false);
  assert.equal(state.feedback, "Korrekt");
  assert.equal(h.control.disabled, true);
  assert.equal(h.timers.tasks.size, 1);
});

test("reentrant destroy from correct feedback callbacks cannot schedule or resume", () => {
  for (const source of ["feedback", "state"]) {
    let session;
    const callbacks = source === "feedback"
      ? {onFeedback() { session.destroy(); }}
      : {onState(state) { if (state.status === "feedback") session.destroy(); }};
    const h = harness({callbacks});
    session = h.session;
    session.showQuestion(numberQuestion);
    session.submit("2");
    assert.equal(session.getState().status, "destroyed");
    assert.equal(h.timers.tasks.size, 0);
    h.timers.advance(1000);
    assert.equal(h.game.resumes, 0);
    assert.equal(h.game.destroys, 1);
  }
});

test("correct feedback remains paused at 999 ms and resumes once at exactly 1000 ms", () => {
  const h = harness();
  h.session.showQuestion(numberQuestion);
  h.session.submit("2");
  h.timers.advance(999);
  assert.equal(h.game.resumes, 0);
  assert.equal(h.session.getState().status, "resuming");
  h.timers.advance(1);
  assert.equal(h.game.resumes, 1);
  assert.equal(h.session.getState().status, "playing");
  assert.equal(h.timers.tasks.size, 0);
});

test("destroy before feedback expiry clears the timer and never resumes", () => {
  const h = harness();
  h.session.showQuestion(numberQuestion);
  h.session.submit("2");
  h.session.destroy();
  h.timers.advance(1000);
  assert.equal(h.game.resumes, 0);
  assert.equal(h.timers.cleared.length, 1);
  assert.equal(h.timers.tasks.size, 0);
});

test("destroy is idempotent, removes all bindings and owned DOM, and preserves unrelated DOM", () => {
  const h = harness();
  h.session.destroy();
  h.session.destroy();
  assert.equal(h.game.destroys, 1);
  assert.equal(h.session.getState().status, "destroyed");
  assert.equal(h.document.total(h.document.added), h.document.total(h.document.removed));
  assert.equal(h.touch.total(h.touch.added), h.touch.total(h.touch.removed));
  assert.deepEqual(h.root.children, [h.unrelated]);
});

test("runtime errors cancel pending resume, destroy safely, and expose localized retry/back state", () => {
  const h = harness();
  h.session.showQuestion(numberQuestion);
  h.session.submit("2");
  h.gameContext.fail(new Error("scene failed"));
  const state = h.session.getState();
  assert.equal(state.status, "error");
  assert.deepEqual(state.error, {message: "Spillet kunne ikke fortsætte", retry: "Prøv igen", back: "Tilbage"});
  assert.equal(h.timers.tasks.size, 0);
  assert.equal(h.game.destroys, 1);
  assert.equal(h.document.total(h.document.added), h.document.total(h.document.removed));
  assert.equal(h.touch.total(h.touch.added), h.touch.total(h.touch.removed));
  h.timers.advance(1000);
  assert.equal(h.game.resumes, 0);
});

test("exceptions from game input enter the same cleaned error state", () => {
  const h = harness();
  h.game.input = () => { throw new Error("input failed"); };
  key(h.document, "ArrowUp");
  assert.equal(h.session.getState().status, "error");
  assert.equal(h.game.destroys, 1);
});

test("synchronous failure from game pause or resume cannot be overwritten", () => {
  for (const method of ["pause", "resume"]) {
    let context;
    let failOn = null;
    const game = {
      pauses: 0,
      resumes: 0,
      destroys: 0,
      start() {},
      pause() {
        this.pauses += 1;
        if (failOn === "pause") { failOn = null; context.fail(new Error("pause failed")); }
      },
      resume() {
        this.resumes += 1;
        if (failOn === "resume") { failOn = null; context.fail(new Error("resume failed")); }
      },
      destroy() { this.destroys += 1; }
    };
    const h = harness({createGame(value) { context = value; return game; }});
    failOn = method;
    h.session.showQuestion(numberQuestion);
    if (method === "resume") {
      h.session.submit("2");
      h.timers.advance(1000);
    }
    assert.equal(h.session.getState().status, "error");
    assert.equal(game.destroys, 1);
    assert.equal(h.timers.tasks.size, 0);
  }
});

test("synchronous fail or finish during game start preserves the terminal state", () => {
  for (const terminal of ["fail", "finish"]) {
    let context;
    const game = {
      pauses: 0,
      destroys: 0,
      start() { context[terminal](terminal === "fail" ? new Error("start failed") : undefined); },
      pause() { this.pauses += 1; },
      destroy() { this.destroys += 1; }
    };
    const h = harness({createGame(value) { context = value; return game; }});
    assert.equal(h.session.getState().status, terminal === "fail" ? "error" : "finished");
    assert.equal(game.pauses, 1);
    assert.equal(game.destroys, terminal === "fail" ? 1 : 0);
  }
});

test("a throwing error callback cannot interrupt the cleaned error transition", () => {
  const h = harness({callbacks: {onError() { throw new Error("host callback failed"); }}});
  assert.doesNotThrow(() => h.gameContext.fail(new Error("scene failed")));
  assert.equal(h.session.getState().status, "error");
  assert.equal(h.game.destroys, 1);
  assert.equal(h.document.total(h.document.added), h.document.total(h.document.removed));
});

test("reentrant terminal transitions during factory or state callbacks prevent game start", () => {
  for (const source of ["factory", "state"]) {
    let context;
    const game = {
      starts: 0,
      destroys: 0,
      start() { this.starts += 1; },
      destroy() { this.destroys += 1; }
    };
    const callbacks = source === "state" ? {onState(state) { if (state.status === "playing") context.finish(); }} : {};
    const h = harness({
      callbacks,
      createGame(value) {
        context = value;
        if (source === "factory") context.fail(new Error("factory failed"));
        return game;
      }
    });
    assert.equal(h.session.getState().status, source === "factory" ? "error" : "finished");
    assert.equal(game.starts, 0);
    assert.equal(game.destroys, source === "factory" ? 1 : 0);
  }
});

test("finished and error sessions never resume through visibility changes", () => {
  for (const finish of [true, false]) {
    const h = harness();
    if (finish) h.gameContext.finish();
    else h.gameContext.fail(new Error("failed"));
    h.document.hidden = true;
    h.document.emit("visibilitychange");
    h.document.hidden = false;
    h.document.emit("visibilitychange");
    assert.equal(h.game.resumes, 0);
    assert.equal(h.session.getState().status, finish ? "finished" : "error");
  }
});

test("browser and CommonJS APIs have parity without assigning GAME_RUNTIME to Node global", () => {
  const before = globalThis.GAME_RUNTIME;
  delete require.cache[require.resolve("../game-runtime.js")];
  const common = require("../game-runtime.js");
  assert.equal(globalThis.GAME_RUNTIME, before);

  const source = fs.readFileSync(new URL("../game-runtime.js", `file://${__filename.replace(/\\/g, "/")}`), "utf8");
  const context = {window: {}, document: new FakeDocument(), setTimeout, clearTimeout};
  vm.createContext(context);
  vm.runInContext(source, context, {filename: "game-runtime.js"});
  assert.deepEqual(Object.keys(context.window.GAME_RUNTIME).sort(), Object.keys(common).sort());
});
