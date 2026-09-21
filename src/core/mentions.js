(() => {
  const TagAll = globalThis.TagAll;

  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

  function insertText(composer, text) {
    composer.focus();
    const success = document.execCommand("insertText", false, text);
    if (!success) throw new Error("TagAll could not write to the message box.");
  }

  function normaliseForMatch(value) {
    return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  }

  function visibleMentionOptions() {
    const containers = [...document.querySelectorAll('[role="listbox"], [data-testid*="mention"]')];
    return containers.flatMap((container) => [
      ...container.querySelectorAll('[role="option"], [role="listitem"], button')
    ]).filter((element) => element.offsetParent !== null);
  }

  function nativeMentionCount(composer) {
    return composer.querySelectorAll("[data-app-text-template]").length;
  }

  function acceptFirstSuggestion(composer) {
    composer.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Tab", code: "Tab", bubbles: true, cancelable: true
    }));
    composer.dispatchEvent(new KeyboardEvent("keyup", {
      key: "Tab", code: "Tab", bubbles: true, cancelable: true
    }));
  }

  async function selectMention(composer, query, shouldCancel, exactOnly = false) {
    const target = normaliseForMatch(query);
    const mentionCountBeforeSelection = nativeMentionCount(composer);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      if (shouldCancel()) return null;
      const options = visibleMentionOptions();
      const exact = options.find((option) => normaliseForMatch(option.textContent || "") === target);
      const partial = options.find((option) => normaliseForMatch(option.textContent || "").includes(target));
      const candidate = exact || (exactOnly ? null : partial);
      if (candidate) {
        candidate.click();
        return true;
      }
      await wait(100);
    }
    if (exactOnly) return false;
    acceptFirstSuggestion(composer);
    await wait(100);
    return nativeMentionCount(composer) > mentionCountBeforeSelection;
  }

  function removeFailedQuery(composer, query) {
    composer.focus();
    const textNodeWalker = document.createTreeWalker(composer, NodeFilter.SHOW_TEXT);
    let lastTextNode = null;
    while (textNodeWalker.nextNode()) lastTextNode = textNodeWalker.currentNode;

    if (lastTextNode?.textContent.endsWith(query)) {
      const range = document.createRange();
      range.setStart(lastTextNode, lastTextNode.textContent.length - query.length);
      range.setEnd(lastTextNode, lastTextNode.textContent.length);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      if (document.execCommand("delete", false, null)) return;
    }
    if (!document.execCommand("undo", false, null)) {
      throw new Error("TagAll could not safely remove an unmatched mention query.");
    }
  }

  async function appendOneMention(composer, participant, delayMs, shouldCancel) {
    for (const query of TagAll.participants.mentionQueries(participant)) {
      if (shouldCancel()) return null;
      insertText(composer, `@${query}`);
      await wait(delayMs);
      const selected = await selectMention(composer, query, shouldCancel);
      if (selected) return true;
      removeFailedQuery(composer, `@${query}`);
      if (shouldCancel()) return null;
      await wait(50);
    }
    return false;
  }

  async function tryAppendNativeAll(composer) {
    const query = "all";
    insertText(composer, `@${query}`);
    await wait(150);
    const selected = await selectMention(composer, query, () => false, true);
    if (selected) return true;
    removeFailedQuery(composer, `@${query}`);
    return false;
  }

  async function appendMentions({ composer, participants, delayMs, shouldCancel, onProgress }) {
    if (composer.textContent.trim() && !/\s$/.test(composer.textContent)) insertText(composer, " ");
    const skipped = [];
    let completed = 0;

    for (const [index, participant] of participants.entries()) {
      if (shouldCancel()) return { cancelled: true, completed: index };
      const selected = await appendOneMention(composer, participant, delayMs, shouldCancel);
      if (selected === null) return { cancelled: true, completed: index };
      if (!selected) {
        skipped.push(participant);
        onProgress(index + 1, participants.length, { selected: false, skipped: skipped.length });
        continue;
      }
      insertText(composer, " ");
      completed += 1;
      onProgress(index + 1, participants.length, { selected: true, skipped: skipped.length });
    }
    return { cancelled: false, completed, skipped };
  }

  TagAll.mentions = Object.freeze({ appendMentions, normaliseForMatch, tryAppendNativeAll });
})();
