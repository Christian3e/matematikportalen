const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const {webcrypto} = require("node:crypto");
const progress = require("../story-progress.js");

const source = file => fs.readFileSync(require.resolve(`../${file}`), "utf8");

function attrs(sourceText) {
  const result = {};
  for (const match of sourceText.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) result[match[1]] = match[2] ?? true;
  return result;
}

function createDocument() {
  const document = {
    documentElement: {}, title: "", elements: [], activeElement: null, onkeydown: null, onkeyup: null,
    addEventListener() {},
    parse(html) {
      this.elements = [...html.matchAll(/<(input|textarea|button|select|canvas|section|p)\b([^>]*)>/g)].map(match => {
        const attributes = attrs(match[2]);
        const element = {
          tagName: match[1].toUpperCase(), id: attributes.id || "", value: attributes.value || "",
          disabled: attributes.disabled === true, dataset: {}, listeners: {}, style: {}, attributes,
          textContent: "",
          addEventListener(type, listener) { this.listeners[type] = listener; },
          closest(selector) {
            const tags = selector.split(",").map(value => value.trim().toUpperCase());
            return tags.includes(this.tagName) ? this : null;
          },
          focus() { document.activeElement = this; },
          getAttribute(name) { return this.attributes[name] ?? null; },
          setAttribute(name, value) { this.attributes[name] = String(value); },
          replaceChildren(value = "") { this.textContent = String(value); },
          click() { return this.onclick?.() ?? this.listeners.click?.({preventDefault() {}, currentTarget: this}); },
          getContext() { return new Proxy({}, {get: () => () => {}, set: () => true}); }
        };
        for (const [name, value] of Object.entries(attributes)) if (name.startsWith("data-")) {
          const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
          element.dataset[key] = value;
        }
        return element;
      });
    },
    querySelectorAll(selector) {
      const match = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
      if (!match) return [];
      const [, name, expected] = match;
      return this.elements.filter(element => {
        const value = name.startsWith("data-")
          ? element.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())]
          : element[name];
        return expected === undefined ? value !== undefined : String(value) === expected;
      });
    },
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
    getElementById(id) { return id === "app" ? this.app : this.elements.find(element => element.id === id) || null; }
  };
  document.app = {
    html: "",
    set innerHTML(value) { this.html = value; document.activeElement = null; document.parse(value); },
    get innerHTML() { return this.html; }
  };
  return document;
}

function createPortal(search, arcadeOverride) {
  const document = createDocument();
  const location = {search};
  const raf = {next: 1, requested: [], cancelled: []};
  const timers = {next: 1, intervals: new Map(), timeouts: new Map(), clearedIntervals: [], clearedTimeouts: []};
  const events = {};
  const window = {PORTAL_STORY_PROGRESS: progress};
  const context = {
    window, document, location,
    history: {
      replaceState(_state, _title, url) { location.search = url; },
      pushState(_state, _title, url) { location.search = url; }
    },
    crypto: webcrypto, TextEncoder, TextDecoder, URLSearchParams, Uint8Array,
    setTimeout(callback, delay) { const id = timers.next++; timers.timeouts.set(id, {callback, delay}); return id; },
    clearTimeout(id) { timers.clearedTimeouts.push(id); timers.timeouts.delete(id); },
    setInterval(callback, delay) { const id = timers.next++; timers.intervals.set(id, {callback, delay}); return id; },
    clearInterval(id) { timers.clearedIntervals.push(id); timers.intervals.delete(id); },
    requestAnimationFrame(callback) { const id = raf.next++; raf.requested.push({id, callback}); return id; },
    cancelAnimationFrame(id) { raf.cancelled.push(id); },
    performance: {now: () => 0}, addEventListener(type, listener) { events[type] = listener; }, scrollTo() {}, confirm() { return false; },
    atob(value) { return Buffer.from(value, "base64").toString("binary"); }
  };
  vm.createContext(context);
  for (const file of ["ui.js", "activities.js", "activities-modern.js", "activities-lab.js", "snake-game.js", "arcade-games.js", "arcade-engine.js", "teacher-data.js"]) {
    vm.runInContext(source(file), context, {filename: file});
  }
  if (arcadeOverride) window.REAL_ARCADE = arcadeOverride;
  vm.runInContext(source("app.js"), context, {filename: "app.js"});
  return {document, location, raf, timers, events, window, html: () => document.app.innerHTML};
}

function keyEvent(code, target) {
  return {
    code, key: code, target, defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; }
  };
}

const recovered = [
  ["game-fraction-snake", "data-snake-start"],
  ["game-arcade-space", "data-real-start"],
  ["game-arcade-racer", "data-real-start"],
  ["game-arcade-balloons", "data-real-start"],
  ["game-arcade-tower", "data-real-start"]
];

test("direct activity routes select every recovered renderer and preserve existing game renderers", () => {
  for (const [id, marker] of recovered) {
    const portal = createPortal(`?aktivitet=${id}`);
    assert.match(portal.html(), new RegExp(marker), id);
  }
  assert.match(createPortal("?aktivitet=game-mental").html(), /id="game-answer"/);
  assert.match(createPortal("?aktivitet=game-fractions").html(), /data-option=/);
});

test("every recovered activity card opens its unique route and renderer", () => {
  for (const [id, marker] of recovered) {
    const portal = createPortal("?kategori=game&klasse=6");
    const cardStart = portal.document.querySelectorAll("[data-start]").find(button => button.dataset.start === id);
    assert.ok(cardStart, `${id} card`);
    cardStart.click();
    assert.match(portal.location.search, new RegExp(`aktivitet=${id}`));
    assert.match(portal.html(), new RegExp(marker));
  }
});

test("arcade setup and interactive controls ignore document gameplay shortcuts", () => {
  const portal = createPortal("?aktivitet=game-arcade-space");
  const language = portal.document.querySelector('[data-action="language"]');
  const setupButton = portal.document.querySelector("[data-real-subject]");

  for (const event of [keyEvent("ArrowDown", language), keyEvent("Space", setupButton)]) {
    assert.doesNotThrow(() => portal.document.onkeydown(event));
    assert.equal(event.defaultPrevented, false);
  }

  const calls = [];
  const realInput = portal.window.REAL_ARCADE.input;
  portal.window.REAL_ARCADE.input = (world, key, down) => {
    calls.push({world, key, down});
    realInput(world, key, down);
  };
  portal.document.querySelector("[data-real-start]").click();

  const activeLanguage = portal.document.querySelector('[data-action="language"]');
  const ignored = keyEvent("ArrowDown", activeLanguage);
  portal.document.onkeydown(ignored);
  assert.equal(ignored.defaultPrevented, false);
  assert.equal(calls.length, 0);

  const canvas = portal.document.getElementById("real-arcade-canvas");
  const gameplay = keyEvent("ArrowLeft", canvas);
  portal.document.onkeydown(gameplay);
  assert.equal(gameplay.defaultPrevented, true);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].world);
  assert.deepEqual({key: calls[0].key, down: calls[0].down}, {key: "left", down: true});
});

test("real arcade exposes localized controls and a live score and lives status outside the canvas", () => {
  const engine = {
    create(kind, level) { return {kind, level, score: 0, lives: 3, over: false, checkpoint: false}; },
    update(world) { world.score = 5; world.lives = 2; },
    input() {}, draw() {}
  };
  const portal = createPortal("?aktivitet=game-arcade-space", engine);
  portal.document.querySelector("[data-real-start]").click();

  const controls = Object.fromEntries(portal.document.querySelectorAll("[data-real-key]").map(button => [button.dataset.realKey, button]));
  assert.equal(controls.left.getAttribute("aria-label"), "Bevæg til venstre");
  assert.equal(controls.action.getAttribute("aria-label"), "Skyd");
  const status = portal.document.getElementById("real-arcade-status");
  const canvas = portal.document.getElementById("real-arcade-canvas");
  assert.equal(status.getAttribute("role"), "status");
  assert.equal(status.getAttribute("aria-live"), "polite");
  assert.equal(status.textContent, "Point: 0. Liv: 3.");
  assert.equal(canvas.getAttribute("aria-describedby"), "real-arcade-status");

  portal.raf.requested.at(-1).callback(16);
  assert.equal(status.textContent, "Point: 5. Liv: 2.");

  portal.document.querySelector('[data-action="language"]').onchange({target: {value: "en"}});
  const englishControls = Object.fromEntries(portal.document.querySelectorAll("[data-real-key]").map(button => [button.dataset.realKey, button]));
  assert.equal(englishControls.left.getAttribute("aria-label"), "Move left");
  assert.equal(englishControls.action.getAttribute("aria-label"), "Fire");

  const balloon = createPortal("?aktivitet=game-arcade-balloons", engine);
  balloon.document.querySelector("[data-real-start]").click();
  assert.equal(balloon.document.querySelector('[data-real-key="action"]').getAttribute("aria-label"), "Slip blokken");
});

test("arcade quiz and game-over overlays announce themselves and manage focus", () => {
  const quizEngine = {
    create(kind, level) { return {kind, level, score: 0, lives: 3, over: false, checkpoint: false}; },
    update(world) { world.checkpoint = true; },
    input() {}, draw() {}
  };
  const quizPortal = createPortal("?aktivitet=game-arcade-space", quizEngine);
  quizPortal.document.querySelector("[data-real-start]").click();
  quizPortal.raf.requested.at(-1).callback(16);

  const quizDialog = quizPortal.document.getElementById("real-quiz-dialog");
  assert.equal(quizDialog.getAttribute("role"), "dialog");
  assert.equal(quizDialog.getAttribute("aria-modal"), "true");
  assert.equal(quizDialog.getAttribute("aria-labelledby"), "real-quiz-title");
  assert.equal(quizPortal.document.activeElement, quizDialog);

  const quizTimer = [...quizPortal.timers.intervals.values()].at(-1);
  quizTimer.callback();
  quizTimer.callback();
  quizTimer.callback();
  assert.equal(quizPortal.document.activeElement, quizPortal.document.querySelectorAll("[data-real-answer]")[0]);

  quizPortal.document.querySelectorAll("[data-real-answer]")[0].click();
  const result = quizPortal.document.getElementById("real-quiz-status");
  assert.equal(result.getAttribute("role"), "status");
  assert.equal(result.getAttribute("aria-live"), "assertive");
  assert.equal(quizPortal.document.activeElement.id, "real-quiz-dialog");

  const overEngine = {
    create(kind, level) { return {kind, level, score: 9, lives: 0, over: false, checkpoint: false}; },
    update(world) { world.over = true; },
    input() {}, draw() {}
  };
  const overPortal = createPortal("?aktivitet=game-arcade-space", overEngine);
  overPortal.document.querySelector("[data-real-start]").click();
  overPortal.raf.requested.at(-1).callback(16);
  const gameOver = overPortal.document.getElementById("real-gameover-dialog");
  assert.equal(gameOver.getAttribute("role"), "dialog");
  assert.equal(gameOver.getAttribute("aria-modal"), "true");
  assert.equal(gameOver.getAttribute("aria-labelledby"), "real-gameover-title");
  assert.equal(overPortal.document.getElementById("real-gameover-status").getAttribute("role"), "status");
  assert.equal(overPortal.document.activeElement, overPortal.document.querySelector("[data-real-restart]"));
});

test("real arcade restart, language rerender, home navigation, and teardown use the recovered engine lifecycle", () => {
  let creates = 0;
  const engine = {
    create(kind, level) { creates++; return {kind, level, score: 0, lives: 3, keys: {}, over: false, checkpoint: false}; },
    update(world) { world.over = true; }, input() {}, draw() {}
  };
  const portal = createPortal("?aktivitet=game-arcade-space", engine);
  portal.document.querySelector("[data-real-start]").click();
  assert.equal(creates, 1);
  assert.ok(portal.raf.requested.length > 0);
  portal.raf.requested.at(-1).callback(16);
  portal.document.querySelector("[data-real-restart]").click();
  assert.equal(creates, 2);

  const language = portal.document.querySelector('[data-action="language"]');
  language.onchange({target: {value: "en"}});
  assert.match(portal.html(), /Asteroid Defender/);

  const activeFrame = portal.raf.requested.at(-1).id;
  portal.document.querySelectorAll('[data-action="home"]')[0].click();
  assert.equal(portal.document.onkeydown, null);
  assert.equal(portal.document.onkeyup, null);
  assert.ok(portal.raf.cancelled.includes(activeFrame));
});

test("leaving a real arcade quiz cancels its active interval and feedback timeout", () => {
  const engine = {
    create(kind, level) { return {kind, level, score: 0, lives: 3, keys: {}, over: false, checkpoint: false}; },
    update(world) { world.checkpoint = true; },
    input() {}, draw() {}
  };
  const portal = createPortal("?aktivitet=game-arcade-space", engine);
  portal.document.querySelector("[data-real-start]").click();
  portal.raf.requested.at(-1).callback(16);
  const quizIntervalId = [...portal.timers.intervals.keys()].at(-1);
  const quizInterval = portal.timers.intervals.get(quizIntervalId);
  quizInterval.callback();
  quizInterval.callback();
  quizInterval.callback();
  portal.document.querySelectorAll("[data-real-answer]")[0].click();
  const feedbackTimeoutId = [...portal.timers.timeouts.keys()].at(-1);

  portal.document.querySelectorAll('[data-action="home"]')[0].click();
  assert.ok(portal.timers.clearedIntervals.includes(quizIntervalId));
  assert.ok(portal.timers.clearedTimeouts.includes(feedbackTimeoutId));
  assert.equal(portal.timers.intervals.has(quizIntervalId), false);
  assert.equal(portal.timers.timeouts.has(feedbackTimeoutId), false);
});

test("browser Back clears snake gameplay intervals and a pending death timeout", () => {
  const portal = createPortal("?aktivitet=game-fraction-snake");
  portal.document.querySelector("[data-snake-start]").click();
  const gameplayIntervalId = [...portal.timers.intervals.keys()].at(-1);
  assert.equal(typeof portal.document.onkeydown, "function");
  portal.location.search = "?kategori=game&klasse=6";
  portal.events.popstate();
  assert.ok(portal.timers.clearedIntervals.includes(gameplayIntervalId));
  assert.equal(portal.timers.intervals.has(gameplayIntervalId), false);
  assert.equal(portal.document.onkeydown, null);
  assert.doesNotMatch(portal.html(), /data-snake-start/);
  assert.match(portal.html(), /data-start="game-fraction-snake"/);

  const dying = createPortal("?aktivitet=game-fraction-snake");
  dying.document.querySelector("[data-snake-start]").click();
  const tick = [...dying.timers.intervals.values()].at(-1).callback;
  dying.document.onkeydown(keyEvent("ArrowUp", dying.document.getElementById("snake-canvas")));
  for (let step = 0; step < 11; step++) tick();
  const deathTimeoutId = [...dying.timers.timeouts.keys()].at(-1);
  assert.ok(deathTimeoutId);

  dying.location.search = "?kategori=game&klasse=6";
  dying.events.popstate();
  assert.ok(dying.timers.clearedTimeouts.includes(deathTimeoutId));
  assert.equal(dying.timers.timeouts.has(deathTimeoutId), false);
});
