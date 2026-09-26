# Signal Continue 1.0 — implementation and certification

Status: locally implemented; production activation and internal provider canary remain gated. This is an evidence channel within ASK_ONE_QUESTION, not a new Decision 2 action. Existing priority weights, cohorts, RAW governance, AgencyZoom ownership, and review-first SMS are unchanged.

## Primary producer trigger

An initial call reaches a prospect with interest, but meaningful discovery cannot continue: busy, limited time, interested but not ready, asks Dylan to send something, or explicitly prefers asynchronous continuation. The producer confirms interest and the prospect's preference before preparing a draft.

A clear near-term callback keeps CALL. A clear future date keeps LATER / FUTURE_BIND. A link is not a substitute for an already-clear next action. Unknown ownership, CONTROL, urgent/action requests, quote-ready, suppression, wrong number, and existing Farmers confusion are ineligible.

## Architecture and storage

- Existing `sms_handoffs` stores scoped continuation sessions. Existing `cf_solo_sources` and `cf_solo_activity` retain same-opportunity evidence/provenance and activity. Existing SMS relationship stores the current action; no second opportunity or lead is created.
- 32 random bytes produce a 43-character URL-safe token; SHA-256 is used for lookup. The secure URL is `/s/<token>`. Seven-day absolute expiry is enforced server-side, including inside mutations; revocation and external suppression invalidate access.
- The producer draft necessarily contains the bearer URL for review/send; it is accessible only through producer authentication. The lookup key is hashed. Never log or export drafts/tokens into pilot analytics. A forwarded bearer link grants access to the bounded questions until expiry/revocation; it is not identity verification.
- The same per-conversation exclusive lock used by SMS processing protects creation, submission, editing and approval. Session revision rejects stale answers; conversation revision rejects stale approvals and answers after new inbound evidence. Uncertain provider delivery enters delivery review and cannot be blindly retried.
- Public POST uses exact same-origin checking, bounded JSON, field allowlist, existing fail-closed D1 rate limiting, and no-store responses. No internal IDs, scores, ownership or known PII appear in public responses. Pages `_redirects` proxies the short route to a lightweight static page; `_headers` applies no-referrer/noindex/CSP.
- No migration, new database, new token secret, or reapplication of 0019 is required.

## Evidence and decisions

Known governed RAW facts, fresh paired SMS facts, current structured SMS facts, and recent canonical lead context hydrate the flow. Historical RAW intent is excluded. Passed dates do not remain current timing. Existing canonical Signal Decision chooses questions; no local/second scoring engine is introduced.

Personal-lines V1 supports AUTO and HOME; HOME_AUTO follows the Home-first shared context. Carrier, renewal and vehicle collection are not repeated. Submitted choices retain source `signal_continue` and observation time. Fresh submitted context uses the existing evidence-source projection on the same opportunity; canonical Opportunity Priority is recalculated without weight changes. Existing RAW source is retained unchanged.

The hard ceiling is six answered questions. The main tested complete path answers two questions: renewal/price change, then actively comparing, and stops CALL / HIGH. Research/future exits LATER; explicit call/quote/urgent choices interrupt immediately; negative exits CLOSE; opt-out uses the existing suppression primitive and exits STOP. No completion alone earns high intent.

Submitted answers survive abandonment and resume. Valid sessions recalculate from current evidence; unsent drafts are inaccessible to prospects. No reminder, automatic link, or autonomous conversational SMS is sent. During active continuation, competing Signal qualification drafts/sends are held; explicit inbound CALL/LATER/CLOSE/STOP can interrupt.

## Producer workflow

Work → SIGNAL opportunity → Continue async → Review check-in option. Known facts remain visible in the same detail. Select the interrupted-call reason and confirm interest/preference; prepare the draft, review it, save any edit, and Approve & send. Unsaved edits cannot be silently bypassed by approval. Revoke is available. Completion updates the same detail with one next action and an alert, not another task.

Busy script: “No problem. I can text you a really short link so you can answer a few things whenever you have a minute. I’ll pick up from there so you don’t have to repeat everything.”

Low-interest script: “No worries. If you’d like, I can send you a quick link so you can answer a few things on your own time, and I can see whether it’s even worth us reconnecting.”

Default SMS: “Thanks for your time. Here’s the quick link I mentioned — it should only take a minute or two, and I’ll pick up from what you already told me: [secure link]”

Do not use for CONTROL. WEB / DIRECT remains on its existing first-party journey in this initial implementation: no new link is offered without a supported exact relationship and a safe way to exclude an active intake. OTHER and UNKNOWN are blocked. Producer takeover is retained; an eligible underlying SIGNAL relationship requires explicit producer selection.

## Measurement

Analytics → Signal Continue reports offered/sent/opened/started/completed/expired sessions, completion rate, median answered questions, expired-started abandonment, CALL/LATER/CLOSE after completion, dated quote-ready/quote/bind outcomes, recipient effort completeness, minutes/useful completion and send-to-completion time. Delivery is unavailable. Missing effort stays null. It is a descriptive SIGNAL subtype, not a randomized sub-arm or a causal effectiveness estimate. Valid unfinished sessions are not called abandoned.

Limits: no separately attributed self-serve producer-time ledger; existing complete opportunity effort is used. Outcome dates/review can be missing. No before/after score movement is interpreted as economic lift. No measured human-admin timing claim is made; the under-20-second target still requires Dylan's actual rehearsal.

## Verification

The dedicated suite covers token entropy shape/hash/scope/TTL, CONTROL service/preview denial, known RAW/SMS reuse, primary-trigger exclusions, two-answer early stop, explicit interruptions, STOP suppression, provenance, same-opportunity persistence, canonical priority refresh, no-send creation/edit, exactly-once mocked approval, revision conflict, uncertain delivery, abandon/resume, external STOP, shared locks, field privacy, public origin/flag gates, and null-aware descriptive analytics.

Provider responses in local tests are synthetic. They do not certify actual RingCentral delivery, mobile hosted behavior, or producer time. No customer was messaged or enrolled for certification. The existing pilot's prior provider/timing gates remain outstanding.

## Manual activation checkpoint — do not change other SMS flags

| Project | Environment | Setting | Type | Value / rollback | Why / verify |
|---|---|---|---|---|---|
| CoverageFit | Production | SIGNAL_CONTINUE_ENABLED | Variable | Activate `1`; rollback `0` or unset | Enables authenticated producer creation and the bounded public session API. After the next deployment, Continue async preview should load. Keep all other SMS flags unchanged. |

Do not paste any secrets. No new secret or D1 migration is requested. Do not activate until the source release and disabled hosted shell are verified. After manual activation, use an approved internal/user-controlled exact relationship for the canary, and obtain approval for the exact SMS before provider send. Existing TEST enrollment is intentionally outside the production population; do not contaminate NEW_LEAD denominators by silently relabeling synthetic records. A governed isolated test relationship is still a live-certification dependency.

Required hosted proof: producer draft/edit does not send; approve sends once; mobile opens; known facts are not reasked; two useful answers stop; same opportunity and producer receipt update; STOP and stale revisions remain safe. Consumer success alone is insufficient.

## Future seam (documentation only)

Missing evidence → cheapest appropriate channel → new evidence → recalculate. SMS, this check-in, producer calls, email and potential future voice may later participate. V1 has no automatic channel selection and no autonomous reminders.

## Release evidence

Starting production main: `7b3049cad05b5c6073d450c27cfaf5bbd3d69153`. 408FARMERS remains `78660e8b5614ba4252af3ba55f35a543ccae21a1`, unchanged. Implementation branch: `signal-continue-1.0`.

Local full suite: 256 passed, 0 failed, 0 skipped, including 25 dedicated continuation tests. Syntax: 425 JS/module/CommonJS files clean. No local Wrangler Functions build has been certified in this environment. Runtime hosted checks and provider delivery remain separate gates.

Readiness: PASS locally for token/evidence/CONTROL and review-first mocked behavior; PASS WITH LIMITATION for exact-linked personal-lines district scope and descriptive measurement; BLOCKED for hosted full canary, broader first-party continuation, and measured producer administration. District pilot GO is not granted by this release.
