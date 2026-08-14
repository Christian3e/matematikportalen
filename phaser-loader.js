(function (browserWindow, browserDocument, factory) {
  "use strict";
  const api = factory(browserWindow, browserDocument);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (browserWindow) browserWindow.PHASER_LOADER = api;
})(
  typeof window !== "undefined" ? window : null,
  typeof document !== "undefined" ? document : null,
  function (browserWindow, browserDocument) {
    "use strict";

    const SOURCE = "vendor/phaser/phaser.min.js";
    let cached = null;
    let inFlight = null;
    let ownedScript = null;
    let rejectFlight = null;

    function loadError(cause) {
      const error = new Error("Phaser could not be loaded");
      error.code = "PHASER_LOAD_FAILED";
      if (cause) error.cause = cause;
      return error;
    }

    function removeOwnedScript(script) {
      if (script !== ownedScript) return;
      script.onload = null;
      script.onerror = null;
      if (script.parentNode && typeof script.parentNode.removeChild === "function") {
        script.parentNode.removeChild(script);
      }
      ownedScript = null;
    }

    function load() {
      if (cached) return Promise.resolve(cached);
      if (inFlight) return inFlight;
      if (!browserWindow || !browserDocument || typeof browserDocument.createElement !== "function") {
        return Promise.reject(loadError());
      }

      const parent = browserDocument.head || browserDocument.body || browserDocument.documentElement;
      if (!parent || typeof parent.appendChild !== "function") return Promise.reject(loadError());

      const script = browserDocument.createElement("script");
      script.src = SOURCE;
      ownedScript = script;
      let pending;
      pending = new Promise((resolve, reject) => {
        rejectFlight = reject;
        function fail(cause) {
          if (script !== ownedScript) return;
          removeOwnedScript(script);
          cached = null;
          inFlight = null;
          rejectFlight = null;
          reject(loadError(cause));
        }

        script.onload = function () {
          if (script !== ownedScript) return;
          if (!browserWindow.Phaser) {
            fail();
            return;
          }
          script.onload = null;
          script.onerror = null;
          cached = browserWindow.Phaser;
          inFlight = null;
          rejectFlight = null;
          resolve(cached);
        };
        script.onerror = fail;

      });
      inFlight = pending;
      try {
        parent.appendChild(script);
      } catch (error) {
        script.onerror(error);
      }
      return pending;
    }

    function reset() {
      const reject = rejectFlight;
      cached = null;
      inFlight = null;
      rejectFlight = null;
      if (ownedScript) removeOwnedScript(ownedScript);
      if (reject) reject(loadError());
    }

    return {load, reset};
  }
);
