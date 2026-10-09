# COVERAGEFIT-DESKTOP-COPILOT-1.0 + THREADS-1.0

Status: implemented internal preview, **not certified for customer use**. Audit date: 2026-10-09 UTC.

## Verified repository audit

Canonical repository: `dhays4sports/CoverageFit` (GitHub metadata ID 1225195213), default branch `main`, audited SHA `5f47f2b7367110ca04ff03cc189983f136ab32fa`. Desktop branch: `feature/coveragefit-desktop-copilot-1.0`, based on that exact main. No AGENTS.md was present. No root package.json, React frontend or CI workflow exists on this main. Frontend is static HTML and browser JS; server is ES modules with Cloudflare Pages Functions, Workers and D1 migrations. Desktop adds an isolated npm package, not a root build conversion. No existing runtime files are changed.

Open PRs inspected: #3 Signal Decision, #6 Producer OS, #7 Signal Copilot, #8 Commitment/Attention stacked on #7, #9 distribution lead email. Do not merge any of them as a desktop prerequisite.

**Historical state corrected:** `server/producer-action-quality.mjs` and its architecture document are on `origin/signal-copilot` at `da76c970c2051be867a426af01e26e681839390b`, not main. GitHub run 37891617350 for that SHA concluded success. The historical 463-test count is not a count from main. Main's fresh suite: 328 tests, 327 pass, 1 fail, zero skips. Existing failure: `tests/agencyzoom-raw.test.mjs` expects `/48 hours/`; actual output is `READY — outside 7 days; import outside NEW_LEAD pilot`. Desktop does not modify this test or its implementation.

## Reuse and authority

- Existing `authorizeProducer` in `server/consultation-inbox-core.mjs` supplies the constant-time bearer authorization mechanism. The gateway uses a **separate desktop-scoped token**; never provision the existing CRM token to this app. Owner is server configured, never supplied by screenshots or requests.
- Existing `server/recommendation-extraction.mjs` already uses Responses with image inputs, `store:false` and server-only OPENAI_API_KEY. Desktop follows that pattern but has no dependency on quoting services or their keys.
- `server/solo-desk-api.mjs` already protects `/producer-work` and `/producer-detail`; `producer-workspace.mjs` projects opportunity/SMS sources and isolates CONTROL. Desktop does not call those routes yet.
- On #7, Attention, Decision 2, Opportunity Priority, Commitments and NBA reconcile in Producer Action Quality. Verified precedence: contact safety; Signal STOP/CLOSE/LATER; due commitment when Attention is NOW/TODAY; current Decision 2; upcoming commitment; NBA. CONTROL receives null. This logic is not copied into the desktop.
- RingCentral provider/client/outbound gateway and AgencyZoom import remain entirely untouched. No automatic outbound or CRM mutation endpoint exists in the new gateway.
- 408FARMERS acquisition continues through existing distribution handoffs into Producer Work. Desktop is another CoverageFit surface; no domain, business or infrastructure migration.

## Architecture decision

`apps/desktop-copilot` owns Electron/React/TypeScript, lockfile, packaging and tests. The Electron main process alone captures screens, handles credentials and proxies bounded requests. Renderer has sandbox, context isolation, no Node integration, CSP with no network connections, denied navigation/new windows/permissions, and narrow validated IPC. Screenshot content and model output are plain text/image data, never HTML or executable tools.

A separately operated Node 24 gateway uses the existing authorization function and encrypted SQLite thread records. Initial loopback binding avoids deploying an unreviewed public endpoint or changing Cloudflare production. For a later remote pilot use an authenticated HTTPS reverse proxy and server-managed secrets after review; no direct unauthenticated remote binding. Gateway code and API credentials are excluded from the Electron package. This is an internal single-producer gateway, **not production multi-user identity/SSO**. The storage layer scopes every operation by owner; one configured token maps to one configured producer per gateway. Rotation requires updating the gateway and desktop, with UI context cleared on credential changes.

Capture: explicit shortcut/tray/button → screen thumbnails at physical resolution → one overlay per monitor → local rectangle transformed using actual source pixel dimensions → review canvas → destructive crop/solid redaction → thread routing → explicit gateway attachment → explicit AI submission. Negative monitor origins are handled by display bounds, selection uses local coordinates. Cross-monitor rectangles are not supported; use separate captures for different monitors. Protected windows are not bypassed.

## Thread and provider retention

Application-owned UUIDs, ordered captures and message history; Quick/New/Existing routing always requires destination confirmation (preferences preselect only). New threads get editable capture-label titles. Search, recent order, pin, archive, rename, delete, promotion and restart retrieval are implemented. Saved screenshots are encrypted AES-256-GCM in the gateway; metadata/content encrypted together. Encryption key must be supplied out of band. SQLite secure_delete is enabled. Delete removes the record; backups, filesystem snapshots and physical storage recovery are outside application deletion guarantees.

Quick Chat remains gateway memory only, expires after 30 minutes inactivity or gateway shutdown. Desktop exit does not immediately delete a Quick Chat; delete it for immediate removal. Closing the window hides to tray; Quit ends the process. Desktop does not intentionally write screenshots/history to disk, logs, analytics or crash reports. OS swap, system crash dumps and clipboard retention are outside the app's guarantees. Clipboard is written only on Copy and is not automatically cleared.

Saved threads persist until explicit deletion. Installer uninstall removes desktop user data, **not the separately operated gateway database**. Delete threads first or follow the gateway cleanup instructions. Credentials use Electron safeStorage on Windows (DPAPI); if encryption is unavailable the token remains in memory only.

Provider strategy: Responses `store:false`, no Files or Conversations objects, no previous_response_id. Each turn sends only newly submitted reviewed images plus the saved text history; earlier images are represented by fallible prior answers, not silently retransmitted. To inspect an earlier image again, capture/review it again. This avoids provider conversation retention but cannot promise perfect pixel-level recall after resumption. Never claims access to consumer ChatGPT history.

`store:false` is not a zero-retention contract: applicable OpenAI abuse-monitoring retention, image safety exceptions and account-specific controls still apply. Clearing local/backend threads cannot delete provider safety logs. Review account settings and contractual requirements before customer processing.

## Safety and limits

Default `CF_DESKTOP_LIVE=0` returns an explicitly labeled local simulation; no image understanding is claimed. Live gateway requires separate OPENAI_API_KEY + CF_DESKTOP_MODEL, and UI authorization for synthetic or properly sanitized content. `customer` data class is rejected; there is no customer-use enable switch. Labels are user declarations, not an automatic PII detector. Agency/carrier/vendor authorization remains required before adding a customer mode.

Model is operator-configured, not chosen by price assumptions. GPT-4.1 mini has documented image-input/streaming support and is a candidate for a synthetic benchmark, **not a benchmarked selection**. Live model quality/latency/cost measurements have not been performed. Never reuse unrelated credentials to perform those tests.

Limits: 6 PNGs/turn, 6 MB binary/image, 16 megapixels/image, 8192 pixels/axis, 32 MB request, 24 captures/thread, 80 messages/thread, 200 threads/owner, 12,000 characters/question and 2,400 max output tokens. Actual PNG bytes, dimensions and CRC checked; gateway history sourced only from its records. One active model request/thread. No automatic provider retry; uncertain/cancelled requests stay marked and cannot silently replay. Completed retries return existing messages. Version checks reject stale edits. Thread deletion aborts active responses. Backend payloads and provider errors are not logged.

No verified lead links accepted. Client attempts to supply a lead or governedAction fail schema validation. General mode never reads CRM. Insurance mode is clearly unverified assistance, not CoverageFit Intelligence. Prompt-injection tests establish untrusted data placement and absence of tools; they do not claim empirical model immunity.

## Roadmap and acceptance

1. Audit/package separation — implemented.
2. Capture shell/review — implemented, native Windows certification pending.
3. Thread routing/library/resumption — implemented and tested with synthetic renderer + backend.
4. Secure streaming API — implemented with mock protocol tests; live synthetic quality tests pending credentials.
5. Insurance prompting — implemented; professional accuracy evaluation pending.
6. Verified read-only CoverageFit integration — blocked on certification of #7 and a stable authenticated association/context contract. Must render Why now / Do / Evidence from the actual server projection; reject stale version and mismatched identity; revalidate suppression before any solicitation drafting. No duplicated precedence.
7. Windows release certification — installer workflow supplied; manual native acceptance required.

Mandatory release gate: Windows 11 RingCentral native app → shortcut → region → review/redaction → existing thread → AI answer → follow-up → Copy → user paste → Quit/restart → resume. Also test Chrome, PDF viewer, File Explorer, mixed DPI, negative monitor coordinates, shortcut conflicts, Esc cancellation, monitor-edge placement, protected-window failure, tray/login/uninstall and offline/auth/rate-limit errors. No actual customer data needed; use authorized synthetic content.

Advanced collision cases A–G (ASK_ONE_QUESTION, CALL, due callback, STOP, identity mismatch, stale context, CONTROL) must run against the canonical Action Quality projection when integration is enabled. They are **not certified by the general-mode tests**. Client-forged identity/action and stale thread tests only verify today's disabled boundary.

Metrics: in-memory capture readiness/chat timings and provider first-token/elapsed/usage fields, without content telemetry. No measured native Windows baseline, completed task rate or dollar-cost claim. Establish p50/p95 and a model-price configuration after synthetic Windows trials.

Explicit non-goals: passive monitoring, computer control, auto-send, CRM writes, policy binding, mobile/macOS, extension, billing, new business/domain, provider conversation-library synchronization and unreviewed production deployment.

## Official implementation references

- https://developers.openai.com/api/docs/guides/images-vision
- https://developers.openai.com/api/docs/guides/conversation-state
- https://developers.openai.com/api/docs/guides/your-data
- https://developers.openai.com/api/docs/models/gpt-4.1-mini
- https://www.electronjs.org/docs/latest/tutorial/security

See `apps/desktop-copilot/README.md` for build, gateway setup, installation and cleanup.

## Session verification record

- Desktop automated suite: 25 passed, 0 failed, 0 skipped.
- TypeScript check, React/Vite build and Electron esbuild bundles: passed.
- Renderer + real gateway smoke: 8 checks passed (review gate, actual PNG redaction bytes, saved routing, simulation response, renderer restart/resumption, append to existing, removal, rename). Native capture IPC was mocked.
- Existing main suite repeated unchanged: 328 tests, 327 passed, 1 failed, 0 skipped (pre-existing AgencyZoom wording assertion documented above).
- Local NSIS attempt failed at Wine execution, ENOENT. Windows CI contains packaging and a native Electron smoke test; its outcome must be inspected separately.
- No live OpenAI call, no RingCentral login/capture, no customer-data transmission, no CRM read/write or external messaging was performed.
