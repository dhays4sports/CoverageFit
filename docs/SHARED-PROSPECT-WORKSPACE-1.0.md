# Shared Prospect Workspace 1.0

Mandate COVERAGEFIT-SIGNAL-SHARED-PROSPECT-WORKSPACE-1.0. Stacked on PR #40, commit 1a6e4f1f8e6c125a38e2dc3b85de509bfb2f9ae4. Main inspected at 29b5839ab23eabfd663975d0fa1014655b5ef88c. No merge or production activation authorized.

## Result and contracts

Primary CoverageFit Work and the legacy detail view expose the same customer/opportunity-linked shared evidence. Work adds Overview, Evidence, Commitments, Transcripts, Drafts and History, with source dialogs. Prospect Desk 0.3.0 reads the same revision and lets the producer inspect selected additions before saving. Local conversations and unapproved images stay local. Each desktop thread pins its opportunity independently.

No competing identity, queue or action engine is introduced. Canonical shared updates and image chunks use migration 0020 from PR #40. Canonical tasks use cf_solo_tasks. Identity links require existing explicit IDs. Name/contact matches are not merged. The current branch has no active Action Quality recommendation contract; the new panel explicitly reports unavailable and preserves existing governed/manual Work controls. Carrier eligibility and binding readiness are never inferred.

Summaries cover a SHA-256 material-evidence revision including identity links, reviewed status events, relevant source changes and canonical task states. A summary is current only for that revision. Corrections append supersession; originals remain readable. Verification, freshness, record approval, wording approval, task state and delivery stay independent. Property estimates remain tentative. Timing agreement is explicit metadata; a scheduled task is not proof of an agreed appointment.

Web review persists an immutable approval attempt before transmission, requires the matching server receipt, and retries unchanged after an uncertain result. Definitive stale rejection retains draft text and requires a new review. Desktop persists the equivalent attempt across restarts, blocks changed selection, and invalidates unsubmitted reviews after corrections/captures. Server snapshot comparison and unique request ID make retries duplicate-safe.

Queues read the same evidence and canonical tasks. They inspect at most 25 opportunities per page, label this bounded coverage, distinguish failed reads from empty matches, and count policy/opportunity records (not unique people or individual gaps). Existing Work retains overall governed priority. Transcript excerpts are manually attached, explicitly complete/partial/missing/unverified; no live sync is implied.

## Isolated preview

Cloudflare Pages production is still main and automatic production deployment is enabled. Merging main publishes coveragefit.com: do not merge casually. Production D1 is 930e2072-752a-42f7-8ae0-e2e280ca3a46; preview D1 is f5ac694d-1028-4a30-9fbd-c264b2e5995e. Migration 0020 was applied only to preview.

New preview-only variables CF_SHARED_WORKSPACE_PREVIEW, CF_SHARED_WORKSPACE_PREVIEW_ID and separate secret desktop/producer credentials activate this branch's dedicated preview:shared-workspace:20261114 scope. Existing preview workspace/flags and production variables were preserved. Runtime activation additionally requires BUYER_STAGING_ISOLATED=1. AI, SMS and calendar actions remain off. No new OpenAI key was created. Reuse the owner's existing key through desktop encrypted settings.

?example=1 shows synthetic prefix-filtered read-only examples through a GET-only endpoint. It neither authenticates mutation nor loads private acceptance rows. Demo profiles are marked workspace_example_readonly; the service rejects writes. Examples must never be copied into the real workspace.

## Verification and release gates

Baseline full backend suite at PR #40: 412 tests, 411 pass, one AgencyZoom wording failure (test expects “48 hours”; current policy returns “outside 7 days”). It also reproduces on inspected main. Do not change policy to satisfy the stale wording assertion. New integration checks cover summary revisions, corrections, explicit policy targets, status separation, ambiguity, bounded queues, isolation and web receipt recovery. Desktop tests cover persistence, screenshots, review, canonical identity selection, stale review and interrupted receipt recovery.

Windows CI packages the ZIP and starts the actual packaged process. This is separate from interactive Windows capture, mixed-DPI monitors, tray/shortcut behavior and live-provider acceptance. Those require the owner's Windows laptop. Mocked model replies do not certify live OpenAI behavior. No real-customer processing is activated. Hosted acceptance and exact final commits are recorded in the PR/release report.

## Rollback

Before production approval, rollback consists of disabling CF_SHARED_WORKSPACE_PREVIEW in preview (or removing the dedicated CF_SHARED_WORKSPACE_* variables), and closing the stacked PR. Do not modify production bindings, existing preview credentials or unrelated flags. Preserve approved evidence and audit history; no destructive down-migration is needed. Desktop: close 0.3.0, preserve its workspace/backup, then reinstall the prior build. Do not discard unresolved approval receipts. Never reuse a preview credential in production.

Production release requires reviewing PR #40 and this dependent PR, refreshed main/CI, a production schema/credential/flag plan, producer acceptance on Windows, rollback ownership and explicit final release authorization. Main auto-publishes. No release is authorized by an approved fact, draft or task.

## Pilot baseline

No improvement claim yet. Before pilot exposure, measure 10 sanitized representative resumptions: time from open to correctly stating situation/selected policy; time to open supporting evidence; repeated questions for already-recorded facts; missed promised follow-ups in the review period. Record task difficulty, evidence availability, median and range. Repeat the same cases after familiarization and separately track live pilot misses. Existing district measures remain unchanged. Synthetic tests certify behavior, not producer time savings.

## Protected hosted acceptance

Cloudflare Access email-code sign-in was verified for the preview. The ordinary desktop API additionally needs machine access through that Access layer: a browser session does not configure a standalone Windows app. Prospect Desk now provides an owner preview sign-in window and uses Electron’s cookie-aware network session. After sign-in, the main process pairs the existing scoped desktop credential, validates its origin/workspace, and encrypts it with safeStorage. The server verifies Access RSA signature, issuer, audience, expiry and configured owner email before returning any credential. No credential reaches the renderer, chat, logs or exported workspace. Interactive laptop acceptance remains separate; no Access policy was weakened or changed.

The preview-only acceptance page runs the actual deployed desktop and producer handlers against fixed cfsw_acceptance_* identities and the real preview D1, then reports receipts, idempotency, policy separation, material revisions, source integrity and canonical tasks. It accepts no record IDs or content from the caller, requires same-origin POST, a cryptographically verified owner Access assertion, exact dedicated scope and CF_SHARED_WORKSPACE_ACCEPTANCE=1. It exports no credentials and contacts no providers. Disable that preview variable after engineering acceptance; it is never a production feature. This is deployed-handler verification, not a claim that the Windows client has authenticated through Access.

Synthetic read-only examples are generated by scripts/shared-workspace-examples.mjs using the same canonical approval service. Only dedicated preview prefix records are loaded. Their policy image contains no real customer or carrier data.

Pairing configuration adds only CF_SHARED_WORKSPACE_ACCESS_ISSUER, CF_SHARED_WORKSPACE_ACCESS_AUD and CF_SHARED_WORKSPACE_OWNER_EMAIL in preview. Rollback can remove these alongside the other CF_SHARED_WORKSPACE_* variables. The pairing endpoint is preview-only and fails closed on invalid, expired or forged assertions.

Queue timing uses the producer’s Pacific calendar day (including later-today and overdue tasks). Material changes cover the last seven days. Native evidence and cached overview are filtered to the thread’s pinned opportunity; another thread’s refreshed cache cannot be presented as this policy.

Private Work preview uses a one-hour Secure, HttpOnly, SameSite=Strict host cookie issued only after cryptographically verified owner sign-in and same-origin POST. Existing producer authorization compares that cookie through the same token check, only in the dedicated isolated preview. Production bearer authentication is unchanged. The browser never sees a producer secret in JavaScript. External source sync/import is blocked in this new synthetic scope; existing preview and production scopes are unchanged.

Final local backend run: 429 tests, 428 pass, sole unchanged AgencyZoom wording baseline failure. Desktop: 22 tests pass. The packaged ZIP source was compared with src/main.js and src/renderer.js and matched. Interactive Windows owner sign-in, capture, mixed-DPI, tray and shortcut acceptance and live OpenAI use remain owner-laptop gates. No production or real-customer pilot is activated. Exact hosted receipts, CI run, deployment and final commit are recorded in PR #41.

Desktop upgrade recovery reuses a previously persisted approval payload byte-for-byte, including payloads created before the new metadata fields existed. New review metadata is never silently appended to an uncertain old request. Selection, identity and payload integrity are rechecked before replay.
