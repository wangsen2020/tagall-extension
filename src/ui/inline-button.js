(() => {
  const TagAll = globalThis.TagAll;
  const BUTTON_ID = "tagall-inline-button";

  const AT_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">'
    + '<text x="12" y="17.5" text-anchor="middle" font-size="17" font-weight="600" fill="currentColor">@</text>'
    + "</svg>";

  let keyword = TagAll.config.defaults.keyword;

  function title() {
    return `Insert ${keyword} to mention every member of this group`;
  }

  function describe(button, text) {
    button.title = text;
    button.setAttribute("aria-label", text);
  }

  function setKeyword(value) {
    if (!value || typeof value !== "string") return;
    keyword = value.trim() || keyword;
    const button = document.getElementById(BUTTON_ID);
    if (button && !button.dataset.tagallBusy) describe(button, title());
  }

  function remove() {
    document.getElementById(BUTTON_ID)?.remove();
  }

  function insertKeyword(composer) {
    composer.focus();
    const text = composer.innerText.replace(/ /g, " ");
    const needsSpaceBefore = text.trim().length > 0 && !/\s$/.test(text);
    // The trailing space closes WhatsApp's mention menu so a later Enter still sends.
    const payload = `${needsSpaceBefore ? " " : ""}${keyword} `;
    if (!document.execCommand("insertText", false, payload)) {
      throw new Error("TagAll could not write to the message box.");
    }
  }

  // Sit in the same row as the attachment button rather than floating above the composer.
  // WhatsApp's class names are generated, so walk up to the element whose parent holds
  // several controls instead of matching a class.
  function toolbarAnchor() {
    const icon = document.querySelector('[data-icon="ic-attach-file"], [data-icon="attach-menu-plus"], [data-icon="plus-rounded"]');
    const attachButton = icon?.closest("button");
    if (!attachButton) return null;
    let node = attachButton;
    while (node.parentElement && node.parentElement.children.length < 2) node = node.parentElement;
    return node.parentElement ? node : null;
  }

  function mount() {
    const existing = document.getElementById(BUTTON_ID);
    if (existing) {
      // A button left behind by an invalidated context has dead listeners: replace it.
      if (existing.dataset.tagallContext === TagAll.contextToken) return;
      remove();
    }
    // content.js decides whether this conversation is a group; mount only needs a composer.
    const composer = TagAll.dom.findComposer();
    if (!composer) return;

    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.dataset.tagallContext = TagAll.contextToken;
    button.innerHTML = AT_ICON;
    describe(button, title());
    Object.assign(button.style, {
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      alignSelf: "center", width: "40px", height: "40px", margin: "0", padding: "0",
      border: "0", borderRadius: "999px", background: "transparent", color: "#0b8f74",
      cursor: "pointer", lineHeight: "0", flex: "0 0 auto"
    });

    button.addEventListener("click", () => {
      const target = TagAll.dom.findComposer();
      if (!target) return;
      try {
        insertKeyword(target);
        describe(button, `${keyword} added. Type your message, then press send.`);
      } catch (error) {
        describe(button, error.message);
        console.warn("TagAll:", error.message);
      }
      button.dataset.tagallBusy = "1";
      setTimeout(() => {
        delete button.dataset.tagallBusy;
        describe(button, title());
      }, 5000);
    });

    const anchor = toolbarAnchor();
    if (anchor?.parentElement) anchor.parentElement.insertBefore(button, anchor);
    else composer.closest("footer")?.prepend(button);
  }

  TagAll.inlineButton = Object.freeze({ mount, remove, setKeyword });
})();
