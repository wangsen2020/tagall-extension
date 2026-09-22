const inlineToggle = document.getElementById("show-inline");
const interceptToggle = document.getElementById("intercept-send");
const keywordInput = document.getElementById("keyword");
const status = document.getElementById("status");

const DEFAULT_KEYWORD = "@everyone";

function setStatus(message) {
  status.textContent = message;
}

chrome.storage.local
  .get(["showInlineButton", "interceptSend", "keyword"])
  .then(({ showInlineButton = true, interceptSend = true, keyword = DEFAULT_KEYWORD }) => {
    inlineToggle.checked = showInlineButton;
    interceptToggle.checked = interceptSend;
    keywordInput.value = keyword;
  });

inlineToggle.addEventListener("change", async () => {
  await chrome.storage.local.set({ showInlineButton: inlineToggle.checked });
});

interceptToggle.addEventListener("change", async () => {
  await chrome.storage.local.set({ interceptSend: interceptToggle.checked });
  setStatus(interceptToggle.checked
    ? "TagAll will mention everyone when your message contains the keyword."
    : "TagAll will leave your messages alone.");
});

keywordInput.addEventListener("change", async () => {
  const keyword = keywordInput.value.trim() || DEFAULT_KEYWORD;
  keywordInput.value = keyword;
  await chrome.storage.local.set({ keyword });
  setStatus(`Keyword set to ${keyword}.`);
});
