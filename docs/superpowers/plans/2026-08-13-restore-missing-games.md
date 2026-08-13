# Missing Games Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the five games present in Vercel deployment `BYvQpRJ12SXo8Cft5uLdL2CnRLbW` but absent from GitHub.

**Architecture:** Recover the authoritative source files from Vercel's Source viewer, commit them unchanged where possible, and connect them to the current static portal through existing activity data and game routing. Add focused tests around registration, asset inclusion, routing, and game lifecycle while preserving current story behavior.

**Tech Stack:** Static HTML/CSS, vanilla JavaScript, Node built-in tests, GitHub, Vercel.

## Global Constraints

- Restore Brøkslangen, Asteroideforsvaret, Labyrintslugeren, Blokfald, and Trafikspringeren.
- Preserve the old deployment's game rules and translations.
- Keep Talduellen and Brøkbyggeren functionally unchanged.
- No framework, database, login, cookies, or personal-data storage.
- Each game must have a unique `?aktivitet=<id>` URL.
- Build remains a simple static Vercel deployment.

---

### Task 1: Recover authoritative source files

**Files:**
- Create: `snake-game.js`
- Create: `arcade-games.js`
- Create: `arcade-engine.js`
- Create: `docs/superpowers/recovery/2026-08-13-vercel-games-manifest.md`

- [ ] Extract every source line from Vercel deployment `BYvQpRJ12SXo8Cft5uLdL2CnRLbW/source`, including virtualized lines not initially visible.
- [ ] Record source lengths or SHA-256 hashes and recovered game IDs in the recovery manifest.
- [ ] Compare each recovered file with the running old deployment and verify all five game registrations are present.
- [ ] Run `node --check` on the three recovered JavaScript files.
- [ ] Commit with `chore: recover original arcade game sources`.

### Task 2: Integrate recovered games into the current portal

**Files:**
- Modify: `index.html`
- Modify: `package.json`
- Modify: `app.js` only where required for the recovered engines
- Modify/Create: focused tests under `tests/`

- [ ] Write a failing test that expects seven registered games and the five recovered IDs.
- [ ] Write a failing test that requires the three restored scripts in the correct dependency order.
- [ ] Load the recovered scripts after activity data and before `app.js`, preserving the old deployment's ordering.
- [ ] Include all three files in `npm run check` and the static build copy list.
- [ ] Integrate the recovered game renderers with current activity routing without changing story behavior.
- [ ] Run `npm test`, `npm run check`, and `npm run build`; verify all three files exist in `dist/`.
- [ ] Commit with `feat: restore missing arcade games`.

### Task 3: Review and browser verification

**Files:**
- Verify the feature branch and Vercel preview.

- [ ] Independently review spec compliance and code quality for Tasks 1 and 2.
- [ ] On a Vercel preview, verify the game category contains seven cards.
- [ ] Open all five restored games from their cards and direct URLs.
- [ ] For Brøkslangen, verify keyboard controls, apple collection, fraction question, correct/wrong answer handling, pause/resume, collision, and restart.
- [ ] For each arcade game, verify movement controls, collision/scoring, math prompt behavior, and restart.
- [ ] Verify Talduellen and Brøkbyggeren still complete a round.
- [ ] Spot-check stories, task sets, and challenges for regressions.
- [ ] Verify Chromebook and mobile layouts and zero console errors.
- [ ] Fast-forward `main`, wait for Vercel Production Ready, and repeat the core checks.
- [ ] Report final commit, production URL, and any limitations.
