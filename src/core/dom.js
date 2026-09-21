(() => {
  const TagAll = globalThis.TagAll;

  function findFirst(selectors, root = document) {
    return selectors.map((selector) => root.querySelector(selector)).find(Boolean) || null;
  }

  function findComposer() {
    return findFirst(TagAll.config.selectors.composer);
  }

  function findConversationHeader() {
    return findFirst(TagAll.config.selectors.conversationHeader);
  }

  function isGroupConversation() {
    return TagAll.participants.collectFromPage().length >= 2;
  }

  TagAll.dom = Object.freeze({ findFirst, findComposer, findConversationHeader, isGroupConversation });
})();
