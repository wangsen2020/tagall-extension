(() => {
  const TagAll = globalThis.TagAll;
  const SOURCE = "tagall";
  const SCRIPT_LOAD_TIMEOUT = 15000;
  const injected = new Map();

  function isExtensionContextValid() {
    try {
      return Boolean(chrome.runtime?.id);
    } catch {
      return false;
    }
  }

  function injectFile(path, scriptId) {
    if (injected.has(scriptId)) return injected.get(scriptId);
    const task = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = chrome.runtime.getURL(path);
      const timer = setTimeout(() => {
        injected.delete(scriptId);
        script.remove();
        reject(new Error("script_load_timeout"));
      }, SCRIPT_LOAD_TIMEOUT);
      script.onload = () => {
        clearTimeout(timer);
        resolve(true);
      };
      script.onerror = () => {
        clearTimeout(timer);
        injected.delete(scriptId);
        script.remove();
        reject(new Error("script_load_failed"));
      };
      (document.head || document.documentElement).appendChild(script);
    });
    injected.set(scriptId, task);
    return task;
  }

  function postToPage(type, data = {}) {
    window.postMessage({ source: SOURCE, type, data }, "*");
  }

  async function readSettings() {
    const keys = TagAll.config.storageKeys;
    const defaults = TagAll.config.defaults;
    const stored = await chrome.storage.local.get([keys.showInlineButton, keys.interceptSend, keys.keyword]);
    return {
      showInlineButton: stored[keys.showInlineButton] ?? defaults.showInlineButton,
      interceptSend: stored[keys.interceptSend] ?? defaults.interceptSend,
      keyword: stored[keys.keyword] || defaults.keyword
    };
  }

  async function pushSettingsToPage() {
    if (!isExtensionContextValid()) return;
    try {
      const settings = await readSettings();
      postToPage("settings", { interceptSend: settings.interceptSend, keyword: settings.keyword });
    } catch (error) {
      // Settings stay at their defaults inside the page script.
    }
  }

  // The page script knows the real chat id; the DOM heuristic is only a fallback
  // for the moments before wa-js is ready.
  let activeChatIsGroup = null;

  function inGroupConversation() {
    if (activeChatIsGroup !== null) return activeChatIsGroup;
    return TagAll.dom.isGroupConversation();
  }

  async function refreshInlineButton() {
    if (!isExtensionContextValid()) return;
    try {
      const { showInlineButton, keyword } = await readSettings();
      TagAll.inlineButton.setKeyword(keyword);
      if (showInlineButton && inGroupConversation()) TagAll.inlineButton.mount();
      else TagAll.inlineButton.remove();
    } catch (error) {
      if (!String(error?.message).includes("Extension context invalidated")) {
        console.warn("TagAll could not refresh its inline button:", error);
      }
    }
  }

  if (!isExtensionContextValid()) return;

  injectFile("src/inject/bootstrap.js", "tagall-bootstrap").catch((error) => {
    console.warn("TagAll could not start its page bootstrap:", error.message);
  });

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const message = event.data;
    if (!message || message.source !== SOURCE) return;

    if (message.type === "inject-wa-js") {
      injectFile("vendor/wa-js.js", "tagall-wa-js")
        .then(() => postToPage("wa-js-loaded"))
        .catch((error) => postToPage("wa-js-failed", { reason: error.message }));
      return;
    }
    if (message.type === "inject-page") {
      injectFile("src/inject/tagall-page.js", "tagall-page")
        .catch((error) => postToPage("page-failed", { reason: error.message }));
      return;
    }
    if (message.type === "page-ready") {
      pushSettingsToPage();
      return;
    }
    if (message.type === "active-chat") {
      activeChatIsGroup = Boolean(message.data?.isGroup);
      scheduleRefresh();
    }
  });

  let refreshTimer;
  let refreshDeadline = 0;
  const REFRESH_DEBOUNCE = 500;
  const REFRESH_MAX_WAIT = 1500;

  const runRefresh = () => {
    refreshTimer = undefined;
    refreshDeadline = 0;
    refreshInlineButton();
  };

  // WhatsApp mutates the DOM constantly, so a plain debounce can starve forever.
  // REFRESH_MAX_WAIT guarantees the refresh actually runs.
  const scheduleRefresh = () => {
    const now = Date.now();
    if (!refreshDeadline) refreshDeadline = now + REFRESH_MAX_WAIT;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(runRefresh, Math.max(0, Math.min(REFRESH_DEBOUNCE, refreshDeadline - now)));
  };
  const observer = new MutationObserver(scheduleRefresh);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes[TagAll.config.storageKeys.showInlineButton] || changes[TagAll.config.storageKeys.keyword]) {
      scheduleRefresh();
    }
    if (changes[TagAll.config.storageKeys.interceptSend] || changes[TagAll.config.storageKeys.keyword]) {
      pushSettingsToPage();
    }
  });
  refreshInlineButton();
})();
