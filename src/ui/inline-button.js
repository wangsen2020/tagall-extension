(() => {
  const TagAll = globalThis.TagAll;
  const BUTTON_ID = "tagall-inline-button";
  const STOP_BUTTON_ID = "tagall-stop-button";

  function remove() {
    document.getElementById(BUTTON_ID)?.remove();
    document.getElementById(STOP_BUTTON_ID)?.remove();
  }

  function mount() {
    if (document.getElementById(BUTTON_ID)) return;
    const composer = TagAll.dom.findComposer();
    if (!composer || !TagAll.dom.isGroupConversation()) return;

    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "@ All";
    button.title = "Prepare mentions for everyone in this group";
    Object.assign(button.style, {
      margin: "0 8px", padding: "6px 10px", border: "0", borderRadius: "999px",
      background: "#0b8f74", color: "white", fontWeight: "600", cursor: "pointer"
    });
    const stopButton = document.createElement("button");
    stopButton.id = STOP_BUTTON_ID;
    stopButton.type = "button";
    stopButton.textContent = "■";
    stopButton.title = "Stop preparing mentions";
    stopButton.setAttribute("aria-label", "Stop preparing mentions");
    Object.assign(stopButton.style, {
      display: "none", margin: "0 4px 0 0", padding: "6px 10px", border: "0", borderRadius: "999px",
      background: "#d93838", color: "white", fontWeight: "700", cursor: "pointer"
    });
    stopButton.addEventListener("click", () => {
      TagAll.controller.cancel();
      stopButton.disabled = true;
      stopButton.title = "Stopping after the current member";
    });
    button.addEventListener("click", async () => {
      button.disabled = true;
      stopButton.style.display = "inline-block";
      const originalText = button.textContent;
      try {
        const result = await TagAll.controller.tagCurrentGroup({
          onProgress: (current, total) => { button.textContent = `${current}/${total}`; }
        });
        if (result.mode === "native-all") button.textContent = "@all ready";
      } catch (error) {
        console.warn("TagAll:", error.message);
      } finally {
        button.disabled = false;
        setTimeout(() => { button.textContent = originalText; }, 1000);
        stopButton.disabled = false;
        stopButton.style.display = "none";
        stopButton.title = "Stop preparing mentions";
      }
    });
    const footer = composer.closest("footer");
    footer?.prepend(stopButton);
    footer?.prepend(button);
  }

  TagAll.inlineButton = Object.freeze({ mount, remove });
})();
