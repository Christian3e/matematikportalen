const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const {execFileSync} = require("node:child_process");

const bank = require("../question-bank.js");

const QUESTION_KEYS = [
  "id", "templateId", "grade", "topic", "subtopic", "difficulty", "mode",
  "prompt", "type", "answer", "options", "unit", "precision", "hint", "explanation"
];
const TOPIC_IDS = ["arithmetic", "fractions-percent", "geometry", "mixed"];
const DIFFICULTY_IDS = ["easy", "medium", "hard"];
const ALLOWED_UNITS = new Set([null, "%", "cm", "cm²", "cm³", "m", "kr", "min"]);

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function sequence(values) {
  let index = 0;
  return () => values[index++] ?? 0.5;
}

function npm(...args) {
  return execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", args, {
    cwd: path.resolve(__dirname, ".."),
    shell: process.platform === "win32",
    encoding: "utf8"
  });
}

function listFiles(root, directory = root) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory()
      ? listFiles(root, absolute)
      : [path.relative(root, absolute).split(path.sep).join("/")];
  }).sort();
}

function validTemplate() {
  const localize = operator => ({
    prompt: values => `${values.a} ${operator} ${values.b} = ?`,
    hint: "Use the operation.",
    explanation: values => `${values.a} ${operator} ${values.b} = ${values.answer}.`
  });
  return {
    id: "test-addition@v1",
    grades: [6],
    topic: "arithmetic",
    subtopic: "addition-subtraction",
    difficulty: "easy",
    mode: "gate",
    type: "choice",
    unit: null,
    precision: 0,
    locales: {da: localize("+"), en: localize("+"), fr: localize("+")},
    generate() {
      return {values: {a: 2, b: 3, answer: 5}, answer: 5, options: [4, 5, 6, 7]};
    }
  };
}

test("returns complete localized topic metadata as defensive frozen values", () => {
  for (const lang of ["da", "en", "fr"]) {
    const topics = bank.topics(lang);
    assert.deepEqual(topics.map(topic => topic.id), TOPIC_IDS);
    assert.ok(Object.isFrozen(topics));
    assert.ok(topics.every(topic => topic.label && topic.subtopics.length >= 2));
    assert.ok(topics.every(topic => Object.isFrozen(topic) && Object.isFrozen(topic.subtopics)));
    assert.ok(topics.every(topic => topic.subtopics.every(subtopic => subtopic.id && subtopic.label)));
  }

  const first = bank.topics("da");
  const second = bank.topics("da");
  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first[0], second[0]);
  assert.throws(() => first.push({id: "changed"}), TypeError);
  assert.deepEqual(bank.topics("da").map(topic => topic.id), TOPIC_IDS);
});

test("returns three localized difficulty explanations with topic-specific examples", () => {
  const expectedExamplePatterns = {
    arithmetic: /\+|−|×|÷/,
    "fractions-percent": /%|\/|decimal|brøk|fraction/i,
    geometry: /cm|m|areal|omkreds|area|périmètre/i,
    mixed: /kr|min|tid|money|heure|argent/i
  };

  for (const lang of ["da", "en", "fr"]) {
    for (const topic of TOPIC_IDS) {
      const difficulties = bank.difficulties(topic, lang);
      assert.deepEqual(difficulties.map(item => item.id), DIFFICULTY_IDS);
      assert.ok(Object.isFrozen(difficulties));
      assert.ok(difficulties.every(item => item.label && item.explanation && item.example));
      assert.match(difficulties[0].example, expectedExamplePatterns[topic]);
    }
  }
});

test("filters exactly by grade, topic, conditional subtopic, difficulty, and allowed modes", () => {
  const questions = bank.generate({
    grade: 4,
    topic: "geometry",
    subtopic: "area",
    difficulty: "medium",
    modes: ["overlay"],
    lang: "en"
  }, 4, seeded(12));

  assert.equal(questions.length, 4);
  assert.ok(questions.every(question => question.grade === 4));
  assert.ok(questions.every(question => question.topic === "geometry"));
  assert.ok(questions.every(question => question.subtopic === "area"));
  assert.ok(questions.every(question => question.difficulty === "medium"));
  assert.ok(questions.every(question => question.mode === "overlay"));
  assert.ok(questions.every(question => /area|rectangle|square/i.test(question.prompt)));

  assert.throws(
    () => bank.generate({grade: 4, topic: "arithmetic", subtopic: "area", difficulty: "medium", modes: ["overlay"]}, 1, seeded(1)),
    error => error instanceof bank.QuestionBankError && error.code === "NO_MATCH" && error.filter.topic === "arithmetic"
  );
});

test("throws NO_MATCH with the original filter instead of relaxing an empty exact match", () => {
  const filter = {grade: 9, topic: "geometry", difficulty: "hard", modes: ["gate"]};
  assert.throws(
    () => bank.generate(filter, 1, seeded(2)),
    error => {
      assert.ok(error instanceof bank.QuestionBankError);
      assert.equal(error.code, "NO_MATCH");
      assert.deepEqual(error.filter, filter);
      assert.match(error.message, /NO_MATCH/);
      return true;
    }
  );
});

test("rejects random sources that violate the documented [0,1) contract", () => {
  const filter = {grade: 6, topic: "arithmetic", difficulty: "easy", modes: ["gate"]};
  for (const source of [false, 0, "", null, {}]) {
    assert.throws(() => bank.generate(filter, 1, source), /rng must be a function/);
  }
  for (const value of [-0.01, 1, Infinity, NaN]) {
    assert.throws(() => bank.generate(filter, 1, () => value), /\[0,1\)/);
  }
});

test("generates deterministic variation and controlled non-repeating template reuse", () => {
  const filter = {grade: 6, topic: "fractions-percent", difficulty: "medium", modes: ["gate", "overlay"]};
  const first = bank.generate(filter, 10, seeded(42));
  const replay = bank.generate(filter, 10, seeded(42));
  const variation = bank.generate(filter, 10, seeded(43));

  assert.deepEqual(first, replay);
  assert.notDeepEqual(first, variation);
  assert.equal(first.length, 10);
  assert.equal(new Set(first.map(question => question.id)).size, 10);
  assert.equal(new Set(first.map(question => question.prompt)).size, 10);
  assert.ok(new Set(first.map(question => question.templateId)).size < first.length);
  assert.ok(first.every(question => question.answer !== undefined && question.hint && question.explanation));
  assert.ok(first.every((question, index) => index === 0 || question.id !== first[index - 1].id));
});

test("continues reuse from productive exact-match templates when one template is exhausted", () => {
  const questions = bank.generate({
    grade: 6,
    topic: "geometry",
    difficulty: "easy",
    modes: ["gate", "overlay"],
    lang: "en"
  }, 90, seeded(1));

  assert.equal(questions.length, 90);
  assert.equal(new Set(questions.map(question => question.id)).size, 90);
  assert.equal(new Set(questions.map(question => question.prompt)).size, 90);
  assert.ok(questions.some(question => question.templateId.includes("rectangle-perimeter")));
  assert.ok(questions.some(question => question.templateId.includes("metres-to-centimetres")));
});

test("fraction-sum templates teach exact decimal answers without silent rounding", () => {
  for (let seed = 0; seed < 250; seed += 1) {
    const questions = bank.generate({
      grade: 6,
      topic: "fractions-percent",
      difficulty: "hard",
      modes: ["overlay"],
      lang: "en"
    }, 2, seeded(seed));
    const question = questions.find(item => item.templateId.includes("fraction-sum-decimal"));
    const match = question.prompt.match(/(\d+)\/(\d+) \+ (\d+)\/\2/);
    assert.ok(match, question.prompt);
    assert.equal(question.answer, (Number(match[1]) + Number(match[3])) / Number(match[2]));
  }

  const eighths = bank.generate({
    grade: 6,
    topic: "fractions-percent",
    difficulty: "hard",
    modes: ["overlay"],
    lang: "en"
  }, 1, sequence([0.5, 0.5, 0.99, 0.8]))[0];
  const match = eighths.prompt.match(/(\d+)\/(\d+) \+ (\d+)\/\2/);
  assert.ok(match, eighths.prompt);
  assert.equal(eighths.answer, (Number(match[1]) + Number(match[3])) / Number(match[2]));
});

test("renders decimal copy with comma separators in Danish and French while keeping numeric answers", () => {
  for (const lang of ["da", "fr"]) {
    const question = bank.generate({
      grade: 6,
      topic: "mixed",
      subtopic: "money",
      difficulty: "medium",
      modes: ["overlay"],
      lang
    }, 1, sequence([0.2, 0]))[0];
    assert.equal(question.answer, 2.5);
    assert.match(question.explanation, /2,5/);
    assert.doesNotMatch(question.explanation, /2\.5/);
  }
});

test("all 48 templates preserve numeric, option, precision, divisor, and unit invariants across 250 seeds", () => {
  const hits = new Map();

  for (let seed = 0; seed < 250; seed += 1) {
    for (const topic of TOPIC_IDS) {
      const questions = bank.generate({grade: 6, topic, modes: ["gate", "overlay"]}, 12, seeded(Math.imul(seed + 1, 2654435761)));
      assert.equal(new Set(questions.map(question => question.templateId)).size, 12);

      for (const question of questions) {
        hits.set(question.templateId, (hits.get(question.templateId) || 0) + 1);
        assert.deepEqual(Object.keys(question), QUESTION_KEYS);
        assert.ok(Number.isFinite(question.answer), `${question.templateId} answer must be finite`);
        assert.ok(question.answer >= 0, `${question.templateId} answer must be nonnegative`);
        assert.ok([0, 1, 2].includes(question.precision), `${question.templateId} precision must be supported`);
        assert.equal(Number(question.answer.toFixed(question.precision)), question.answer);
        assert.ok(ALLOWED_UNITS.has(question.unit), `${question.templateId} unit must be declared`);
        assert.doesNotMatch(question.prompt, /(?:÷|\/)\s*0(?:\D|$)/, `${question.templateId} divides by zero`);
        assert.ok(question.prompt && question.hint && question.explanation);

        if (question.type === "choice") {
          assert.equal(question.mode, "gate");
          assert.equal(question.options.length, 4);
          assert.equal(new Set(question.options.map(String)).size, 4, `${question.templateId} options must be unique`);
          assert.equal(question.options.filter(option => Object.is(option, question.answer)).length, 1);
          assert.ok(question.options.every(Number.isFinite));
          assert.ok(question.options.every(option => option >= 0));
          assert.ok(question.options.every(option => Number(option.toFixed(question.precision)) === option));
        } else {
          assert.equal(question.type, "number");
          assert.equal(question.mode, "overlay");
          assert.equal(question.options, null);
        }
      }
    }
  }

  assert.equal(hits.size, 48);
  assert.ok([...hits.values()].every(count => count === 250));
  for (const topic of TOPIC_IDS) {
    const questions = bank.generate({grade: 6, topic, modes: ["gate", "overlay"]}, 12, seeded(99));
    assert.deepEqual(new Set(questions.map(question => question.mode)), new Set(["gate", "overlay"]));
    assert.deepEqual(new Set(questions.map(question => question.difficulty)), new Set(DIFFICULTY_IDS));
  }
});

test("validates complete templates and rejects schema or generator violations with the template id", () => {
  assert.equal(bank.validateTemplate(validTemplate()), true);

  const cases = [
    ["unstable", template => { template.id = "unstable"; }],
    ["missing-fr", template => { template.id = "missing-fr@v1"; delete template.locales.fr; }],
    ["bad-type", template => { template.id = "bad-type@v1"; template.type = "essay"; }],
    ["bad-mode", template => { template.id = "bad-mode@v1"; template.mode = "bonus"; }],
    ["bad-difficulty", template => { template.id = "bad-difficulty@v1"; template.difficulty = "expert"; }],
    ["missing-unit", template => { template.id = "missing-unit@v1"; delete template.unit; }],
    ["bad-precision", template => { template.id = "bad-precision@v1"; template.precision = 3; }],
    ["missing-answer", template => { template.id = "missing-answer@v1"; template.generate = () => ({values: {}, options: [1, 2, 3, 4]}); }],
    ["duplicate-options", template => { template.id = "duplicate-options@v1"; template.generate = () => ({values: {answer: 5}, answer: 5, options: [5, 5, 6, 7]}); }],
    ["nonfinite-answer", template => { template.id = "nonfinite-answer@v1"; template.generate = () => ({values: {answer: Infinity}, answer: Infinity, options: [1, 2, 3, Infinity]}); }],
    ["nonfinite-value", template => { template.id = "nonfinite-value@v1"; template.generate = () => ({values: {a: Infinity, b: 2, answer: 5}, answer: 5, options: [4, 5, 6, 7]}); }],
    ["missing-hint", template => { template.id = "missing-hint@v1"; template.locales.en.hint = ""; }],
    ["throwing-generator", template => { template.id = "throwing-generator@v1"; template.generate = () => { throw new Error("boom"); }; }],
    ["missing-values", template => { template.id = "missing-values@v1"; template.generate = () => ({values: {}, answer: 5, options: [4, 5, 6, 7]}); }],
    ["bad-localization-type", template => { template.id = "bad-localization-type@v1"; template.locales.fr = {prompt: {}, hint: {}, explanation: {}}; }],
    ["bad-rendered-copy", template => { template.id = "bad-rendered-copy@v1"; template.locales.fr.prompt = () => ({}); }],
    ["missing-overlay-options", template => {
      template.id = "missing-overlay-options@v1";
      template.mode = "overlay";
      template.type = "number";
      template.generate = () => ({values: {a: 2, b: 3, answer: 5}, answer: 5});
    }]
  ];

  for (const [id, mutate] of cases) {
    const template = validTemplate();
    mutate(template);
    assert.throws(() => bank.validateTemplate(template), new RegExp(id), id);
  }
});

test("browser global and CommonJS exports execute the same production logic", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "..", "question-bank.js"), "utf8");
  const browser = {};
  browser.window = browser;
  browser.globalThis = browser;
  vm.runInNewContext(source, browser, {filename: "question-bank.js"});

  assert.deepEqual(Object.keys(browser.QUESTION_BANK).sort(), Object.keys(bank).sort());
  assert.deepEqual(
    JSON.parse(JSON.stringify(browser.QUESTION_BANK.topics("fr"))),
    JSON.parse(JSON.stringify(bank.topics("fr")))
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(browser.QUESTION_BANK.generate({grade: 5, topic: "mixed", difficulty: "easy", modes: ["gate"]}, 3, seeded(8)))),
    JSON.parse(JSON.stringify(bank.generate({grade: 5, topic: "mixed", difficulty: "easy", modes: ["gate"]}, 3, seeded(8))))
  );
});

test("index loads the question bank before app without eagerly loading Phaser", () => {
  const html = fs.readFileSync(path.resolve(__dirname, "..", "index.html"), "utf8");
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(match => match[1]);
  assert.ok(scripts.includes("question-bank.js"));
  assert.ok(scripts.indexOf("question-bank.js") < scripts.indexOf("app.js"));
  assert.ok(!scripts.includes("vendor/phaser/phaser.min.js"));
});

test("build and syntax-check inventories include the bank with exact source/dist parity", () => {
  const expected = [
    "THIRD_PARTY_NOTICES.md", "activities-lab.js", "activities-modern.js", "activities.js",
    "activity-modes.css", "app.js", "arcade-engine.js", "arcade-games.js", "index.html",
    "polish.css", "question-bank.js", "snake-game.js", "story-progress.js", "styles.css",
    "teacher-data.js", "ui.js", "vendor/phaser/LICENSE.txt", "vendor/phaser/phaser.min.js", "vercel.json"
  ].sort();

  assert.match(npm("run", "check"), /> node --check/);
  assert.match(npm("run", "build"), /> node -e/);
  const dist = path.resolve(__dirname, "..", "dist");
  assert.deepEqual(listFiles(dist), expected);
  for (const file of expected) {
    assert.deepEqual(fs.readFileSync(path.join(dist, file)), fs.readFileSync(path.resolve(__dirname, "..", file)), file);
  }
});
