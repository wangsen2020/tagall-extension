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

  async function selectMention(query, shouldCancel, exactOnly = false) {
    const target = normaliseForMatch(query);
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
    return false;
  }

  function removeFailedQuery(composer) {
    composer.focus();
    if (!document.execCommand("undo", false, null)) {
      throw new Error("TagAll could not safely remove an unmatched mention query.");
    }
  }

  async function appendOneMention(composer, participant, delayMs, shouldCancel) {
    for (const query of TagAll.participants.mentionQueries(participant)) {
      if (shouldCancel()) return null;
      insertText(composer, `@${query}`);
      await wait(delayMs);
      const selected = await selectMention(query, shouldCancel);
      if (selected) return true;
      removeFailedQuery(composer);
      if (shouldCancel()) return null;
      await wait(50);
    }
    return false;
  }

  async function tryAppendNativeAll(composer) {
    const query = "all";
    insertText(composer, `@${query}`);
    await wait(150);
    const selected = await selectMention(query, () => false, true);
    if (selected) return true;
    removeFailedQuery(composer);
    return false;
  }

  async function appendMentions({ composer, participants, delayMs, shouldCancel, onProgress }) {
    if (composer.textContent.trim() && !/\s$/.test(composer.textContent)) insertText(composer, " ");

    for (const [index, participant] of participants.entries()) {
      if (shouldCancel()) return { cancelled: true, completed: index };
      const selected = await appendOneMention(composer, participant, delayMs, shouldCancel);
      if (selected === null) return { cancelled: true, completed: index };
      if (!selected) {
        throw new Error(`TagAll could not select the WhatsApp member: ${participant}`);
      }
      insertText(composer, " ");
      onProgress(index + 1, participants.length);
    }
    return { cancelled: false, completed: participants.length };
  }

  TagAll.mentions = Object.freeze({ appendMentions, normaliseForMatch, tryAppendNativeAll });
})();
