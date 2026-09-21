const tagButton = document.getElementById("tag-all");
const cancelButton = document.getElementById("cancel");
const status = document.getElementById("status");
const inlineToggle = document.getElementById("show-inline");

function setStatus(message) { status.textContent = message; }

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active browser tab is available.");
  return tab;
}

async function send(type) {
  const tab = await activeTab();
  return chrome.tabs.sendMessage(tab.id, { type });
}

async function prepareMentions() {
  tagButton.disabled = true;
  cancelButton.hidden = false;
  setStatus("Preparing mentions. Please keep WhatsApp Web open.");
  try {
    const response = await send("TAG_ALL");
    if (!response?.ok) throw new Error(response?.error || "TagAll could not reach WhatsApp Web.");
    setStatus(response.cancelled ? "Stopped. Existing mentions were kept." : `Prepared ${response.completed} mentions. Review and send when ready.`);
  } catch (error) {
    setStatus(error.message);
  } finally {
    tagButton.disabled = false;
    cancelButton.hidden = true;
  }
}

tagButton.addEventListener("click", prepareMentions);
cancelButton.addEventListener("click", async () => { await send("CANCEL_TAG_ALL"); setStatus("Stopping after the current mention."); });
chrome.storage.sync.get("showInlineButton").then(({ showInlineButton = true }) => { inlineToggle.checked = showInlineButton; });
inlineToggle.addEventListener("change", async () => { await chrome.storage.sync.set({ showInlineButton: inlineToggle.checked }); });
