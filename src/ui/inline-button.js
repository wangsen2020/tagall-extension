(() => {
  const TagAll = globalThis.TagAll;
  const BUTTON_ID = "tagall-inline-button";

  function remove() { document.getElementById(BUTTON_ID)?.remove(); }

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
    button.addEventListener("click", async () => {
      button.disabled = true;
      const originalText = button.textContent;
      try {
        await TagAll.controller.tagCurrentGroup({
          onProgress: (current, total) => { button.textContent = `${current}/${total}`; }
        });
      } catch (error) {
        console.warn("TagAll:", error.message);
      } finally {
        button.disabled = false;
        button.textContent = originalText;
      }
    });
    composer.closest("footer")?.prepend(button);
  }

  TagAll.inlineButton = Object.freeze({ mount, remove });
})();
