const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const {webcrypto} = require("node:crypto");
const progress = require("../story-progress.js");

const appSource = fs.readFileSync(require.resolve("../app.js"), "utf8");

async function hash(value) {
  const bytes = new TextEncoder().encode(String(value).trim().toLocaleLowerCase());
  return [...new Uint8Array(await webcrypto.subtle.digest("SHA-256", bytes))]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

function attributes(source) {
  const result = {};
  for (const match of source.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) result[match[1]] = match[2] ?? true;
  return result;
}

function createDocument() {
  const document = {
    documentElement: {},
    title: "",
    elements: [],
    focused: null,
    addEventListener() {},
    parse(html) {
      this.elements = [...html.matchAll(/<(input|textarea|button)\b([^>]*)>/g)].map(match => {
        const attrs = attributes(match[2]);
        const element = {
          tagName: match[1].toUpperCase(),
          id: attrs.id || "",
          value: attrs.value || "",
          disabled: attrs.disabled === true,
          dataset: {},
          listeners: {},
          addEventListener(type, listener) { this.listeners[type] = listener; },
          closest() { return null; },
          focus() { document.focused = this; }
        };
        for (const [name, value] of Object.entries(attrs)) {
          if (name.startsWith("data-")) {
            const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
            element.dataset[key] = value;
          }
        }
        return element;
      });
    },
    querySelectorAll(selector) {
      const attribute = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
      if (!attribute) return [];
      const [, name, expected] = attribute;
      return this.elements.filter(element => {
        const value = name.startsWith("data-")
          ? element.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())]
          : element[name];
        return expected === undefined ? value !== undefined : String(value) === expected;
      });
    },
    querySelector(selector) {
      return selector.split(",").map(part => part.trim()).reduce((found, part) => {
        if (found) return found;
        const id = part.match(/^#([^:]+)/)?.[1];
        const requirements = [...part.matchAll(/\[data-([^=\]]+)="([^"]*)"\]/g)];
        return this.elements.find(element => {
          if (id && element.id !== id) return false;
          if (part.includes(":not([disabled])") && element.disabled) return false;
          return requirements.every(([, name, value]) => {
            const key = name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
            return String(element.dataset[key]) === value;
          });
        }) || null;
      }, null);
    },
    getElementById(id) {
      if (id === "app") return this.app;
      return this.elements.find(element => element.id === id) || null;
    }
  };
  document.app = {
    html: "",
    set innerHTML(value) {
      this.html = value;
      document.parse(value);
    },
    get innerHTML() { return this.html; }
  };
  return document;
}

async function createPortal() {
  const hashes = [await hash("12"), await hash("8.00-9.00"), await hash("ja")];
  const document = createDocument();
  const ui = {
    brand: "Portal", tag: "Tag", home: "Home", language: "Language", grade: "grade",
    minutes: "min", chapter: "Chapter", step: "Step", read: "Read", solve: "Solve",
    back: "Back", next: "Next", teacher: "Teacher", check: "Check", answer: "Answer",
    open: "Open", openNote: "Open note", correct: "Correct", wrong: "Wrong", empty: "Empty",
    hint: "Hint", locked: "Locked", unlock: "Unlock"
  };
  const activity = {
    id: "story-test",
    type: "story",
    icon: "📖",
    grade: 6,
    minutes: 5,
    parts: [{hashes: hashes.map(value => [value]), keyHashes: ["unused"]}],
    content: {da: {
      title: "Story",
      description: "Description",
      skills: [],
      finish: "Finished",
      parts: [{
        title: "Part",
        body: ["Body"],
        questions: [
          {text: "Hvor mange meter?", hint: "Hint"},
          {text: "Hvilket tidsrum er der fra klokken 08 til klokken 09?", hint: "Hint"},
          {text: "Vælg svaret", choices: ["Ja", "Nej"], hint: "Hint"},
          {text: "Forklar hvorfor", open: true}
        ],
        keyQuestion: "Key",
        keyHint: "Key hint"
      }]
    }}
  };
  const context = {
    window: {
      PORTAL_UI: {da: ui},
      PORTAL_CONTENT: {activities: [activity]},
      PORTAL_STORY_PROGRESS: progress,
      TEACHER_DATA: {}
    },
    document,
    location: {search: "?aktivitet=story-test&kapitel=1"},
    history: {replaceState() {}, pushState() {}},
    crypto: webcrypto,
    TextEncoder,
    TextDecoder,
    URLSearchParams,
    Uint8Array,
    setTimeout,
    addEventListener() {},
    scrollTo() {},
    confirm() { return false; },
    atob(value) { return Buffer.from(value, "base64").toString("binary"); }
  };
  vm.runInNewContext(appSource, context);
  return {
    document,
    html: () => document.app.innerHTML,
    elements: selector => document.querySelectorAll(selector),
    elementById: id => document.getElementById(id),
    async answer(id, value) {
      const input = document.getElementById(id);
      input.value = value;
      input.oninput({target: input});
      document.focused = null;
      await document.querySelectorAll("[data-check]").find(button => button.dataset.check === id).onclick();
    },
    async answerTime(id, from, to) {
      const inputs = document.querySelectorAll("[data-part-answer]").filter(input => input.dataset.partAnswer === id);
      const fromInput = inputs.find(input => input.dataset.side === "from");
      const toInput = inputs.find(input => input.dataset.side === "to");
      fromInput.value = from;
      fromInput.oninput();
      toInput.value = to;
      toInput.oninput();
      document.focused = null;
      await document.querySelectorAll("[data-check]").find(button => button.dataset.check === id).onclick();
    },
    async choose(id, value) {
      const input = document.querySelectorAll("[data-choice]")
        .find(choice => choice.dataset.choice === id && choice.value === value);
      input.onchange({target: input});
      document.focused = null;
      await document.querySelectorAll("[data-check]").find(button => button.dataset.check === id).onclick();
    }
  };
}

test("story renderer keeps solved controls visible and disabled while focusing the next question", async () => {
  const portal = await createPortal();

  await portal.answer("q-0-0", "12");
  assert.equal(portal.elementById("q-0-0").disabled, true);
  assert.equal(portal.elementById("q-0-0").value, "12");
  assert.equal(portal.document.focused.dataset.partAnswer, "q-0-1");

  await portal.answerTime("q-0-1", "08:00", "09:00");
  const lockedTimes = portal.elements("[data-part-answer]").filter(input => input.dataset.partAnswer === "q-0-1");
  assert.deepEqual(lockedTimes.map(input => [input.value, input.disabled]), [["08:00", true], ["09:00", true]]);
  assert.equal(portal.document.focused.dataset.choice, "q-0-2");

  await portal.choose("q-0-2", "Ja");
  const lockedChoices = portal.elements("[data-choice]").filter(input => input.dataset.choice === "q-0-2");
  assert.equal(lockedChoices.every(input => input.disabled), true);
  assert.equal(portal.elements("[data-check]").filter(button => button.disabled).length, 3);
  assert.equal(portal.elementById("q-0-3").disabled, false);
  assert.equal(portal.document.focused.id, "q-0-3");
  assert.match(portal.html(), /Spørgsmål 4 af 4/);
});

test("empty and incorrect story answers stay editable and do not reveal the next question", async () => {
  const portal = await createPortal();
  await portal.answer("q-0-0", "");
  assert.equal(portal.elementById("q-0-0").disabled, false);
  assert.equal(portal.elementById("q-0-1"), null);

  await portal.answer("q-0-0", "13");
  assert.equal(portal.elementById("q-0-0").disabled, false);
  assert.equal(portal.elementById("q-0-1"), null);
});
