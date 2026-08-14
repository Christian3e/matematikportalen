const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync(new URL("../phaser-loader.js", `file://${__filename.replace(/\\/g, "/")}`), "utf8");

function browserLoader(appendFailure) {
  const scripts = [];
  const head = {
    appendChild(script) {
      if (appendFailure?.current) {
        appendFailure.current = false;
        throw new Error("append failed");
      }
      scripts.push(script);
      script.parentNode = head;
      return script;
    },
    removeChild(script) {
      const index = scripts.indexOf(script);
      if (index !== -1) scripts.splice(index, 1);
      script.parentNode = null;
    }
  };
  const document = {
    head,
    createElement(tagName) {
      assert.equal(tagName, "script");
      return {tagName: "SCRIPT", parentNode: null, onload: null, onerror: null};
    }
  };
  const window = {};
  const context = {window, document, Promise, Error};
  vm.createContext(context);
  vm.runInContext(source, context, {filename: "phaser-loader.js"});
  return {loader: window.PHASER_LOADER, window, scripts};
}

test("browser bootstrap does not append Phaser before load", () => {
  const {loader, scripts} = browserLoader();
  assert.deepEqual(Object.keys(loader).sort(), ["load", "reset"]);
  assert.equal(scripts.length, 0);
});

test("concurrent loads share one in-flight promise and one owned script", async () => {
  const {loader, window, scripts} = browserLoader();
  const first = loader.load();
  const second = loader.load();
  assert.equal(first, second);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, "vendor/phaser/phaser.min.js");
  const Phaser = {VERSION: "3.90.0"};
  window.Phaser = Phaser;
  scripts[0].onload();
  assert.equal(await first, Phaser);
});

test("successful loads cache the Phaser namespace without another tag", async () => {
  const {loader, window, scripts} = browserLoader();
  const first = loader.load();
  window.Phaser = {Game: function Game() {}};
  scripts[0].onload();
  assert.equal(await first, window.Phaser);
  assert.equal(await loader.load(), window.Phaser);
  assert.equal(scripts.length, 1);
});

test("network failure rejects with a stable code, cleans up, and permits retry", async () => {
  const {loader, window, scripts} = browserLoader();
  const failed = loader.load();
  const failedTag = scripts[0];
  failedTag.onerror(new Error("offline"));
  await assert.rejects(failed, error => error.code === "PHASER_LOAD_FAILED");
  assert.equal(scripts.length, 0);

  const retried = loader.load();
  assert.equal(scripts.length, 1);
  assert.notEqual(scripts[0], failedTag);
  window.Phaser = {VERSION: "3.90.0"};
  scripts[0].onload();
  assert.equal(await retried, window.Phaser);
});

test("synchronous append failure clears the rejected flight and permits retry", async () => {
  const appendFailure = {current: true};
  const {loader, window, scripts} = browserLoader(appendFailure);
  const failed = loader.load();
  await assert.rejects(failed, error => error.code === "PHASER_LOAD_FAILED");
  assert.equal(scripts.length, 0);

  const retried = loader.load();
  assert.notEqual(retried, failed);
  assert.equal(scripts.length, 1);
  window.Phaser = {VERSION: "3.90.0"};
  scripts[0].onload();
  assert.equal(await retried, window.Phaser);
});

test("onload without the Phaser global cleans up and permits retry", async () => {
  const {loader, window, scripts} = browserLoader();
  const failed = loader.load();
  scripts[0].onload();
  await assert.rejects(failed, error => error.code === "PHASER_LOAD_FAILED");
  assert.equal(scripts.length, 0);

  const retried = loader.load();
  window.Phaser = {VERSION: "3.90.0"};
  scripts[0].onload();
  assert.equal(await retried, window.Phaser);
});

test("reset removes only the loader-owned tag and clears a successful cache", async () => {
  const {loader, window, scripts} = browserLoader();
  const unrelated = {tagName: "SCRIPT", src: "unrelated.js"};
  scripts.push(unrelated);
  const loaded = loader.load();
  const owned = scripts[1];
  window.Phaser = {VERSION: "3.90.0"};
  owned.onload();
  await loaded;

  loader.reset();
  assert.deepEqual(scripts, [unrelated]);
  delete window.Phaser;
  const retry = loader.load();
  assert.equal(scripts.length, 2);
  scripts[1].onerror();
  await assert.rejects(retry, error => error.code === "PHASER_LOAD_FAILED");
});

test("reset never removes an unrelated script when the loader owns none", () => {
  const {loader, scripts} = browserLoader();
  const unrelated = {tagName: "SCRIPT", src: "vendor/phaser/phaser.min.js"};
  scripts.push(unrelated);
  loader.reset();
  assert.deepEqual(scripts, [unrelated]);
});

test("reset rejects an in-flight load, removes its tag, and leaves a clean retry", async () => {
  const {loader, window, scripts} = browserLoader();
  const cancelled = loader.load();
  loader.reset();
  await assert.rejects(cancelled, error => error.code === "PHASER_LOAD_FAILED");
  assert.equal(scripts.length, 0);

  const retried = loader.load();
  window.Phaser = {VERSION: "3.90.0"};
  scripts[0].onload();
  assert.equal(await retried, window.Phaser);
});

test("browser and CommonJS expose the two-method API without Node-global pollution", () => {
  const before = globalThis.PHASER_LOADER;
  delete require.cache[require.resolve("../phaser-loader.js")];
  const common = require("../phaser-loader.js");
  assert.deepEqual(Object.keys(common).sort(), ["load", "reset"]);
  assert.equal(globalThis.PHASER_LOADER, before);

  const {loader} = browserLoader();
  assert.deepEqual(Object.keys(loader).sort(), Object.keys(common).sort());
});
