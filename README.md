# TagAll

**静默 @ 通知所有人** —— TagAll is a small, privacy-first Chrome extension that notifies every member of a WhatsApp Web group with one message, without pasting a wall of names into it.

## How it works

1. Open a group and click the **@** button next to the message box. TagAll inserts the keyword `@everyone`.
2. Type your message after the keyword.
3. Press send. TagAll turns that one message into a group mention: every member is notified, and the message body stays exactly what you typed.

TagAll only acts when you press send yourself. It never sends anything on its own, and it never sends a message that does not contain the keyword.

The keyword is configurable in the extension popup, and the whole behaviour can be switched off there.

## Why TagAll exists

WhatsApp offers a native group mention, but its rollout, group conditions, and permissions vary. Community operators, promoters, organizers, and support teams often participate in groups without the permission to use it.

The obvious workaround — typing one `@` mention per member — does not scale. In a 118-member group it means 118 picker interactions, and the resulting message is an unreadable wall of names. TagAll sends the same notification with a clean message body.

Use it only for relevant, consented communications. Unwanted mass mentions reduce trust and may violate WhatsApp rules.

## Project structure

```text
manifest.json              Chrome Manifest V3 configuration
src/content.js             Content script: injection pipeline and settings relay
src/core/config.js         Constants and default settings
src/core/dom.js            WhatsApp Web DOM lookups
src/core/participants.js   Group detection from the conversation header
src/ui/inline-button.js    The @ button next to the message box
src/inject/bootstrap.js    Page-world probe that decides when wa-js may load
src/inject/tagall-page.js  Page-world send interception
src/popup/                 Extension popup
vendor/wa-js.js            WPPConnect/WA-JS 4.6.0, bundled locally
tests/                     Focused unit tests for pure parsing logic
```

Scripts are injected into the page world through `web_accessible_resources`, not through a `world: "MAIN"` content script, because wa-js can only hook WhatsApp's module runtime once that runtime exists. `bootstrap.js` waits for `document.readyState === "complete"`, the WhatsApp shell, a live module runtime, and two consecutive stable checks before it asks for wa-js to be injected.

No remote code is loaded: wa-js ships inside the extension.

## Local installation

1. Clone this repository.
2. Visit `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose this repository's root folder.
5. Open a WhatsApp Web group and use the **@** button.

After changing any source file, press the reload icon on the extension card. The version in `manifest.json` is bumped on every change so you can confirm the reload took effect.

## Safety and privacy

- TagAll runs only on `https://web.whatsapp.com/*`.
- It reads the open group's participant list locally to build the mention list. Nothing is written to disk and nothing is uploaded.
- It has no analytics and no network requests of its own.
- It sends only the message you typed, only when you press send, and only when your message contains the keyword.

See [privacy guidance](./docs/1.%20隐私政策草稿_20260921_1713_wangsen.md) before publishing to the Chrome Web Store.

## Development

```powershell
node tests/participants.test.js
```

## License

MIT. See [LICENSE](LICENSE).
