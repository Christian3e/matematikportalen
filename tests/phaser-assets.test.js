const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const assets = [
  "vendor/phaser/phaser.min.js",
  "vendor/phaser/LICENSE.txt",
  "THIRD_PARTY_NOTICES.md"
];

test("pins Phaser 3.90.0 locally with its MIT notice", () => {
  const runtime = fs.readFileSync("vendor/phaser/phaser.min.js", "utf8");
  const license = fs.readFileSync("vendor/phaser/LICENSE.txt", "utf8");
  const notices = fs.readFileSync("THIRD_PARTY_NOTICES.md", "utf8");
  assert.match(runtime, /3\.90\.0/);
  assert.match(license, /MIT License/);
  assert.match(notices, /Phaser 3\.90\.0/);
  assert.match(notices, /github\.com\/phaserjs\/phaser/);
});

test("build copies all Phaser assets byte-for-byte", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  for (const asset of assets) {
    assert.match(packageJson, new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
    shell: process.platform === "win32",
    stdio: "inherit"
  });

  for (const asset of assets) {
    assert.deepEqual(
      fs.readFileSync(path.join("dist", asset)),
      fs.readFileSync(asset),
      `${asset} must be byte-identical in dist`
    );
  }
});

test("index does not eagerly load Phaser", () => {
  const index = fs.readFileSync("index.html", "utf8");
  assert.doesNotMatch(index, /<script\b[^>]*\bsrc=["'][^"']*vendor\/phaser\/phaser\.min\.js[^"']*["'][^>]*>/i);
});
