const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const root = new URL("../", `file://${__filename.replace(/\\/g, "/")}`);

test("portal data registers exactly seven games including all recovered activities", () => {
  const context = {window: {}};
  vm.createContext(context);
  const html = fs.readFileSync(new URL("index.html", root), "utf8");
  const files = [...html.matchAll(/<script src="([^"]+)"/g)]
    .map(match => match[1])
    .filter(file => /^(activities(?:-modern|-lab)?|snake-game|arcade-games)\.js$/.test(file));
  for (const file of files) {
    vm.runInContext(fs.readFileSync(new URL(file, root), "utf8"), context, {filename: file});
  }

  const games = context.window.PORTAL_CONTENT.activities.filter(activity => activity.type === "game");
  assert.equal(games.length, 7);
  assert.deepEqual(
    Array.from(games, game => game.id).sort(),
    [
      "game-arcade-balloons",
      "game-arcade-racer",
      "game-arcade-space",
      "game-arcade-tower",
      "game-fraction-snake",
      "game-fractions",
      "game-mental"
    ]
  );
});

test("index loads recovered game dependencies before teacher, story progress, and app", () => {
  const html = fs.readFileSync(new URL("index.html", root), "utf8");
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(match => match[1]);

  assert.deepEqual(scripts, [
    "ui.js",
    "activities.js",
    "activities-modern.js",
    "activities-lab.js",
    "snake-game.js",
    "arcade-games.js",
    "arcade-engine.js",
    "teacher-data.js",
    "story-progress.js",
    "question-bank.js",
    "answer-validator.js",
    "phaser-loader.js",
    "game-runtime.js",
    "app.js"
  ]);
});

