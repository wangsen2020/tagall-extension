(() => {
  const SOURCE = "tagall";
  const STATE_KEY = "__TAGALL_PAGE__";
  if (window[STATE_KEY]) return;

  const BUILD = "0.2.7";
  const state = { build: BUILD, enabled: true, keyword: "@everyone", busy: false };
  window[STATE_KEY] = state;

  const COMPOSER_SELECTOR = 'div[contenteditable="true"][data-lexical-editor="true"]';
  const SEND_SELECTOR = '[data-icon="send"], [data-icon="wds-ic-send-filled"], button[aria-label="Send"], button[aria-label="发送"], button[aria-label="傳送"]';

  function post(type, data = {}) {
    window.postMessage({ source: SOURCE, type, data }, "*");
  }

  function findComposer() {
    return document.querySelector(COMPOSER_SELECTOR);
  }

  function draftText(composer) {
    return (composer.innerText || "").replace(/ /g, " ").replace(/\n+$/, "").trim();
  }

  function isBoundary(character) {
    return character === undefined || /\s/.test(character);
  }

  function hasKeyword(text, keyword) {
    const haystack = text.toLocaleLowerCase();
    const needle = keyword.toLocaleLowerCase();
    if (!needle) return false;
    let index = haystack.indexOf(needle);
    while (index !== -1) {
      const before = index === 0 ? undefined : haystack[index - 1];
      const after = haystack[index + needle.length];
      if (isBoundary(before) && isBoundary(after)) return true;
      index = haystack.indexOf(needle, index + 1);
    }
    return false;
  }

  function notify(message) {
    const button = document.getElementById("tagall-inline-button");
    if (button) {
      button.title = message;
      button.setAttribute("aria-label", message);
    }
    post("notice", { message });
  }

  function serialiseId(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value._serialized === "string") return value._serialized;
    if (value.user && value.server) return `${value.user}@${value.server}`;
    return String(value);
  }

  function selfIdentifiers() {
    const conn = window.WPP.conn;
    const readers = ["getMyUserId", "getMyUserLid", "getMyUserWid"];
    const identifiers = new Set();
    for (const reader of readers) {
      try {
        const value = serialiseId(typeof conn[reader] === "function" ? conn[reader]() : "");
        if (value) identifiers.add(value);
      } catch (error) {
        // A reader missing on this WhatsApp build is not fatal.
      }
    }
    return identifiers;
  }

  async function collectParticipants(chatId) {
    const participants = await window.WPP.group.getParticipants(chatId);
    // Groups can be addressed by @lid while conn reports @c.us, so exclude every form of self.
    const me = selfIdentifiers();
    const unique = new Set();
    for (const participant of participants || []) {
      const id = serialiseId(participant?.id);
      if (id && !me.has(id)) unique.add(id);
    }
    return [...unique];
  }

  async function sendWithMentions(text) {
    const chat = await window.WPP.chat.getActiveChat();
    if (!chat) throw new Error("no_active_chat");
    const chatId = chat.id;
    if (!serialiseId(chatId).endsWith("@g.us")) throw new Error("not_a_group");
    const mentionedList = await collectParticipants(chatId);
    if (!mentionedList.length) throw new Error("no_participants");
    await window.WPP.chat.sendTextMessage(chatId, text, { mentionedList });
    try {
      await window.WPP.chat.setInputText("", chatId);
    } catch (error) {
      // The message is already sent; a stale draft is cosmetic.
    }
    return mentionedList.length;
  }

  function isSendTrigger(event, composer) {
    if (event.type === "keydown") {
      if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return false;
      if (event.isComposing || event.keyCode === 229) return false;
      return composer.contains(document.activeElement) || document.activeElement === composer;
    }
    if (event.type !== "click" || event.button !== 0) return false;
    const target = event.target;
    return Boolean(target && typeof target.closest === "function" && target.closest(SEND_SELECTOR));
  }

  function handle(event) {
    if (!state.enabled || state.busy) return;
    if (!window.WPP || !window.WPP.isReady) return;

    const composer = findComposer();
    if (!composer) return;
    // The user already built real mention chips: let WhatsApp send them untouched.
    if (composer.querySelector("[data-app-text-template]")) return;

    const text = draftText(composer);
    if (!text || !hasKeyword(text, state.keyword)) return;
    if (!isSendTrigger(event, composer)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    state.busy = true;
    notify("TagAll is sending this message with everyone mentioned…");

    sendWithMentions(text)
      .then((count) => {
        notify(`Sent. ${count} members were mentioned.`);
        post("sent", { count });
      })
      .catch((error) => {
        const reason = error?.message || "send_failed";
        notify(`TagAll could not send (${reason}). Your message is still in the box; remove ${state.keyword} to send it normally.`);
        post("send-failed", { reason });
      })
      .finally(() => {
        state.busy = false;
      });
  }

  let lastActiveChat = null;

  async function reportActiveChat(force = false) {
    try {
      const chat = await window.WPP.chat.getActiveChat();
      const id = chat ? serialiseId(chat.id) : "";
      if (id === lastActiveChat && !force) return;
      lastActiveChat = id;
      post("active-chat", { chatId: id, isGroup: id.endsWith("@g.us") });
    } catch (error) {
      // The active chat is simply unknown until WhatsApp settles.
    }
  }

  // WhatsApp's own store fires on every chat switch. A timer would be throttled to once
  // a minute in a hidden tab, so the store event is the primary signal; the content script
  // can also ask directly, and the slow interval is only a safety net.
  try {
    window.WPP.whatsapp.ChatStore.on("change:active", () => reportActiveChat(true));
  } catch (error) {
    post("notice", { message: "TagAll could not subscribe to chat changes." });
  }
  setInterval(() => reportActiveChat(false), 5000);
  reportActiveChat(true);

  window.addEventListener("keydown", handle, true);
  window.addEventListener("click", handle, true);

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const message = event.data;
    if (!message || message.source !== SOURCE) return;
    if (message.type === "query-active-chat") {
      reportActiveChat(true);
      return;
    }
    if (message.type === "settings") {
      if (typeof message.data?.interceptSend === "boolean") state.enabled = message.data.interceptSend;
      if (typeof message.data?.keyword === "string" && message.data.keyword.trim()) {
        state.keyword = message.data.keyword.trim();
      }
    }
  });

  post("page-ready", { build: BUILD, keyword: state.keyword });
})();
