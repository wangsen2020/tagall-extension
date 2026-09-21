# TagAll

TagAll is a small, privacy-first Chrome extension that prepares an `@` mention for each participant in the currently open WhatsApp Web group. It never sends a message: the user always reviews the composed message and chooses whether to send it.

## Status

This is an early open-source foundation. WhatsApp Web is a third-party interface whose markup can change without notice, so the participant-detection logic needs ongoing browser testing.

## Project structure

```
src/
  core/       DOM access, participant discovery, mention insertion, state control
  ui/         WhatsApp Web inline button
  popup/      Chrome action popup
  content.js  Content-script orchestration and message boundary
tests/        Focused unit tests for pure parsing logic
docs/         Privacy and contribution guidance
```

The code intentionally uses native browser APIs and has no build step. The script order in `manifest.json` makes dependencies explicit.

## Local installation

1. Clone this repository.
2. Visit `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose this repository's root folder.
5. Open a WhatsApp Web group, then use the TagAll popup or `@ All` button.

## Safety and privacy

- TagAll runs only on `https://web.whatsapp.com/*`.
- It reads participant labels visible in the currently open group only to prepare mentions locally.
- It has no analytics, network requests, background page, or automatic sending.
- Keep a human in control: review every generated mention list before sending.

See [privacy guidance](docs/PRIVACY.md) before publishing to the Chrome Web Store.

## Development

Run the focused parser test:

```powershell
node tests/participants.test.js
```

Before releasing, manually test ordinary groups, large groups, non-Latin display names, a direct message, a chat while someone is typing, and a composer that already contains draft text.

## License

MIT. See [LICENSE](LICENSE).
