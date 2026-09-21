# TagAll

TagAll is a small, privacy-first Chrome extension for people who need to mention a WhatsApp Web group but cannot use WhatsApp's native `@all` command. It prepares an individual `@` mention for each participant in the currently open group. It never sends a message: the user always reviews the composed message and chooses whether to send it.

## Why TagAll exists

WhatsApp has introduced a native `@all` group mention. Its rollout, availability, and permissions can vary by group and account. TagAll does not replace or circumvent native `@all` permissions. It helps a user prepare the same individual mentions they could otherwise add manually when the native command is unavailable to them.

This is especially useful for community operators, promoters, organizers, and support teams who participate in groups without administrator access. Use it only for relevant, consented communications; unwanted mass mentions reduce trust and may violate WhatsApp rules.

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
- TagAll does not bypass native `@all` permissions. It prepares ordinary individual mentions only.
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
