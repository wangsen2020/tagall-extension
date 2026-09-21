(() => {
  const TagAll = globalThis.TagAll;

  function isExtensionContextValid() {
    try {
      return Boolean(chrome.runtime?.id);
    } catch {
      return false;
    }
  }

  async function refreshInlineButton() {
    if (!isExtensionContextValid()) return;
    try {
      const { showInlineButton = TagAll.config.defaults.showInlineButton } = await chrome.storage.sync.get(
        TagAll.config.storageKeys.showInlineButton
      );
      if (showInlineButton && TagAll.dom.isGroupConversation()) TagAll.inlineButton.mount();
      else TagAll.inlineButton.remove();
    } catch (error) {
      if (!String(error?.message).includes("Extension context invalidated")) {
        console.warn("TagAll could not refresh its inline button:", error);
      }
    }
  }

  if (!isExtensionContextValid()) return;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "TAG_ALL") {
      TagAll.controller.tagCurrentGroup()
        .then((result) => sendResponse({ ok: true, ...result }))
        .catch((error) => sendResponse({ ok: false, error: error.message }));
      return true;
    }
    if (message.type === "CANCEL_TAG_ALL") {
      TagAll.controller.cancel();
      sendResponse({ ok: true });
    }
    return undefined;
  });

  let refreshTimer;
  const scheduleRefresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refreshInlineButton, 500);
  };
  const observer = new MutationObserver(scheduleRefresh);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.showInlineButton) scheduleRefresh();
  });
  refreshInlineButton();
})();
