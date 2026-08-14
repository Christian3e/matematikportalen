(function (browserWindow, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (browserWindow) browserWindow.GAME_RUNTIME = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  const QUIZ_RESUME_DELAY_MS = 1000;
  const INTERACTIVE_SELECTOR = "input, select, textarea, button, [contenteditable], [role=dialog] *";
  const KEY_ACTIONS = Object.freeze({
    arrowleft: "left", a: "left",
    arrowright: "right", d: "right",
    arrowup: "up", w: "up",
    arrowdown: "down", s: "down",
    " ": "jump", spacebar: "jump"
  });

  /*
   * Small host boundary: provide either `game` or `createGame(context)`, plus
   * ANSWER_VALIDATOR. Optional document/window/timers, copy/language,
   * touchControls, controls(), and callbacks make lifecycle behavior testable
   * without coupling this adapter to a particular Phaser scene or quiz form.
   */
  function mount(root, options = {}) {
    if (!root || typeof root.appendChild !== "function") throw new TypeError("A game root is required");

    const documentRef = options.document || (typeof document !== "undefined" ? document : null);
    const windowRef = options.window || (typeof window !== "undefined" ? window : null);
    const timers = options.timers || {
      setTimeout: (callback, delay) => setTimeout(callback, delay),
      clearTimeout: id => clearTimeout(id)
    };
    const validator = options.ANSWER_VALIDATOR || options.answerValidator;
    const copy = options.copy || {};
    const callbacks = options.callbacks || {};
    const reducedMotion = options.reducedMotion == null
      ? !!windowRef?.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      : !!options.reducedMotion;

    let status = "idle";
    let question = null;
    let feedback = null;
    let hint = null;
    let controlsEnabled = true;
    let errorState = null;
    let game = null;
    let gameDestroyed = false;
    let gamePaused = false;
    let visibilityPaused = false;
    let resumeReady = false;
    let resumeTimer = null;
    let listenersRemoved = false;
    const listeners = [];

    const owned = documentRef?.createElement?.("section") || {remove() {}};
    owned.setAttribute?.("data-game-runtime", "");
    root.appendChild(owned);

    function snapshot() {
      return {status, question, feedback, hint, controlsEnabled, error: errorState, reducedMotion};
    }

    function publishState() {
      callbacks.onState?.(snapshot());
    }

    function setStatus(next) {
      status = next;
      publishState();
    }

    function listen(target, type, listener) {
      if (!target?.addEventListener) return;
      target.addEventListener(type, listener);
      listeners.push([target, type, listener]);
    }

    function removeListeners() {
      if (listenersRemoved) return;
      listenersRemoved = true;
      for (const [target, type, listener] of listeners) target.removeEventListener(type, listener);
    }

    function clearResumeTimer() {
      if (resumeTimer == null) return;
      timers.clearTimeout(resumeTimer);
      resumeTimer = null;
    }

    function pauseGame() {
      if (gamePaused || !game) return;
      gamePaused = true;
      game.pause?.();
    }

    function resumeGame() {
      if (!gamePaused || !game) return;
      gamePaused = false;
      game.resume?.();
    }

    function destroyGame() {
      if (gameDestroyed || !game) return;
      gameDestroyed = true;
      try { game.destroy?.(); } catch (_) {}
    }

    function enterError(cause) {
      if (status === "destroyed" || status === "error") return false;
      status = "error";
      clearResumeTimer();
      resumeReady = false;
      visibilityPaused = false;
      try { pauseGame(); } catch (_) {}
      destroyGame();
      removeListeners();
      controlsEnabled = false;
      errorState = {message: copy.error || "Game unavailable", retry: copy.retry || "Retry", back: copy.back || "Back"};
      feedback = errorState.message;
      try { publishState(); } catch (_) {}
      try { callbacks.onError?.(cause, errorState); } catch (_) {}
      return false;
    }

    function safe(action) {
      try { return action(); } catch (error) { return enterError(error); }
    }

    function controls() {
      const value = typeof options.controls === "function" ? options.controls(question) : options.controls;
      return value ? Array.from(value) : [];
    }

    function setControlsEnabled(enabled) {
      controlsEnabled = enabled;
      for (const control of controls()) control.disabled = !enabled;
    }

    function localized(value) {
      if (typeof value === "string") return value;
      if (!value || typeof value !== "object") return null;
      return value[options.language] || value.da || Object.values(value)[0] || null;
    }

    function focusFirstEnabledControl() {
      const control = controls().find(item => !item.disabled && typeof item.focus === "function");
      if (control) control.focus();
      callbacks.onFocus?.(control || null);
    }

    function input(action, down) {
      if (status !== "playing" || gamePaused) return false;
      return safe(() => {
        game?.input?.(action, !!down);
        callbacks.onInput?.(action, !!down);
        return true;
      });
    }

    function showQuestion(nextQuestion) {
      if (status !== "playing") return false;
      return safe(() => {
        pauseGame();
        if (status !== "playing") return false;
        visibilityPaused = false;
        question = nextQuestion;
        feedback = null;
        hint = null;
        errorState = null;
        setControlsEnabled(true);
        setStatus("question");
        callbacks.onQuestion?.(nextQuestion);
        return true;
      });
    }

    function submit(raw) {
      if (status !== "question" || !controlsEnabled) return false;
      return safe(() => {
        if (!validator || typeof validator.check !== "function") throw new TypeError("ANSWER_VALIDATOR.check is required");
        const result = validator.check(question, raw);
        hint = localized(question?.hint);
        if (!result.correct) {
          feedback = result.error ? (copy[result.error] || copy.format || result.error) : (copy.wrong || "Try again");
          setControlsEnabled(true);
          callbacks.onFeedback?.({result, feedback, hint, locked: false});
          focusFirstEnabledControl();
          publishState();
          return false;
        }

        feedback = copy.correct || "Correct";
        setControlsEnabled(false);
        setStatus("feedback");
        if (status !== "feedback") return false;
        callbacks.onFeedback?.({result, feedback, hint, locked: true});
        if (status !== "feedback") return false;
        setStatus("resuming");
        if (status !== "resuming") return false;
        if (resumeTimer == null) {
          resumeTimer = timers.setTimeout(() => {
            resumeTimer = null;
            if (status !== "resuming") return;
            if (documentRef?.hidden) {
              resumeReady = true;
              return;
            }
            safe(() => {
              resumeGame();
              if (status !== "resuming") return;
              question = null;
              setStatus("playing");
            });
          }, QUIZ_RESUME_DELAY_MS);
        }
        return true;
      });
    }

    function finish() {
      if (["destroyed", "error", "finished"].includes(status)) return false;
      return safe(() => {
        clearResumeTimer();
        resumeReady = false;
        visibilityPaused = false;
        pauseGame();
        if (status === "error" || status === "destroyed") return false;
        setStatus("finished");
        callbacks.onFinished?.();
        return true;
      });
    }

    function destroy() {
      if (status === "destroyed") return;
      clearResumeTimer();
      resumeReady = false;
      visibilityPaused = false;
      removeListeners();
      destroyGame();
      owned.remove?.();
      question = null;
      setStatus("destroyed");
    }

    const session = {showQuestion, submit, input, destroy, getState: snapshot};

    function interactiveTarget(target) {
      return !!target?.closest?.(INTERACTIVE_SELECTOR);
    }

    function keyboard(down) {
      return event => {
        if (interactiveTarget(event.target)) return;
        const action = KEY_ACTIONS[String(event.key || "").toLowerCase()];
        if (!action) return;
        event.preventDefault?.();
        input(action, down);
      };
    }

    function onVisibilityChange() {
      safe(() => {
        if (documentRef.hidden) {
          if (status === "playing" && !gamePaused) {
            pauseGame();
            visibilityPaused = true;
          }
          return;
        }
        if (status === "playing" && visibilityPaused) {
          visibilityPaused = false;
          resumeGame();
        } else if (status === "resuming" && resumeReady) {
          resumeReady = false;
          resumeGame();
          if (status !== "resuming") return;
          question = null;
          setStatus("playing");
        }
      });
    }

    listen(documentRef, "keydown", keyboard(true));
    listen(documentRef, "keyup", keyboard(false));
    listen(documentRef, "visibilitychange", onVisibilityChange);

    const touchControls = options.touchControls || root.querySelectorAll?.("[data-game-action]") || [];
    for (const control of touchControls) {
      const action = control.dataset?.gameAction;
      listen(control, "pointerdown", () => input(action, true));
      for (const type of ["pointerup", "pointercancel", "pointerleave"]) {
        listen(control, type, () => input(action, false));
      }
    }

    const context = {
      root: owned,
      reducedMotion,
      language: options.language,
      copy,
      showQuestion,
      finish,
      fail: enterError,
      input
    };

    safe(() => {
      if (options.game) game = typeof options.game === "function" ? options.game(context) : options.game;
      else if (typeof options.createGame === "function") game = options.createGame(context);
      else throw new TypeError("game or createGame is required");
      if (status !== "idle") {
        if (status === "error") destroyGame();
        return;
      }
      setStatus("playing");
      if (status !== "playing") return;
      game.start?.();
    });

    return session;
  }

  return {QUIZ_RESUME_DELAY_MS, mount};
});
