(() => {
  const SOURCE = "tagall";
  const STATE_KEY = "__TAGALL_BOOTSTRAP__";
  if (window[STATE_KEY]) return;

  const CHECK_INTERVAL = 500;
  const SLOW_CHECK_INTERVAL = 2000;
  const SOFT_TIMEOUT = 30000;
  const REQUIRED_STABLE_CHECKS = 2;

  const state = {
    startedAt: Date.now(),
    stableChecks: 0,
    stage: "",
    waJsRequested: false,
    pageRequested: false,
    timer: null
  };
  window[STATE_KEY] = state;

  function post(type, data = {}) {
    window.postMessage({ source: SOURCE, type, data }, "*");
  }

  function setStage(stage, detail = {}) {
    if (state.stage === stage) return;
    state.stage = stage;
    post("stage", { stage, elapsed: Date.now() - state.startedAt, ...detail });
  }

  function hasWhatsAppShell() {
    return Boolean(
      document.querySelector("div#app") ||
      document.querySelector("div#pane-side") ||
      document.querySelector('div[data-testid="link-device-qr-code"]')
    );
  }

  function moduleRuntimeReady() {
    if (typeof window.require === "function" && typeof window.__d === "function") return true;
    const chunks = window.webpackChunkwhatsapp_web_client;
    if (!Array.isArray(chunks) || chunks.length === 0) return false;
    let moduleCount = 0;
    for (const chunk of chunks) {
      if (chunk && chunk[1] && typeof chunk[1] === "object") moduleCount += Object.keys(chunk[1]).length;
    }
    return moduleCount > 0;
  }

  function canInjectWaJs() {
    if (document.readyState !== "complete") {
      state.stableChecks = 0;
      setStage("waiting_page", { waitingFor: "document" });
      return false;
    }
    if (!hasWhatsAppShell()) {
      state.stableChecks = 0;
      setStage("waiting_page", { waitingFor: "shell" });
      return false;
    }
    if (!moduleRuntimeReady()) {
      state.stableChecks = 0;
      setStage("waiting_runtime");
      return false;
    }
    state.stableChecks += 1;
    if (state.stableChecks < REQUIRED_STABLE_CHECKS) {
      setStage("waiting_runtime", { stableChecks: state.stableChecks });
      return false;
    }
    return true;
  }

  function schedule(delay) {
    clearTimeout(state.timer);
    state.timer = setTimeout(tick, delay);
  }

  function nextDelay() {
    return Date.now() - state.startedAt >= SOFT_TIMEOUT ? SLOW_CHECK_INTERVAL : CHECK_INTERVAL;
  }

  function tick() {
    try {
      if (window.WPP && window.WPP.isReady) {
        if (!state.pageRequested) {
          state.pageRequested = true;
          setStage("ready", { wppVersion: window.WPP.version || "" });
          post("inject-page");
        }
        return;
      }
      if (window.WPP) {
        setStage("waiting_ready");
        schedule(CHECK_INTERVAL);
        return;
      }
      if (!state.waJsRequested) {
        if (!canInjectWaJs()) {
          schedule(nextDelay());
          return;
        }
        state.waJsRequested = true;
        setStage("script_loading");
        post("inject-wa-js");
      }
      schedule(nextDelay());
    } catch (error) {
      setStage("failed", { reason: error?.message || "bootstrap_failed" });
    }
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const message = event.data;
    if (!message || message.source !== SOURCE) return;
    if (message.type === "wa-js-failed") {
      state.waJsRequested = false;
      setStage("failed", { reason: message.data?.reason || "script_load_failed" });
      schedule(SLOW_CHECK_INTERVAL);
      return;
    }
    if (message.type === "wa-js-loaded") schedule(0);
    if (message.type === "page-failed") {
      state.pageRequested = false;
      setStage("failed", { reason: message.data?.reason || "page_load_failed" });
    }
  });

  schedule(0);
})();
