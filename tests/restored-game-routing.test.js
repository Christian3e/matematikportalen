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
    documentElement: {}, title: "", elements: [], onkeydown: null, onkeyup: null,
    addEventListener() {},
    parse(html) {
      this.elements = [...html.matchAll(/<(input|textarea|button|select|canvas)\b([^>]*)>/g)].map(match => {
        const attributes = attrs(match[2]);
        const element = {
          tagName: match[1].toUpperCase(), id: attributes.id || "", value: attributes.value || "",
          disabled: attributes.disabled === true, dataset: {}, listeners: {}, style: {},
          addEventListener(type, listener) { this.listeners[type] = listener; },
          closest() { return null; }, focus() {}, replaceChildren() {},
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
    set innerHTML(value) { this.html = value; document.parse(value); },
    get innerHTML() { return this.html; }
  };
  return document;
}

function createPortal(search, arcadeOverride) {
  const document = createDocument();
  const location = {search};
  const raf = {next: 1, requested: [], cancelled: []};
  const events = {};
  const window = {PORTAL_STORY_PROGRESS: progress};
  const context = {
    window, document, location,
    history: {
      replaceState(_state, _title, url) { location.search = url; },
      pushState(_state, _title, url) { location.search = url; }
    },
    crypto: webcrypto, TextEncoder, TextDecoder, URLSearchParams, Uint8Array,
    setTimeout() { return 1; }, clearTimeout() {}, setInterval() { return 1; }, clearInterval() {},
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
  return {document, location, raf, events, html: () => document.app.innerHTML};
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

test("real arcade restart, language rerender, home navigation, and teardown use the recovered engine lifecycle", () => {
  let creates = 0;
  const engine = {
    create(kind, level) { creates++; return {kind, level, score: 0, over: false, checkpoint: false}; },
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

test("browser Back clears an active restored game before rendering the previous route", () => {
  const portal = createPortal("?aktivitet=game-fraction-snake");
  assert.equal(typeof portal.document.onkeydown, "function");
  portal.location.search = "?kategori=game&klasse=6";
  portal.events.popstate();
  assert.equal(portal.document.onkeydown, null);
  assert.doesNotMatch(portal.html(), /data-snake-start/);
  assert.match(portal.html(), /data-start="game-fraction-snake"/);
});
