(() => {
  const TagAll = globalThis.TagAll;

  class TagController {
    #running = false;
    #cancelRequested = false;

    get running() { return this.#running; }

    cancel() { this.#cancelRequested = true; }

    async tagCurrentGroup({ delayMs = TagAll.config.defaults.delayMs, onProgress = () => {} } = {}) {
      if (this.#running) throw new Error("TagAll is already preparing mentions.");
      const composer = TagAll.dom.findComposer();
      const participants = TagAll.participants.collectFromPage();
      if (!composer) throw new Error("Open a group and click its message box first.");
      if (participants.length < 2) throw new Error("TagAll could not identify at least two group participants.");

      this.#running = true;
      this.#cancelRequested = false;
      try {
        return await TagAll.mentions.appendMentions({
          composer,
          participants,
          delayMs,
          shouldCancel: () => this.#cancelRequested,
          onProgress
        });
      } finally {
        this.#running = false;
      }
    }
  }

  TagAll.controller = new TagController();
})();
