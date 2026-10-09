# CoverageFit Desktop Copilot — 0.1.0 internal preview

Windows 11 x64. Synthetic/sanitized evaluation only. Not a production-certified release. No customer messaging or CRM mutation. Full audit: [architecture](../../docs/COVERAGEFIT-DESKTOP-COPILOT-1.0.md).

## Build on Windows

Install Node.js 24 and Git. From the repository root in PowerShell:

```powershell
cd apps/desktop-copilot
npm ci
npm test
npm run build
npm run pack:win
```

NSIS output: `release/CoverageFit Copilot Setup 0.1.0.exe`. Per-user installation, no elevation requested. The installer is **unsigned**; code signing and an authenticated update channel are not configured. Do not disable Windows security controls. Distribution must remain an internal reviewed pilot. Automatic updates are absent/disabled. The GitHub `Desktop copilot preview` workflow builds the same artifact on Windows and retains it for 14 days.

`npm start` launches Electron from source after a build. Capture/review works without a gateway. Saving conversations and generating responses require the gateway below. Linux cross-build reached NSIS but failed because Wine is absent; a `win-unpacked` directory is not evidence of a working installer or tested Windows behavior.

## Start the separate protected gateway

The API credential must never be placed in desktop settings or packaged files. The gateway is a separate server process and is not bundled with the Electron application. For a local internal pilot, run it from this checkout with Node 24, using a separate terminal:

```powershell
npm run gateway:setup
$cfg = Join-Path $HOME '.coveragefit-copilot-gateway/gateway.env'
node --env-file=$cfg gateway/server.mjs
```

Setup writes random desktop-only token and encryption key to your user profile, outside the repo. It refuses to overwrite an existing configuration. The Windows user account must protect that directory; restrict permissions to the operator. Back up the encryption key securely if you need to preserve saved threads. Losing it makes existing records unreadable. Do not upload this file, token, database or encryption key to GitHub or chat.

The gateway listens on `127.0.0.1:4317` and defaults to **local simulation**, which never calls OpenAI. Read the generated configuration locally, copy only `CF_DESKTOP_TOKEN`, and enter it in the desktop's Settings → Desktop access token. Set gateway origin to `http://127.0.0.1:4317`. Click Save settings, then Refresh library. This token cannot access CoverageFit CRM; never substitute the existing producer access token.

Saved threads are encrypted in `CF_DESKTOP_DB`. Leave the gateway running while using the app. It may be restarted without losing saved threads; Quick Chats are lost when it restarts. There is one server-configured owner per pilot gateway. Production multi-user SSO and short-lived session issuance remain future integration work.

## Enable a synthetic OpenAI test

Only after configuring an authorized server-side OpenAI project, edit the protected gateway configuration **locally** and restart the gateway:

```dotenv
CF_DESKTOP_LIVE=1
CF_DESKTOP_MODEL=gpt-4.1-mini
OPENAI_API_KEY=<server-only project key>
```

GPT-4.1 mini is a documented vision-capable benchmark candidate; quality/cost/latency selection has not yet been measured. Choose another verified image-input Responses model through the server setting when benchmarking. No live request was performed during implementation. Use synthetic or properly sanitized content only. Set provider project spend/rate controls before testing. Do not add real customer processing until agency, carrier, vendor and provider-retention requirements have been reviewed and the application's customer gate is separately implemented/reviewed.

Responses use `store:false`; no provider Conversation/File objects are created. Provider abuse-monitoring and image-safety retention can still apply. Deleting a thread cannot delete those logs. Application histories are unrelated to consumer ChatGPT threads.

## First run

1. Open the app. Configure the gateway if saving/chat is desired.
2. Press `Control+Shift+Space` or tray → Capture Screenshot. An unavailable shortcut is reported; change it in Settings or use the tray.
3. Drag a rectangle within one monitor. Escape cancels. Protected windows may appear blank; the app does not bypass protection.
4. Review the image. Drag to apply solid redaction or crop. These operations modify the actual PNG pixels. Remove or Retake if needed.
5. Choose Quick Chat, New saved thread, or an existing thread. Review its title. Confirm destination explicitly. Preferences only preselect a destination; they never skip confirmation.
6. Ask your question. Confirm synthetic/sanitized content and authorization, then click Send to AI (or Run local simulation when offline mode is configured).
7. Follow up in the same thread. Add more screenshots as needed. Copy an answer manually; nothing is automatically sent.
8. Reopen a saved thread through the searchable library after restarting. Earlier text remains; old images are not re-sent to OpenAI. Re-capture an image to inspect its exact pixels again.

Insurance assistance is unverified screenshot analysis. No authoritative CoverageFit lead is linked in this preview; check Producer Work for governed decisions. Never assume a name visible in a screenshot establishes identity.

## Retention and cleanup

- Quick: memory on gateway, 30-minute inactivity expiry or gateway shutdown. Delete for immediate removal; closing the chat only hides it.
- Saved: encrypted backend records until Delete. Includes reviewed screenshots, messages, title and request-deduplication data.
- Desktop: settings and DPAPI-protected access token only. No intentional screenshot/history disk cache. OS swap/crash dumps and user clipboard are outside app deletion control.
- Forget local credentials clears desktop settings/storage but does not remove gateway threads.
- Before uninstall, delete saved threads or stop the gateway and remove its dedicated database, configuration and encryption key from `.coveragefit-copilot-gateway` if no longer needed. The NSIS uninstaller removes desktop app data, not the separately operated server's files. Backups/snapshots may retain deleted data.
- No analytics, automatic updater or crash-reporting integration is configured.

## Troubleshooting

- Gateway unavailable: start the gateway, check port and origin; thread content remains on its backend. No fallback to unauthenticated endpoints.
- Authentication invalid: rotate/check the desktop-scoped token locally. Changing credentials clears displayed thread context.
- Request changed/busy/uncertain: reopen the thread. Completed request retries are deduplicated. Interrupted provider requests may have incurred usage; no automatic provider retry occurs. Deliberately create a new turn after checking history.
- Shortcut conflict: choose another Electron accelerator in Settings; tray capture still works.
- Oversized/unreadable capture: crop or capture smaller regions; preserve readable text. 6 images/turn, 24/thread, 16 MP/image, 6 MB PNG binary/image.
- Wrong thread: cancel before confirming. If already attached, remove before sending or delete the thread. This preview does not auto-detect customer identity.
- Mixed monitors: select within one display; use separate captures across displays. Mixed-DPI behavior needs actual Windows certification.

## Verification

```powershell
npm test
npm run build
npx playwright install chromium
node tests/ui-smoke.mjs
```

Unit/integration tests use a synthetic gateway/provider. UI smoke uses mocked native capture IPC and a real local gateway; it does not certify Electron capture, Windows packaging or RingCentral native compatibility.

Manual gate (all pending): install/launch/uninstall on Windows 11, tray/shortcut conflicts/login opt-in, Chrome/PDF/File Explorer/RingCentral captures, single/multiple/mixed-DPI displays and negative coordinates, Esc, redaction readability, pin/unpin and edge placement, connection loss/cancellation/rate limits, live synthetic model accuracy, and saved-thread resumption after full desktop/gateway restart.

Release 0.1.0 adds capture/review, thread routing/library, server-only streaming AI and isolated package/CI. Advanced verified CoverageFit linkage, production authorization, signing and native certification remain explicitly disabled or pending.
