(() => {
  const TagAll = (globalThis.TagAll = globalThis.TagAll || {});

  TagAll.contextToken = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  TagAll.config = Object.freeze({
    storageKeys: Object.freeze({
      showInlineButton: "showInlineButton",
      interceptSend: "interceptSend",
      keyword: "keyword"
    }),
    selectors: Object.freeze({
      composer: [
        'div[contenteditable="true"][data-lexical-editor="true"]',
        'footer div[contenteditable="true"][role="textbox"]',
        'footer div[contenteditable="true"]'
      ],
      conversationHeader: [
        "#main header",
        '[data-testid="conversation-header"]',
        'header[data-testid*="conversation"]'
      ]
    }),
    defaults: Object.freeze({
      showInlineButton: true,
      interceptSend: true,
      keyword: "@everyone",
      delayMs: 80,
      candidateTimeoutMs: 900,
      candidateScrollSteps: 12
    })
  });
})();
