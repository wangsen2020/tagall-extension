(() => {
  const TagAll = globalThis.TagAll;

  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

  function insertText(composer, text) {
    composer.focus();
    const success = document.execCommand("insertText", false, text);
    if (!success) throw new Error("TagAll could not write to the message box.");
  }

  function acceptMention(composer) {
    composer.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Tab", code: "Tab", bubbles: true, cancelable: true
    }));
    composer.dispatchEvent(new KeyboardEvent("keyup", {
      key: "Tab", code: "Tab", bubbles: true, cancelable: true
    }));
  }

  async function appendMentions({ composer, participants, delayMs, shouldCancel, onProgress }) {
    if (composer.textContent.trim() && !/\s$/.test(composer.textContent)) insertText(composer, " ");

    for (const [index, participant] of participants.entries()) {
      if (shouldCancel()) return { cancelled: true, completed: index };
      insertText(composer, `@${participant}`);
      await wait(delayMs);
      acceptMention(composer);
      await wait(delayMs);
      insertText(composer, " ");
      onProgress(index + 1, participants.length);
    }
    return { cancelled: false, completed: participants.length };
  }

  TagAll.mentions = Object.freeze({ appendMentions });
})();
