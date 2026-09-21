(() => {
  const TagAll = (globalThis.TagAll = globalThis.TagAll || {});

  TagAll.config = Object.freeze({
    storageKeys: Object.freeze({ showInlineButton: "showInlineButton" }),
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
    defaults: Object.freeze({ showInlineButton: true, delayMs: 180 })
  });
})();
