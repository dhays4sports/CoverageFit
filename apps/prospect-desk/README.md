# Prospect Desk

Standalone Windows screenshot → persistent discussion → reviewed Prospect 360
workspace. See START-HERE.txt for the user guide, data location, backup/restore,
privacy, limitations, and first-run instructions.

## Development

Node 22+ and npm are required for source development only.

    npm ci
    npm start
    npm test
    npm run dist:zip

All runtime code is in src/. Electron is the only runtime dependency (bundled
by the packager); test and packaging dependencies are development-only. The
OpenAI key is resolved only in the main process using encrypted local credentials
or OPENAI_API_KEY. No credentials are included in the source or Windows package.

The model sees all messages, all screenshots in the current thread, and linked
prospect facts. An explicit error appears for oversized requests; history is not
silently dropped. No external action tools are provided to the model. Screenshot
text is treated as untrusted evidence. Profile proposals use structured output
and local validation of source IDs. Approval is explicit, selected, and cannot
be repeated. A pending review prevents changing the linked prospect.

Data: atomic metadata replacement, a previous-version metadata backup, separate
local evidence files, self-contained exported backups. Corrupt metadata fails
closed without replacing existing files. No network server or web app is needed.

Tests in core.test.js and dom.test.js exercise actual persistence/request logic
and the actual renderer with simulated IPC/API replies. ui.cjs is an optional
Playwright suite requiring a compatible browser and local socket permissions;
it could not run in the build host's browser sandbox. No native Windows tests
or live API calls have been completed. See START-HERE.txt.

Official API reference consulted:
https://developers.openai.com/api/reference/resources/responses/methods/create

## Shared profiles (0.2)

`src/shared-profile.js` implements the desktop connector. The backend is in the
CoverageFit repository (`server/shared-prospect-profile.mjs`, migration 0020).
The client reuses existing workspace/customer/opportunity IDs, stores only a
local cache, and requires a server receipt before claiming shared approval.
Drafts and unselected messages stay local. An independent desktop-scoped token
is encrypted and pinned to the configured HTTPS origin. It cannot call message
sending routes. Thread-specific opportunity selection is explicit.

0.1 local records are not silently merged or uploaded. Select an existing shared
profile for a local thread and explicitly review the evidence you want to share.
A failed backend connection never falls back to local-master approval.

The backend is not activated by this package. See the reviewed integration
packet before enabling it. Unit and in-process integration checks do not certify
Cloudflare D1 runtime, Windows capture, actual project credentials, or production.
