# Phaser Game Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a locally hosted Phaser foundation, a reusable static question bank, and the new Matematikmissionen pilot game while preserving all current activities and reducing relevant post-quiz resume delays to exactly 1,000 ms.

**Architecture:** Keep the portal as plain static HTML/CSS/JavaScript. Load pinned Phaser 3.90.0 only when the pilot route is active, connect it to the existing URL router through a small lifecycle adapter, and keep accessible question UI in semantic HTML above the canvas. Isolate question generation, validation, localization, game lifecycle, and the pilot scene in focused files with browser-global APIs matching the repository's current no-bundler pattern.

**Tech Stack:** Static HTML/CSS/JavaScript, Phaser 3.90.0 local UMD build (MIT), Node.js built-in test runner, Vercel static output.

## Global Constraints

- The site remains static and deployable to Vercel with no login, backend, database service, or personal-data storage.
- Keep all seven existing games available and behaviorally unchanged except the specified 2,000 ms to 1,000 ms post-quiz resume delay.
- Support Danish, English, and French throughout the new flow.
- Keyboard and touch controls are simultaneously available; game shortcuts must ignore interactive HTML controls.
- Phaser is pinned to exactly `3.90.0`, committed locally, and never loaded from a runtime CDN.
- Phaser is loaded only for the pilot route and destroyed completely when leaving it.
- Correct answers lock; incorrect answers keep the question open, show a relevant hint, and focus the first answer control.
- Every task follows red-green-refactor TDD and ends in a focused commit.
- Source files added to the production page must also be included by the cross-platform `package.json` build inventory.

---

## File map

**Create:**

- `vendor/phaser/phaser.min.js` — untouched official Phaser 3.90.0 UMD runtime.
- `vendor/phaser/LICENSE.txt` — upstream MIT license.
- `THIRD_PARTY_NOTICES.md` — source URL, version, license, and consumed files.
- `question-bank.js` — schemas, localized metadata, seeded generators, filtering, and public `QUESTION_BANK` API.
- `answer-validator.js` — normalized validation for number, fraction, choice, time, interval, and unit answers; public `ANSWER_VALIDATOR` API.
- `phaser-loader.js` — lazy script loader with retryable error handling; public `PHASER_LOADER` API.
- `game-runtime.js` — lifecycle, input isolation, visibility pause, overlay state, timer cleanup; public `GAME_RUNTIME` API.
- `math-mission.js` — Phaser scene factory and public `MATH_MISSION` API.
- `math-mission.css` — setup, HUD, canvas shell, overlay, touch controls, responsive and reduced-motion styling.
- `tests/question-bank.test.js`, `tests/answer-validator.test.js`, `tests/phaser-loader.test.js`, `tests/game-runtime.test.js`, `tests/math-mission.test.js`, `tests/math-mission-routing.test.js`, `tests/quiz-delay.test.js` — focused regression suites.

**Modify:**

- `index.html` — add only non-Phaser bridge scripts and stylesheet; no eager Phaser tag.
- `app.js` — register the pilot activity, route/query handling, setup and game views, language handoff, and teardown.
- `arcade-games.js` — expose/use one named 1,000 ms resume delay where the question bank or copy is owned.
- `package.json` — include new runtime, source, CSS, license, and notice files in build/check/test coverage.
- `activity-modes.css` or `polish.css` only if an existing shared selector must be adjusted; pilot-specific rules stay in `math-mission.css`.

---

### Task 1: Vendor Phaser and make the static build complete

**Files:**
- Create: `vendor/phaser/phaser.min.js`
- Create: `vendor/phaser/LICENSE.txt`
- Create: `THIRD_PARTY_NOTICES.md`
- Modify: `package.json`
- Test: `tests/phaser-assets.test.js`

**Interfaces:**
- Consumes: the existing `npm run build`, `npm run check`, and `node --test tests/*.test.js` scripts.
- Produces: local URL `vendor/phaser/phaser.min.js`; `window.Phaser` after explicit loading; build inventory containing both vendor files and notices.

- [ ] **Step 1: Write the failing asset and build-inventory test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("pins Phaser 3.90.0 locally with its MIT notice", () => {
  const runtime = fs.readFileSync("vendor/phaser/phaser.min.js", "utf8");
  const license = fs.readFileSync("vendor/phaser/LICENSE.txt", "utf8");
  const notices = fs.readFileSync("THIRD_PARTY_NOTICES.md", "utf8");
  assert.match(runtime, /3\.90\.0/);
  assert.match(license, /MIT License/);
  assert.match(notices, /Phaser 3\.90\.0/);
  assert.match(notices, /github\.com\/phaserjs\/phaser/);
});

test("copies Phaser and notices to dist", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  for (const path of ["vendor/phaser/phaser.min.js", "vendor/phaser/LICENSE.txt", "THIRD_PARTY_NOTICES.md"])
    assert.match(packageJson, new RegExp(path.replaceAll("/", "\\\\/")));
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test tests/phaser-assets.test.js`  
Expected: FAIL because the vendored runtime and notices do not exist.

- [ ] **Step 3: Download exact upstream release assets and record provenance**

Download the official `phaser.min.js` for tag `v3.90.0` and the matching upstream license. Verify the release checksum locally before committing. Write `THIRD_PARTY_NOTICES.md` with version `3.90.0`, tag URL, runtime source URL, MIT license URL, local paths, and the checksum. Do not minify or edit the upstream runtime.

- [ ] **Step 4: Extend the cross-platform build inventory**

Replace the fragile flat-file copy loop with an explicit `files` list plus directory creation:

```js
const files = [
  /* existing files unchanged */,
  "vendor/phaser/phaser.min.js",
  "vendor/phaser/LICENSE.txt",
  "THIRD_PARTY_NOTICES.md"
];
for (const file of files) {
  const target = `dist/${file}`;
  fs.mkdirSync(require("node:path").dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}
```

- [ ] **Step 5: Verify GREEN and the built artifact**

Run: `node --test tests/phaser-assets.test.js && npm run check && npm run build`  
Expected: all pass; `dist/vendor/phaser/phaser.min.js`, its license, and `dist/THIRD_PARTY_NOTICES.md` exist and byte-match source.

- [ ] **Step 6: Commit**

```bash
git add vendor/phaser THIRD_PARTY_NOTICES.md package.json tests/phaser-assets.test.js
git commit -m "build: vendor Phaser runtime"
```

---

### Task 2: Build the typed static question-bank contract

**Files:**
- Create: `question-bank.js`
- Create: `tests/question-bank.test.js`
- Modify: `index.html`
- Modify: `package.json`

**Interfaces:**
- Consumes: a deterministic random function `rng(): number` returning `[0, 1)`.
- Produces: `window.QUESTION_BANK` with `topics(lang)`, `difficulties(topic, lang)`, `generate(filter, count, rng)`, and `validateTemplate(template)`.
- Produces question objects shaped as `{id, templateId, grade, topic, subtopic, difficulty, mode, prompt, type, answer, options, unit, precision, hint, explanation}`.

- [ ] **Step 1: Write failing schema, localization, filtering, and seeded-generation tests**

```js
test("returns localized topic and difficulty examples", () => {
  const da = bank.topics("da");
  assert.deepEqual(da.map(x => x.id), ["arithmetic", "fractions-percent", "geometry", "mixed"]);
  assert.match(bank.difficulties("geometry", "da")[0].example, /cm|m|areal|omkreds/i);
  assert.ok(bank.topics("en").every(x => x.label));
  assert.ok(bank.topics("fr").every(x => x.label));
});

test("generates deterministic, valid, non-repeating questions", () => {
  const rng = seeded(42);
  const questions = bank.generate({grade: 6, topic: "fractions-percent", difficulty: "medium", modes:["gate","overlay"]}, 10, rng);
  assert.equal(questions.length, 10);
  assert.equal(new Set(questions.map(x => x.id)).size, 10);
  assert.ok(questions.every(x => x.answer !== undefined && x.hint && x.explanation));
});
```

Add a loop over at least 250 deterministic seeds per template asserting finite numeric values, nonzero divisors, unique choice options, exactly one correct choice, allowed precision, and declared units.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `node --test tests/question-bank.test.js`  
Expected: FAIL because `window.QUESTION_BANK` is missing.

- [ ] **Step 3: Implement metadata and strict template validation**

Use frozen topic metadata and exactly `easy`, `medium`, `hard`. Implement `validateTemplate` to throw a message containing the template id when required localization, answer, unit, mode, or generator invariants are missing.

- [ ] **Step 4: Add the first 48 generator templates**

Add approximately 12 templates for each main area, distributed across all three difficulties and meaningful subtopics. Each area must include both gate-compatible multiple choice and overlay-compatible structured answers. Use helpers such as `integer`, `multipleOf`, `shuffle`, `gcd`, and `fraction` within `question-bank.js`; do not import the legacy random generators from `arcade-games.js`.

- [ ] **Step 5: Implement deterministic selection and controlled fallback**

`generate` first applies the exact filter. If fewer distinct templates exist than requested, cycle templates with new parameter seeds but reject duplicate rendered ids. If the exact filter has zero templates, throw `QuestionBankError("NO_MATCH", filter)`; never silently change topic or difficulty.

- [ ] **Step 6: Load and build the bank without loading Phaser**

Add `<script src="question-bank.js"></script>` before `app.js`, and add the file to `build` and `check`. Assert in the asset test that `index.html` contains no direct `vendor/phaser/phaser.min.js` script tag.

- [ ] **Step 7: Verify and commit**

Run: `node --test tests/question-bank.test.js tests/phaser-assets.test.js && npm run check && npm run build`  
Expected: all pass and `dist/question-bank.js` exists.

```bash
git add question-bank.js tests/question-bank.test.js tests/phaser-assets.test.js index.html package.json
git commit -m "feat: add static math question bank"
```

---

### Task 3: Add reusable structured answer validation

**Files:**
- Create: `answer-validator.js`
- Create: `tests/answer-validator.test.js`
- Modify: `index.html`
- Modify: `package.json`

**Interfaces:**
- Consumes: question `type`, `answer`, `unit`, `precision`, and optional `options` from Task 2.
- Produces: `ANSWER_VALIDATOR.normalize(type, raw)` and `ANSWER_VALIDATOR.check(question, raw)` returning `{correct:boolean, empty:boolean, normalized:unknown, error:null|"empty"|"format"|"unit"}`.

- [ ] **Step 1: Write the failing validation matrix**

```js
const cases = [
  [{type:"number",answer:12.5,precision:1}, "12,5", true],
  [{type:"fraction",answer:{n:2,d:3}}, {n:"4",d:"6"}, true],
  [{type:"choice",answer:"b"}, "b", true],
  [{type:"time",answer:"08:28"}, "08:28", true],
  [{type:"interval",answer:{from:"08:28",to:"08:36"}}, {from:"08:28",to:"08:36"}, true],
  [{type:"unit",answer:2.4,unit:"m",precision:1}, {value:"2,4",unit:"m"}, true]
];
for (const [question, raw, expected] of cases)
  assert.equal(validator.check(question, raw).correct, expected);
```

Also assert empty fields, malformed fractions, reversed intervals, wrong units, excess precision, and ambiguous free text are rejected with the correct error.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `node --test tests/answer-validator.test.js`  
Expected: FAIL because the validator is missing.

- [ ] **Step 3: Implement normalization and exact comparison**

Normalize Danish decimal commas, reduce fractions using GCD, preserve times as `HH:MM`, require both interval fields, and compare unit ids rather than translated labels. Do not accept surrounding prose for structured questions.

- [ ] **Step 4: Register the script and verify all formats**

Add the script after `question-bank.js` and before game runtime files. Add it to build/check lists.

Run: `node --test tests/answer-validator.test.js tests/question-bank.test.js && npm run check && npm run build`  
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add answer-validator.js tests/answer-validator.test.js index.html package.json
git commit -m "feat: validate structured game answers"
```

---

### Task 4: Add lazy Phaser loading and a leak-free game runtime

**Files:**
- Create: `phaser-loader.js`
- Create: `game-runtime.js`
- Create: `tests/phaser-loader.test.js`
- Create: `tests/game-runtime.test.js`
- Modify: `index.html`
- Modify: `package.json`

**Interfaces:**
- Consumes: local Phaser URL, `QUESTION_BANK`, `ANSWER_VALIDATOR`, document visibility, and a game factory exposing `start(config)`, `pause()`, `resume()`, `destroy()`.
- Produces: `PHASER_LOADER.load(): Promise<PhaserNamespace>` and `PHASER_LOADER.reset()`.
- Produces: `GAME_RUNTIME.mount(root, options)`, `showQuestion(question)`, `submit(raw)`, `destroy()`, and named `QUIZ_RESUME_DELAY_MS = 1000`.

- [ ] **Step 1: Write loader RED tests**

Test concurrent calls share one promise, the URL is local, success requires `window.Phaser`, failure removes the bad script and permits retry, and no script is appended before `load()`.

- [ ] **Step 2: Write lifecycle RED tests**

Use fake document/window/game objects and observable timers. Assert:

```js
runtime.mount(root, options);
assert.equal(listeners.keydown, 1);
runtime.destroy();
assert.equal(listeners.keydown, 0);
assert.equal(activeTimers.size, 0);
assert.equal(game.destroyCalls, 1);
```

Also assert interactive targets bypass movement keys, visibility pauses/resumes, touch and keyboard can alternate, correct answers lock, incorrect answers remain enabled with hint/focus, and correct continuation fires at 999 ms only after the final 1 ms.

- [ ] **Step 3: Implement the minimal loader**

Append a single `<script src="vendor/phaser/phaser.min.js">` on demand. Cache only a successful/in-flight promise; clear state after error. Reject with `{code:"PHASER_LOAD_FAILED"}` for the UI layer.

- [ ] **Step 4: Implement the runtime state machine**

Use explicit states `idle`, `playing`, `question`, `feedback`, `resuming`, `finished`, `error`, `destroyed`. Centralize every listener and timeout disposer. Ignore key events whose target matches `input, select, textarea, button, [contenteditable], [role=dialog] *`. Pause the Phaser scene before opening HTML overlay and resume once after the 1,000 ms timer.

- [ ] **Step 5: Register bridge scripts and verify**

Add `phaser-loader.js` and `game-runtime.js` before `app.js`; add both to build/check.

Run: `node --test tests/phaser-loader.test.js tests/game-runtime.test.js && npm run check && npm run build`  
Expected: all pass, including timer and destroy assertions.

- [ ] **Step 6: Commit**

```bash
git add phaser-loader.js game-runtime.js tests/phaser-loader.test.js tests/game-runtime.test.js index.html package.json
git commit -m "feat: add Phaser game runtime"
```

---

### Task 5: Integrate the Matematikmissionen setup flow and URL routing

**Files:**
- Create: `math-mission.css`
- Create: `tests/math-mission-routing.test.js`
- Modify: `app.js`
- Modify: `index.html`
- Modify: `package.json`

**Interfaces:**
- Consumes: `QUESTION_BANK.topics(lang)`, `QUESTION_BANK.difficulties(topic, lang)`, URL history helpers already used by `app.js`, and `GAME_RUNTIME`.
- Produces route: `?aktivitet=matematikmissionen&emne=<topic>&underemne=<subtopic>&niveau=<easy|medium|hard>`.
- Produces setup/game/error views and teardown on route departure.

- [ ] **Step 1: Write routing and setup RED tests in the existing DOM harness style**

Assert the Spil category gains one new non-placeholder card; direct URL opens the setup/game view; changing topic updates valid subtopics and difficulty examples; Start pushes a URL; `popstate` restores the prior selection; Home/Back calls `GAME_RUNTIME.destroy()` exactly once; Danish, English, and French labels are complete.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `node --test tests/math-mission-routing.test.js`  
Expected: FAIL because the activity and route do not exist.

- [ ] **Step 3: Add the activity card and setup model**

Add a grade 4–6 game activity with an original icon/title/description in all three required languages. Render topic cards, conditional subtopic control, three difficulty cards with topic-specific examples, and a touch-controls toggle. Default to the current grade filter where valid, otherwise grade 6.

- [ ] **Step 4: Add canonical query parsing and history updates**

Whitelist all query values. Invalid or missing values return to setup with a localized inline message rather than throwing. Push history for Start and navigation; replace only canonicalization corrections. Ensure unrelated story/practice URLs remain unchanged.

- [ ] **Step 5: Add accessible responsive styling**

Use large click targets, visible focus, a two-column Chromebook layout, one-column mobile layout, `min-width:0`, no horizontal overflow, and reduced-motion overrides. Keep all pilot rules in `math-mission.css`.

- [ ] **Step 6: Register/build and verify**

Add the stylesheet to `index.html` and the build list.

Run: `node --test tests/math-mission-routing.test.js tests/restored-game-routing.test.js tests/app-story-progress.test.js && npm run check && npm run build`  
Expected: new routing tests pass and all existing routes remain green.

- [ ] **Step 7: Commit**

```bash
git add app.js index.html math-mission.css package.json tests/math-mission-routing.test.js
git commit -m "feat: add math mission setup flow"
```

---

### Task 6: Implement the Phaser pilot scene and accessible quiz overlay

**Files:**
- Create: `math-mission.js`
- Create: `tests/math-mission.test.js`
- Modify: `game-runtime.js`
- Modify: `math-mission.css`
- Modify: `index.html`
- Modify: `package.json`

**Interfaces:**
- Consumes: Phaser 3.90.0 namespace, generated question list, and callbacks `onGate(question, choice)`, `onCheckpoint(question)`, `onFinish(result)`.
- Produces: `MATH_MISSION.create({Phaser, parent, questions, reducedMotion, callbacks})` returning `{start,pause,resume,input,destroy,getSnapshot}`.
- `getSnapshot()` returns `{state, score, energy, section, crystals, activeQuestionId}` for deterministic tests and UI status.

- [ ] **Step 1: Write scene-model RED tests with a minimal Phaser test double**

Assert scene configuration uses `Phaser.AUTO`, transparent false, FIT scaling, centered canvas, and physics without debug. Assert keyboard and touch map to the same `input(action, down)` calls; gate collisions pause once; correct gate increments score; wrong gate removes energy; checkpoints call one overlay; finish fires once; destroy removes scene, inputs, timers, and canvas.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `node --test tests/math-mission.test.js`  
Expected: FAIL because `MATH_MISSION` is missing.

- [ ] **Step 3: Implement three short generated sections without external art**

Use Phaser Graphics and simple geometric textures created at runtime for the player, crystals, platforms, hazards, and answer gates. This avoids unlicensed placeholder assets. Use Arcade Physics, camera bounds, deterministic section layouts, capped velocity, and delta-independent movement. Each round includes at least two answer gates and three HTML checkpoints.

- [ ] **Step 4: Implement the semantic overlay renderer**

Render controls by question type: radio group, numeric input with visible unit, numerator/denominator fields, time fields, or interval fields. Give the container `role="dialog"`, `aria-modal="true"`, labelled title, live feedback, visible hint, and focus trapping limited to the open overlay. Correct controls become disabled and visibly locked; incorrect submission focuses the first enabled answer control.

- [ ] **Step 5: Implement HUD, touch controls, error and finish states**

Mirror score, energy, section, and progress in DOM text outside canvas. Touch controls use pointer down/up/cancel and remain compatible with simultaneous keyboard input. Provide localized Pause, Continue, Retry, Play again, and Back to games buttons.

- [ ] **Step 6: Register/build and run the complete automated gate**

Add `math-mission.js` before `app.js`; add it to build/check.

Run: `npm test && npm run check && npm run build`  
Expected: all tests pass; every build input has an exact corresponding `dist` file; no existing file is omitted.

- [ ] **Step 7: Commit**

```bash
git add math-mission.js game-runtime.js math-mission.css index.html package.json tests/math-mission.test.js
git commit -m "feat: build Matematikmissionen pilot game"
```

---

### Task 7: Reduce legacy post-question delay to one second

**Files:**
- Modify: `app.js`
- Modify: `arcade-games.js` only if it owns a duplicated delay constant
- Test: `tests/quiz-delay.test.js`
- Test: `tests/restored-game-routing.test.js`

**Interfaces:**
- Consumes: current snake and `REAL_ARCADE` checkpoint feedback transitions.
- Produces: one named `LEGACY_QUIZ_RESUME_DELAY_MS = 1000` used only for the post-overlay continuation delay.

- [ ] **Step 1: Write timing RED tests for every affected legacy flow**

For Brøkslangen and each `REAL_ARCADE` game, drive a correct answer with fake timers. Assert the overlay closes according to current feedback behavior, gameplay remains paused at 999 ms, resumes once at 1,000 ms, and Home/Back before expiry cancels the resume. Assert wrong-answer timing/countdown behavior remains unchanged unless it is the same specified post-overlay continuation.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `node --test tests/quiz-delay.test.js tests/restored-game-routing.test.js`  
Expected: FAIL showing the current 2,000 ms continuation.

- [ ] **Step 3: Replace only the intended delay**

Introduce the named 1,000 ms constant at the adapter scope that owns these timers. Do not globally replace every `2000`, because collision immunity, animation, hints, and countdown durations are outside scope.

- [ ] **Step 4: Verify and commit**

Run: `node --test tests/quiz-delay.test.js tests/restored-game-routing.test.js && npm test && npm run check && npm run build`  
Expected: all pass; no affected flow has more than one resume timer.

```bash
git add app.js arcade-games.js tests/quiz-delay.test.js tests/restored-game-routing.test.js
git commit -m "fix: shorten game quiz resume delay"
```

---

### Task 8: Full browser verification, documentation, and production deployment

**Files:**
- Modify: `THIRD_PARTY_NOTICES.md` only if verification finds missing provenance.
- Create: `docs/testing/2026-08-14-phaser-pilot-browser-check.md`
- Modify: no production code unless a reproduced defect first gets a failing regression test.

**Interfaces:**
- Consumes: exact reviewed commit from Tasks 1–7 and the existing GitHub-connected Vercel project.
- Produces: evidence-backed browser report, final commit SHA, successful Vercel production deployment, and canonical live URL.

- [ ] **Step 1: Run a fresh clean automated verification**

Run from a clean checkout of the candidate commit:

```bash
npm test
npm run check
npm run build
```

Expected: all pass. Compare the explicit build inventory with `dist`; expected missing, extra, and changed counts are all zero.

- [ ] **Step 2: Verify the complete Danish browser flow at Chromebook size**

At 1366×768: open Spil, select Matematikmissionen, verify topic/subtopic/difficulty examples, start through the canonical URL, use WASD and arrows, switch to touch controls, collect a crystal, choose a gate, submit one wrong and one correct overlay answer, confirm hint/focus/lock, measure the 1-second continuation, pause, resume, finish, restart, and use browser Back. Check the accessibility tree, focus order, and console.

- [ ] **Step 3: Verify mobile and language variants**

At 390×844: repeat start, movement, one gate, one overlay, pause and Back using touch only; assert `document.documentElement.scrollWidth <= innerWidth`. Repeat setup and one question in English and French; confirm no untranslated required copy and that examples match the selected topic.

- [ ] **Step 4: Smoke-test all existing portal areas**

Open all seven legacy games, advance one quiz where reachable, and verify the new one-second continuation. Smoke-test Fortællinger, Opgavesæt, Udfordringer, teacher guide dismissal, language switching, direct URLs, and browser Back. Record any branch not manually reachable and its automated-test coverage.

- [ ] **Step 5: Write the verification report and request final code review**

Record commit, viewport, browser, checked flows, console result, timing evidence, deployment status, and limitations in `docs/testing/2026-08-14-phaser-pilot-browser-check.md`. Request a whole-feature review against the design spec; resolve each actionable finding with a failing regression test and repeat the focused browser check.

- [ ] **Step 6: Commit verification documentation**

```bash
git add docs/testing/2026-08-14-phaser-pilot-browser-check.md THIRD_PARTY_NOTICES.md
git commit -m "test: document Phaser pilot verification"
```

- [ ] **Step 7: Publish and verify production**

Fast-forward `main` only after review and all gates pass. Wait for the Vercel deployment tied to the exact main SHA to report `success`. Open `https://matematikportalen.vercel.app`, verify it serves that version, repeat the pilot start/teardown smoke test, and report the final SHA, deployment URL, canonical URL, and any remaining limitations.

