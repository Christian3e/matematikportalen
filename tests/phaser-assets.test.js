const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const buildInputs = [
  "THIRD_PARTY_NOTICES.md", "activities-lab.js", "activities-modern.js", "activities.js", "answer-validator.js",
  "activity-modes.css", "app.js", "arcade-engine.js", "arcade-games.js", "index.html",
  "polish.css", "question-bank.js", "snake-game.js", "story-progress.js", "styles.css",
  "teacher-data.js", "ui.js", "vendor/phaser/LICENSE.txt", "vendor/phaser/phaser.min.js", "vercel.json"
].sort();

function listFiles(root, directory = root) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory()
      ? listFiles(root, absolute)
      : [path.relative(root, absolute).split(path.sep).join("/")];
  }).sort();
}

test("only the Phaser asset integration suite invokes the destructive build", () => {
  const owners = fs.readdirSync("tests")
    .filter(file => file.endsWith(".test.js"))
    .filter(file => /["']run["']\s*,\s*["']build["']/.test(fs.readFileSync(path.join("tests", file), "utf8")))
    .sort();

  assert.deepEqual(owners, ["phaser-assets.test.js"]);
});

test("pins Phaser 3.90.0 locally with its MIT notice", () => {
  const runtime = fs.readFileSync("vendor/phaser/phaser.min.js", "utf8");
  const license = fs.readFileSync("vendor/phaser/LICENSE.txt", "utf8");
  const notices = fs.readFileSync("THIRD_PARTY_NOTICES.md", "utf8");
  assert.match(runtime, /3\.90\.0/);
  assert.match(license, /MIT License/);
  assert.match(notices, /Phaser 3\.90\.0/);
  assert.match(notices, /github\.com\/phaserjs\/phaser/);
});

test("one integration build copies the complete explicit inventory byte-for-byte", () => {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const inventoryMatch = packageJson.scripts.build.match(/const files=(\[[^;]+\])/);
  assert.ok(inventoryMatch, "build script must declare an explicit file inventory");
  const declared = JSON.parse(inventoryMatch[1].replaceAll("'", "\"")).sort();
  assert.deepEqual(declared, buildInputs);
  assert.match(packageJson.scripts.check, /(?:^|&&\s*)node --check question-bank\.js(?=\s*(?:&&|$))/);
  assert.match(packageJson.scripts.check, /(?:^|&&\s*)node --check answer-validator\.js(?=\s*(?:&&|$))/);

  execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "check"], {
    shell: process.platform === "win32",
    stdio: "inherit"
  });

  execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
    shell: process.platform === "win32",
    stdio: "inherit"
  });

  assert.deepEqual(listFiles("dist"), buildInputs);
  for (const file of buildInputs) {
    assert.deepEqual(
      fs.readFileSync(path.join("dist", file)),
      fs.readFileSync(file),
      `${file} must be byte-identical in dist`
    );
  }
});

test("index does not eagerly load Phaser", () => {
  const index = fs.readFileSync("index.html", "utf8");
  assert.doesNotMatch(index, /<script\b[^>]*\bsrc=["'][^"']*vendor\/phaser\/phaser\.min\.js[^"']*["'][^>]*>/i);
});

