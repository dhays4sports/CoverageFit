# CoverageFit Current State

## Producer Action Quality 1.0 started — 2026-10-08

The current branch now contains the first deterministic reconciliation layer for producer action quality.

Audit conclusion:
- Attention owns **why now**;
- Signal Decision 2 owns the current governed SMS disposition;
- Opportunity Priority owns scarce-attention allocation from Need / Intent / Timing / Fit;
- Commitments own recorded obligations/timing;
- NBA owns broad opportunity-level next action;
- before this slice, these could all be individually valid but still leave the producer to resolve conflicts manually.

New module:
- `server/producer-action-quality.mjs`
- canonical doc: `docs/COVERAGEFIT-PRODUCER-ACTION-QUALITY-1.0.md`

The projection returns:
- **Why now**
- **Exact action**
- **Supporting evidence**
- explicit precedence used to resolve collisions.

Current precedence:
1. contact safety;
2. Signal STOP / CLOSE / LATER;
3. due/overdue confirmed commitment;
4. current Signal Decision 2;
5. upcoming confirmed commitment;
6. NBA.

Opportunity Priority remains supporting evidence unless consumed by Attention/NBA. It never directly grants contact authority.

Producer Work list/detail now expose the projection behind the existing Attention gate. Actionable rows render:
- Why now;
- Do;
- Evidence.

Important collision discovered during integration:
- a fixture produced Attention NOW from an explicit call request while the current Signal Decision 2 remained ASK_ONE_QUESTION;
- the reconciliation correctly kept **ASK_ONE_QUESTION** as the exact action rather than silently converting urgency into CALL;
- the test was corrected; runtime precedence was not weakened.

Fresh CI at head `f38dab62b31be43a5a2a4aa5f08bf2aa8e498a26`: **463 passed, 0 failed, 0 skipped**.

Next gate: isolated Preview certification of list/detail consistency for ASK_ONE_QUESTION, CALL, due commitment and STOP/suppressed cases. No new AgencyZoom write, calendar write, autonomous send or provider authority is introduced by this slice.

## Attention Preview certification complete enough for operational gate — 2026-10-07

Hosted Preview certification now proves the intended producer-attention boundaries:
- 100 TEST rehearsal records are excluded from normal Producer Work;
- legacy synthetic NEW_LEAD QA fixtures are excluded by durable `pilot.synthetic=true` provenance, not by display name;
- generic NORMAL fallback remains non-actionable;
- CONTROL receives no Attention guidance;
- deterministic canaries cover NOW, TODAY, HIGH, SUPPRESSED and CONTROL precedence;
- a fresh unanswered inbound outranks HIGH and correctly becomes NOW;
- suppression/STOP is non-actionable.

The previous hosted inventory result before the legacy synthetic exclusion was `total=1`, `NORMAL=1`, `actionable=0`; that remaining record was confirmed by direct detail to carry `pilot.synthetic=true`.

Fresh CI at head `8150103c204403db5737723b1fd24afb750ccb69`: **454 passed, 0 failed, 0 skipped**.

Next hosted checkpoint: deploy this head with `CF_ATTENTION_ENABLED=1` and verify normal Producer Work returns zero synthetic QA/test records. If clean, the Attention feature can remain Preview-enabled while the next roadmap work focuses on real operational evidence and producer action quality.

## Attention certification tightened: TEST inventory excluded — 2026-10-07

Hosted Preview showed the corrected Attention model with 100 synthetic rehearsal records carrying no guidance, but they still cluttered Producer Work. That is now resolved.

Normal Producer Work now:
- excludes `pilot_phase: TEST` / `is_test: true` records from list totals, counts and ranking;
- reports `test_excluded` so the exclusion remains visible and auditable;
- keeps direct record detail and intake receipts/evidence available for TEST records;
- keeps fallback `NORMAL — Review current evidence` non-actionable unless stronger work evidence exists.

This preserves the product distinction between audit/test evidence and operational producer work. Synthetic rehearsal records cannot consume producer attention merely by existing.

Fresh CI at head `6867613072ca87811be5c1444e7da11c702cfdf6`: **452 passed, 0 failed, 0 skipped**.

Next hosted checkpoint: deploy this head with `CF_ATTENTION_ENABLED=1` and re-run Producer Work. Expected result is approximately the real non-test inventory only, with the 100 rehearsal records excluded from `total` and `top_10`.

## Producer Attention surfaced in Workspace — 2026-10-07

The deterministic Attention layer is now surfaced in `/agent/workspace/` behind the existing default-off `CF_ATTENTION_ENABLED=1` gate.

When enabled, Producer Work now exposes:
- aggregate Attention bands for the current result set: NOW, TODAY, HIGH, UPCOMING, WAITING, NORMAL and SUPPRESSED;
- actionable count;
- Recommended, High intent, Due now, Newest and Baseline sorts;
- the evidence-backed Attention reason directly on each work row;
- the same Attention reason in opportunity detail.

Safety/governance remains unchanged:
- DISTRICT_CONTROL receives no Attention guidance;
- STOP, opt-out, wrong-number and suppression states remain non-actionable;
- Attention is deterministic orchestration, not contact permission or bind probability;
- AgencyZoom remains CRM authority and no stage is written by Attention;
- the feature remains default-off until hosted Preview certification.

Fresh CI at runtime head `b9ae9bb2ebf36ec7af23b2120b8ce4201c2eecf9`: **447 passed, 0 failed, 0 skipped**.

Next hosted checkpoint: deploy the current branch to isolated Preview with `CF_ATTENTION_ENABLED=1`, load Producer Work, verify summary/sorting/reasons against real Preview inventory, and confirm CONTROL and suppressed records never receive actionable guidance.

## RAW Import switched to resumable chunking — 2026-10-07

Hosted certification is complete enough to make the ingestion architecture decision.

Observed failure mode:
- 100-row synchronous preview succeeded;
- 100-row synchronous commit returned 503 after **30 rows had already committed**;
- lightweight status proved the exact partial state: 30 present, 70 missing.

Hosted recovery:
- rows 30–39: 10/10 imported, 0 duplicates, 0 review exceptions, 0 SMS, 1,581 ms total / 933 ms preparation;
- subsequent 10-row chunks advanced imported TEST rows to 50, 60, 70, 80, 90 and 100;
- final status: `complete=true`, `next_missing=null`, no missing ordinals.

The normal Import UI has now been migrated from `raw-import` one-shot writes to resumable 10-row `raw-import-chunk` writes. On a transient failure, the UI stops at the current chunk and presents **Resume import**; replaying that chunk safely deduplicates any rows that committed before failure.

Chunk processing also now:
- persists true review exceptions;
- reports actual batch-imported count from attribution evidence;
- writes durable per-chunk receipts;
- finalizes a durable batch receipt on the last chunk.

Fresh CI at runtime head `818742a38581333e86c439b47a79f6fd76550137`: **446 passed, 0 failed, 0 skipped**.

The old one-shot endpoint remains available for compatibility/small internal callers, but it is no longer the intended UI path for normal multi-row RAW imports.

## Resumable raw intake after hosted partial commit — 2026-10-07

Hosted certification proved that a 100-row synchronous write is not an acceptable ingestion primitive: the original synthetic commit returned HTTP 503 after **30 of 100 TEST rows** had already committed (18 SIGNAL / 12 CONTROL assignments). Stable source identity made the partial write recoverable and observable.

The active branch now contains a resumable chunk path:
- `commitChunk` commits a bounded 1–20-row slice; certification uses 10 rows;
- preparation limits database ownership/duplicate checks to the active slice while still parsing/validating the exact source batch;
- each chunk persists a receipt with start, limit, next start, timing and result counts;
- replaying an already committed chunk resolves to duplicates rather than duplicate opportunities;
- synthetic rehearsal status reports exact present/missing ordinals and the next missing row;
- TEST rehearsal rows skip Opportunity Priority refresh, avoiding production-only projection work during throughput certification;
- `/api/solo-desk/raw-rehearsal` supports `commit_chunk` for Preview certification;
- generic `/api/solo-desk/raw-import-chunk` is present for the later production UI migration, but the existing Import UI has not yet been switched from one-shot commit.

Fresh CI at branch head `55b8b52df522bbe1ecf269c762c77530955ef23e`: **444 passed, 0 failed, 0 skipped**.

Next hosted checkpoint: deploy this head to isolated Preview, re-read the original failed batch, then resume only missing ordinals in 10-row chunks. Do not retry the old 100-row one-shot commit.

## 100-row intake rehearsal readiness — 2026-10-07

A default-off hosted certification path now exists for the current RAW intake architecture.

- `syntheticRawRehearsalBatch` generates exactly 100 deterministic synthetic records using reserved 202-555-0100 through 0199 numbers.
- `/api/solo-desk/raw-rehearsal` is unavailable unless `CF_RAW_SYNTHETIC_REHEARSAL_ENABLED=1`.
- The endpoint uses the real importer with `synthetic:true`, requires producer authentication/same-origin mutation controls, creates TEST rather than real pilot inventory and sends zero SMS.
- CI now includes an end-to-end 100-row synthetic importer rehearsal.
- Latest full suite: **442 passed, 0 failed, 0 skipped**.
- The 100-row in-memory rehearsal test itself completed in approximately **124 ms**. This is not hosted D1 latency.
- Both push and PR CI paths passed on the rehearsal implementation.

Hosted Preview measurement remains the next operator checkpoint. Canonical steps are in `docs/RAW-LEAD-HOSTED-CERTIFICATION-1.0.md`.

Do not increase the synchronous row limit until Preview records `preview_duration_ms` and `import_duration_ms` for the 100-row canary.

## Durable intake exception queue update — 2026-10-07

RAW-LEAD-INTAKE Slice B is now implemented on the active branch.

After a confirmed import:
- CoverageFit writes a durable batch receipt with imported/duplicate/review/pilot/SMS-link counts;
- true review exceptions are persisted separately as bounded exception records;
- exception records support OPEN, DEFERRED and RESOLVED dispositions;
- the Import UI loads unresolved exceptions independently from successful rows;
- recent batch receipts remain visible;
- exception persistence intentionally excludes raw CSV bodies and phone values;
- successful/duplicate rows do not become unresolved exception work.

Slice C instrumentation is also present: preview responses expose `preview_duration_ms`, and receipts persist `prepare_duration_ms` plus total `import_duration_ms`. These measurements are intended for hosted 100-row timing before any batch-size increase.

CI was strengthened with explicit syntax checks for critical importer/workspace/API modules. A syntax regression introduced during this slice was caught by CI and corrected before hosted certification. The corrected branch push suite passed **441/441**, and the initially scheduler-sensitive PR concurrency test passed on rerun **441/441**. No runtime concurrency guard was weakened.

No production configuration, customer send, AgencyZoom write, calendar write or schema migration was enabled by this slice.

## Fresh full-suite certification — 2026-10-07

GitHub Actions now runs the repository's full Node test suite on every push / pull request using Node 24.

Current active branch head at certification: `a77e1429a2fc757429469e8bc3cc770a64fc26be`.

Fresh CI result:

**440 passed, 0 failed, 0 skipped**  
Duration reported by Node test runner: approximately **2.18 seconds**.

The first CI attempt failed before tests because Node 22 did not support the historical `--test-isolation=none` option. CI was corrected to Node 24; both the push and pull-request runs then completed successfully.

This fresh suite includes the recent:
- Producer OS promotion race-safety reconciliation;
- Commitment/Attention foundations and current-head read-only workspace integration tests;
- raw intake machine-triage tests;
- audited CONTROL-enrollment-pause test;
- current Copilot/RingCentral/SMS safety regressions.

This is repository test certification, not hosted Cloudflare behavior certification. Hosted CONTROL/OTHER/wrong-number denial checks, current environment matrix review and Preview inbound-webhook certification remain separate gates.

## Raw lead intake / triage update — 2026-10-07

The first RAW-LEAD-INTAKE-1.0 slice is now implemented on the active branch.

New behavior:
- deterministic preview triage separates READY, READY_NO_SMS, SAFE_HOLD, DUPLICATE and true review exceptions;
- review exceptions are classified into identity, schema, time, bounded-field and other buckets;
- the Import UI leads with true exceptions and collapses validated/held/duplicate rows;
- preview returns aggregate triage counts so producer attention is measured in exceptions rather than total rows;
- a default-off `CF_DISTRICT_CONTROL_ENROLLMENT_PAUSED` capability can route newly eligible deterministic CONTROL assignments to operational SIGNAL while preserving `assignment_cohort` and an explicit override reason for audit;
- historical CONTROL records are not relabeled;
- import still sends zero SMS.

The synchronous 100-lead batch limit remains intentionally unchanged until hosted latency is measured. Higher throughput should be achieved without creating timeout/retry ambiguity.

Canonical intake contract: `docs/RAW-LEAD-INTAKE-1.0.md`.

Fresh full-suite execution is still outstanding. GitHub currently exposes no Actions/check run for the active PR head, and the local container cannot reach GitHub to clone the repository; therefore no new test-pass count is claimed.

## Security/data gate update — 2026-10-07

A current-source security review has been formalized in `docs/COVERAGEFIT-SECURITY-DATA-GATE-1.0.md`.

Key conclusion: existing RingCentral/Copilot/action code has meaningful fail-closed controls, but producer authentication is still a single long-lived bearer key stored in browser `sessionStorage`. This remains acceptable only for the bounded single-producer Preview/early-production phase. Multi-producer access or materially broader external-write authority is now gated on per-user/short-lived session authentication and stronger browser-session controls.

The review also records required gates for:
- current-tree environment inventory and Preview/Production matrix;
- runtime secret-exposure review;
- Producer Workspace CSP/browser hardening;
- RingCentral inbound webhook/subscription security;
- platform-wide retention classes;
- AgencyZoom write-integrity/reconciliation;
- fresh full-suite evidence.

The source-only environment inventory generator has been ported to the active branch at `scripts/environment-contract-inventory.py`. No deployed secret values were read or stored.

Development may continue on read-only intelligence, governed raw-lead ingestion, durable evidence and Attention while these gates are completed. New multi-user identity authority and broader external writes remain deferred.

## Read-only Attention integration update — 2026-10-07

The active `signal-copilot` branch now contains the standalone Commitment Projection and deterministic Attention Priority foundation from PR #8, plus a **surgical current-head Producer Workspace integration** behind `CF_ATTENTION_ENABLED=1`.

The integration was reimplemented against the current Copilot branch instead of copying PR #8's stale workspace wholesale. When the flag is absent/off, baseline Work sorting and behavior remain unchanged. When enabled, the workspace may return read-only commitments, Attention projections and optional sorts (`recommended`, `high_intent`, `due_now`, `newest`). DISTRICT_CONTROL receives no Attention guidance. Suppression checks include opt-out, STOP, wrong-number and explicit opt-out facts.

No calendar mutation, Google write, AgencyZoom write, customer message, migration or production flag was enabled.

Regression coverage was added for the default-off behavior, CONTROL exclusion and invalid sort rejection. These tests have **not yet been freshly executed on the current full tree**; full-suite certification remains a Phase 0 gate.

## PR #8 reconciliation update — 2026-10-07

The remaining PR #8 work has been triaged rather than merged wholesale.

**Ported now:** standalone read-only `commitment-projection.mjs`, deterministic `attention-priority.mjs`, and their regression tests.

**Reimplement against current head:** Producer Workspace integration for commitments/Attention. The old PR #8 workspace is stale relative to the hosted-certified Copilot branch and contains integration assumptions that should not overwrite current behavior.

**Deferred:** calendar mutation/UI and related external Google write paths until read-only Attention/Commitment integration is clean and the AgencyZoom/data-governance authority gate is satisfied.

**Regenerate:** environment-contract inventory from the current tree; do not treat PR #8's generated inventory as current evidence.

No new production flag, migration, customer action, AgencyZoom write or calendar action was enabled by this reconciliation.

## Phase 0 stabilization update — 2026-10-07

PR #6's unique district-promotion race-safety behavior has now been reconciled into the active `signal-copilot` branch rather than leaving it stranded on a divergent PR.

Reconciled behavior:
- promotion preview fingerprints the exact source snapshot;
- each promotion attempt gets an operation ID;
- dependent activity/SMS ownership writes execute only if the exact compare-and-swap promotion succeeded;
- a lost compare-and-swap returns `SKIPPED_CHANGED` without ownership, audit or priority side effects;
- transaction failure remains fail-closed;
- regression coverage for SIGNAL and CONTROL promotion, stale evidence, lost compare-and-swap and rollback has been added;
- the Producer OS foundation architecture reference is now present on the active branch.

This is source reconciliation, **not fresh full-suite certification**. Historical PR #8 evidence showed these regressions passing in its older stacked tree, but the current PR #7 head still requires a fresh complete test run after all recent Copilot and documentation changes.

Next Phase 0 work: audit the remaining unique PR #8 commitment/attention/calendar changes against the now-current PR #7 tree; port only compatible increments; complete hosted denial/security checks; then obtain fresh full-suite evidence before merge/production authority changes.

## Roadmap direction override — 2026-10-07

CoverageFit's near-term strategy is now: **intelligence and attention operating layer first; CRM replacement only if earned later.**

AgencyZoom remains the current CRM authority where agency workflows depend on it. CoverageFit must not silently become a second conflicting CRM. New CRM-like authority is gated by `docs/AGENCYZOOM-COEXISTENCE-DATA-GOVERNANCE-1.0.md`.

Forward sequence:
1. finish Phase 0 stabilization and hosted safety;
2. reconcile Producer OS foundation with current Copilot/commitment work;
3. complete AgencyZoom coexistence and data-governance rules before new CRM-like writes;
4. improve raw-lead intake and evidence normalization;
5. build durable conversation state and commitments;
6. build Attention Priority / Recommended / High Intent / Due Now;
7. expose calendar actions and connect them to commitments/attention;
8. certify RingCentral inbound webhook/subscription handling;
9. add call intelligence;
10. expand governed document/visual evidence and Producer Context;
11. mature Signal and bounded producer-approved actions.

Operational North Star: **turn a large pile of raw leads into a very small number of things the producer actually needs to do.**

Existing CONTROL history and cohort capability are preserved. New CONTROL enrollment may be reduced or paused during production crunch; historical records are not retroactively relabeled.

## Current certification override — 2026-10-06

Latest audited PR #7 head: `640285435fc0dd166c3f220c318fed82514db9ea`; still draft/unmerged. Main remains `5f47f2b7367110ca04ff03cc189983f136ab32fa`. This override supersedes older hosted-certification summaries below.

Hosted Preview certification materially advanced on isolated `coveragefit-signal-preview` using synthetic opportunity `copilot-preview-qa-001` and an operator-controlled mobile recipient only. The following are now operator-proven in hosted Preview: real OpenAI Suggest generation; bounded validation and safe diagnostics; Use This selection; pending-draft persistence; stale approval rejection after source evidence change; explicit one-send approval; actual RingCentral SMS receipt on the operator-controlled phone; and duplicate/replayed approval rejection with HTTP 409 and no second send.

The hosted 409 investigation produced bounded fixes without weakening authority: resilient Copilot usage metrics, safe validation-field diagnostics, normalized literal evidence matching, canonical boolean normalization, redundant-known-fact suppression, and deterministic Copilot version advances through `SIGNAL-COPILOT-1.0.4`. Historical failed request records were preserved.

RingCentral outbound Preview configuration is now verified with a JWT belonging to the authenticated producer extension: `outboundConfigured=true`, configured from-number found, `SmsSender=true`, and `senderReady=true`. A controlled outbound SMS from +1 *** *** 6377 to the operator-controlled test phone was received. A replay of the consumed approval was rejected with 409 and produced no duplicate message.

Preview RingCentral webhook configuration remains intentionally incomplete: `RINGCENTRAL_WEBHOOK_URL` and `RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN` are absent, so inbound subscription/webhook readiness is not certified. Production configuration, production AI, customer messaging, AgencyZoom automation and main remain unchanged.

Remaining Phase 0 hosted/safety work: direct authenticated denial checks for CONTROL/OTHER/unsupported populations and held/wrong-number states; full runtime secret-exposure review; fresh full-suite test evidence; PR #6/#7/#8 reconciliation; canonical roadmap/current-state cleanup. Do not treat the successful synthetic send as production rollout authorization.

## Current certification override — 2026-10-05 16:22 PDT

Latest audited PR #7 head: `9ef8c793d4c8ee9c8c3a22c703f3da98cfbe854b`; still draft/unmerged. Main remains `5f47f2b7367110ca04ff03cc189983f136ab32fa`. This documentation update changes no runtime code.

Operator-tested preview is `f1777403.coveragefit.pages.dev` with isolated `coveragefit-signal-preview`. Generation, revision, Use This/save/reload, stale-selection rejection, basic mobile/focus, STOP/suppression/opt-out UI checks and synthetic fixture restoration are confirmed. Real-provider sample: four completed requests and one unsupported_evidence rejection; successful average 8.896s; total estimated cost of five usage-bearing rows $0.009522. Not provider billing or a broad quality certification.

CONTROL hosted testing was explicitly deferred. Hosted direct API/unsupported-population enforcement, explicit controlled SMS delivery/duplicate-send/stale-approval checks, full runtime secret-exposure review and final full-suite rerun remain outstanding. PR #7 is not certified for production AI or merge. No production changes or real customer messages. Full evidence and limitations: latest section of `docs/SIGNAL-COPILOT-1.0.md`.

Cloudflare is a manual operator checkpoint. Do not repeat inaccessible dashboard login attempts. Preview CF_SMS_SIGNAL_ENABLED=1 enabled the existing draft path; this is not itself a sandbox transport. No RingCentral credentials were added for certification. Historical sections below describe earlier snapshots; this override controls current Copilot readiness.


**Document:** COVERAGEFIT-CURRENT-STATE  
**Status:** Canonical operational handoff for active development  
**Last audited:** 2026-10-05 (preview follow-up; historical repository inventory below retains its dates)  
**Repository:** dhays4sports/CoverageFit  
**Canonical working branch for this document:** signal-copilot

## How to use this document

This file exists to prevent CoverageFit development from fragmenting across multiple ChatGPT threads.

For any future CoverageFit architecture, implementation, Cloudflare, deployment, Signal, SMS, calendar, importer, Producer OS, or Copilot work:

1. Read this file first.
2. Re-audit the repository before making a material change.
3. Treat the repository and deployed configuration as higher authority than chat memory.
4. Update this file when branch state, deployment state, roadmap order, blockers, or operating assumptions materially change.
5. Do not create a competing "current state" document.
6. Do not trust stale SHAs, preview URLs, test counts, or environment assumptions from older conversations.

Source-of-truth order:

**current repository / provider configuration → this document → canonical roadmap docs → chat context**

This file is a handoff, not a substitute for verification.

---


## Preview certification update — 2026-10-05

This update supersedes older preview-access blockers above; it does not certify live activation.
- Operator confirmed Preview COVERAGEFIT_DB -> coveragefit-signal-preview, separate from production; initial empty application schema bootstrapped with final CREATE-only DDL. Operator counts: 51 application tables, 53 explicit application indexes. Counts are not full schema equivalence certification. No production migration/reset.
- Preview producer access now works at da1f721a.coveragefit.pages.dev. Earlier branch alias returned inbox_not_configured. Alias routing/configuration discrepancy remains unresolved; use exact successful deployment URLs.
- Synthetic copilot-preview-qa-001 created without phone/email. OTHER detail loaded with AI off. Synthetic district_pilot_v1 NEW_LEAD SIGNAL source and synthetic transcript then attached in isolated preview only.
- Operator confirmed basic workspace layout at 320/375/390/430px and Tab focus/Enter disclosure behavior. Copilot controls, screen-reader and full accessibility certification remain outstanding.
- Operator confirmed manual Save edit persisted across refresh with AI off at da1f721a. This is not SMS delivery certification.
- At 7f06eefe.coveragefit.pages.dev, AI flags on exposed Copilot for synthetic SIGNAL. Screenshot also shows SMS sending OFF; runtime SMS flag parity across deployments remains unresolved.
- First provider canary failed. D1 screenshot shows TWO failed request records: ai_unavailable, gpt-5-mini, 522ms and 1744ms, estimated_cost_usd null, reserved_usd 0.0115 each. These are failed-attempt elapsed times and conservative reservations, not successful model latency or measured billed cost.
- No automatic retries or real customer SMS. Do not repeat paid attempts before diagnosis. Existing records must remain intact.
- Diagnostic fix preserves allowlisted provider error codes and HTTP statuses in request telemetry. Provider bodies/messages/headers and secrets are never retained by this diagnostic change. Rate-limit failures no longer collapse to ai_unavailable.
- Validation: 11 targeted provider diagnostic tests passed, 0 failed, 0 skipped; modified service passes syntax check. Historical full suite was NOT rerun for this patch.
- PR #7 remains draft/unmerged. PR #8 is stacked separately; this patch does not update that branch. Production AI remains unapproved. Hosted suppression/CONTROL/unsupported population tests with AI on, stale draft, selection/revision and controlled transport approval remain outstanding.
- Preview operator settings: CF_AI_PROVIDER=openai; CF_AI_MONTHLY_BUDGET_USD=1; CF_AI_REQUEST_TIMEOUT_MS=15000; NORMAL_REASON gpt-5-mini input/output per million .25/2, reasoning low; server-only OPENAI_API_KEY saved privately. No RingCentral credentials added. Flags/settings were operator-managed, not independently enumerated from runtime.

## 1. Canonical repository state

### Main

Current audited main SHA:

**5f47f2b7367110ca04ff03cc189983f136ab32fa**

Commit:

**Clarify imported-lead promotion helper**

At the time of this audit, recent repository history shows no newer commit on main.

### Open PR #6 — Producer OS foundation

PR:

**#6 — Producer OS foundation: make district promotions race-safe**

Branch:

**producer-os-foundation**

Head:

**c315d42dbbfb6363fc282eeadb05c2a90c76bbe9**

Base:

**main @ 5f47f2b7367110ca04ff03cc189983f136ab32fa**

Status:

- open;
- draft;
- unmerged;
- mergeable;
- one commit ahead of the shared base.

Primary purpose:

- harden district imported-lead promotion race safety;
- prevent dependent audit / SMS ownership writes after a lost compare-and-swap;
- bind preview approval to the exact source snapshot;
- preserve seven-day eligibility;
- preserve deterministic cohort assignment;
- preserve no-send behavior;
- document Producer OS foundation / migration boundaries.

Recorded test evidence on PR #6:

**333 passed, 0 failed, 0 skipped**

This is historical PR evidence, not a claim that the suite was rerun today.

Cloudflare branch preview last observed successful:

**producer-os-foundation.coveragefit.pages.dev**

Latest deployment commit observed:

**c315d42**

### Open PR #7 — Signal Copilot

PR:

**#7 — Add default-off Signal reply copilot with bounded AI usage**

Branch:

**signal-copilot**

Head:

**c08721d304685d01fe82c3429de07c4d0771ba6a**

Base:

**main @ 5f47f2b7367110ca04ff03cc189983f136ab32fa**

Status:

- open;
- draft;
- unmerged;
- mergeable.

Primary runtime purpose:

- review-first Signal SMS Copilot;
- producer-triggered Suggest;
- natural-language producer direction;
- revised suggestion;
- Use This / draft selection;
- existing explicit Approve & Send remains the only SMS transport authority;
- bounded OpenAI provider adapter;
- structured output;
- stale-context protection;
- budget / rate / telemetry controls;
- CONTROL / STOP / DNC / unsafe-owner isolation.

Primary documentation purpose now also includes:

- Producer Copilot roadmap;
- near-term Producer OS roadmap;
- Attention Priority;
- Commitments;
- Calendar Actions.

Recorded latest full-suite evidence before subsequent documentation-only commits:

**376 passed, 0 failed, 0 skipped**
**48 Copilot tests**

Do not report this as a newly rerun suite unless tests are actually rerun.

Cloudflare branch preview last observed successful:

**signal-copilot.coveragefit.pages.dev**

Latest deployment commit observed:

**c08721d**

Latest immutable preview observed:

**946ea9e8.coveragefit.pages.dev**

The Cloudflare bot reported that exact branch head deployed successfully.

---

## 2. PR #6 / PR #7 relationship

The two PRs share base:

**5f47f2b7367110ca04ff03cc189983f136ab32fa**

Current comparison:

- status: **diverged**
- signal-copilot is **9 commits ahead** of producer-os-foundation;
- signal-copilot is **1 commit behind** producer-os-foundation.

Interpretation:

PR #7 contains substantially more recent Copilot / roadmap work but does not contain PR #6's unique Producer OS promotion-race-safety commit.

Do not mechanically merge branches.

Before integration:

- inspect the unique PR #6 changes;
- preserve its transactional / compare-and-swap guarantees;
- reconcile them deliberately with the latest working branch;
- rerun the full suite.

---

## 3. Canonical product / roadmap documents

The current producer-side roadmap is defined by:

- **COVERAGEFIT_NORTH_STAR.md**
- **docs/COVERAGEFIT-PRODUCER-COPILOT-ROADMAP-1.0.md**
- **docs/COVERAGEFIT-NEAR-TERM-PRODUCER-ROADMAP-1.0.md**
- **docs/SIGNAL-COPILOT-1.0.md**

PR #6 also contains:

- **docs/COVERAGEFIT_PRODUCER_OS.md**

Do not create another competing roadmap unless replacing one of these explicitly.

### Current approved near-term sequence

1. SIGNAL-COPILOT-1.0 certification
2. Producer OS foundation alignment
3. SIGNAL-COPILOT-1.1 — durable conversation state + commitments
4. SIGNAL-ATTENTION-1.0 — Recommended / High Intent / Due Now
5. CALENDAR-ACTIONS-1.0 — create / invite / reschedule / cancel
6. Attention + Calendar convergence
7. SIGNAL-COPILOT-1.2 — call intelligence
8. Visual Copilot
9. Document Copilot
10. PRODUCER-CONTEXT-1.0
11. Mature Signal
12. PRODUCER-ACTION-1.0

Do not skip directly into later AI capabilities while the operating primitives remain incomplete.

---

## 4. Producer OS architecture — current invariant

The operating loop is:

> **Input → Interpret → Evidence → State Change → Signal → Next Action → Producer Approval → Action**

The Producer OS should answer:

> **Who needs attention, why, what happened, what happens next, and what is the system handling?**

Preserve these separations:

### Opportunity Priority

Need / Intent / Timing / Fit.

Answers the general allocation question.

It is not P(Bind), underwriting, eligibility, or permission to contact.

### Attention Priority

Clock-aware producer orchestration.

Answers:

> **Who specifically needs attention now, and why?**

It should eventually combine current Signal state, unresolved inbound, commitments, appointments, callbacks, tasks, deadlines, quote / closing state, engagement momentum and Opportunity Priority.

Do not turn this into a black-box AI lead score.

### NBA

Answers:

> **What exactly should happen next?**

Keep separate from both Opportunity Priority and Attention Priority.

### Commitment

Represents what the customer or producer said is supposed to happen next.

Initial canonical types:

- CALLBACK
- APPOINTMENT
- FOLLOW_UP
- QUOTE_REVIEW
- DOCUMENT_EXPECTED
- FUTURE_BIND
- CLOSING
- RENEWAL

Keep:

**evidence → confirmed business state → external action**

separate.

### Calendar

Google Calendar is an execution / synchronization provider.

CoverageFit owns the relationship commitment and external linkage.

A calendar event does not prove a call happened.

---

## 5. Existing implementation relevant to the near-term roadmap

### Opportunity Priority

Existing implementation:

**server/opportunity-priority-core.mjs**

Current model:

- Need — 25
- Intent — 30
- Timing — 25
- Fit — 20

It already recognizes scheduled conversations and explicit customer state.

### NBA

Existing implementation:

**server/next-best-action-core.mjs**

Already recognizes:

- client proceed;
- unanswered customer question;
- scheduled conversation;
- contact request;
- open tasks;
- closing state;
- Opportunity Priority queues;
- FIV fallback.

A scheduled appointment within 24 hours already yields preparation-oriented NBA behavior.

### Current producer attention ordering

Existing implementation:

**server/producer-workspace.mjs → attentionRank()**

Current ranking includes:

- STOP / suppression;
- CALL;
- human-required inbound;
- HIGH / URGENT inbound;
- pending draft;
- quote ready;
- Opportunity Priority queues.

This is the seed for SIGNAL-ATTENTION-1.0.

Do not create a disconnected second ranking engine without auditing this first.

### Google Calendar / callback infrastructure

Existing implementation includes:

**server/sms-callback-scheduling-core.mjs**

Current capabilities already include:

- Google OAuth refresh-token auth;
- free/busy;
- alternative slots;
- event creation;
- event lookup;
- event update/delete;
- deterministic event IDs;
- retry / recovery behavior;
- CoverageFit public appointment records;
- event ID / URL storage;
- Solo Desk booking projection.

Existing related modules include:

- server/callback-web-booking-core.mjs
- server/producer-booking-alert-core.mjs
- server/solo-desk-event-projection.mjs
- assets/js/callback-calendar.js
- appointment/index.html

CALENDAR-ACTIONS-1.0 should reuse these rails.

Do not create another Google Calendar transport.

Current calendar event body does not yet establish the full desired producer-facing prospect-attendee invitation workflow. Audit before implementation.

---

## 6. Signal Copilot 1.0 — current state

Current implementation on PR #7 is repository-complete enough for continued certification but is **not approved as live production AI**.

Current intended authority:

- Suggest: advisory only;
- Revise: advisory only;
- Use This: saves/selects draft only;
- Approve & Send: existing explicit producer action;
- no automatic send;
- no autonomous stage/fact/quote mutation.

Current guardrails include:

- exact NEW_LEAD SIGNAL population gate;
- CONTROL blocked before provider call;
- OTHER blocked;
- STOP blocked;
- suppression / opted-out blocked;
- wrong-number / unsafe ownership blocked;
- sending / delivery-review blocked;
- stale context before selection blocked;
- stale context before approval blocked;
- provider key server-side;
- store:false;
- strict structured output;
- bounded context / output;
- no provider tools;
- no automatic provider retry;
- budget reservation;
- per-producer rate limiting;
- manual workflow fallback.

### Remaining certification gates

Still not fully certified:

- authenticated hosted end-to-end Copilot workflow;
- mobile / keyboard hosted visual certification;
- real provider quality;
- measured real provider latency / cost;
- controlled real OpenAI synthetic canary if a safe environment exists;
- safe hosted explicit-send rehearsal with operator-controlled data/transport if available.

Do not use real customer data solely for certification.

---

## 7. Cloudflare — current known state

Canonical Pages project:

**coveragefit**

This project name is confirmed by successful Cloudflare bot deployments for PR #6 and PR #7.

### What is verified

- PR #7 current branch head c08721d deployed successfully;
- branch preview exists;
- PR #6 branch preview previously deployed successfully.

### What is NOT yet verified

The following require a fresh Cloudflare configuration audit:

- current production deployment SHA;
- production branch setting;
- current variables;
- current secrets;
- current D1 bindings;
- whether Preview and Production bindings actually differ;
- whether Preview uses an isolated database;
- Google Calendar credentials/config status;
- OpenAI variables/config status;
- RingCentral variable/config completeness;
- runtime compatibility settings;
- stale config candidates.

Do not infer these from repository code.

### Important browser discovery

Previous Cloudflare verification loops appear to be browser-session-specific.

The operator confirmed:

> Cloudflare works normally when opened in an Incognito / clean browser session.

For future Work / Computer Use:

- start Cloudflare from a fresh browser/session state;
- avoid stale cached Cloudflare verification state;
- stop for manual MFA / CAPTCHA / passkey only if genuinely required;
- continue automatically after the user completes the checkpoint.

### Preview isolation warning

Do not assume branch preview means isolated data/configuration.

Until audited, Preview must not be treated as a safe mutation sandbox.

Do not swap COVERAGEFIT_DB or use production customer records merely to complete certification.

---

## 8. AgencyZoom / district pilot / importer state

Canonical fresh-lead eligibility window:

**7 days**

The old 48-hour rule is stale.

Main contains:

- AWL normalization hardening;
- separation of ingestion from pilot eligibility;
- supported multi-row import;
- older leads import outside NEW_LEAD;
- one-click promotion of previously imported newly eligible leads;
- stable identity / provenance handling.

PR #6 adds additional promotion race safety that is not yet in main or PR #7.

AgencyZoom remains the current district automation owner.

Do not disable AgencyZoom or claim CoverageFit has replaced its cadence.

---

## 9. SMS / stage boundaries

Canonical AgencyZoom / Signal stage vocabulary remains:

- NEW
- CONTACT_ATTEMPT
- AWAITING_SIGNAL
- ENGAGED
- QUOTE_READY
- QUOTE_SENT
- FUTURE_BIND
- WON
- CLOSED
- STOP

Probe 1 / Probe 2 live inside AWAITING_SIGNAL.

CoverageFit / Solo Desk also has a separate phase model.

Do not silently rename or collapse these models.

Decision 2 remains:

- CALL
- ASK_ONE_QUESTION
- LATER
- CLOSE
- STOP

Do not introduce a sixth Decision 2 action as a shortcut.

---

## 10. Current exact next development path

Unless a fresh audit finds material changes, proceed in this order:

### A. Cloudflare configuration inventory

Read first, change nothing.

Determine:

- project;
- production branch;
- production deployment;
- branch preview deployment;
- variables / secrets names;
- D1 bindings;
- environment scoping;
- Google config;
- RingCentral config;
- OpenAI / Copilot config;
- runtime settings.

Never expose secret values in docs or chat.

### B. Finish PR #7 safe certification

- fresh repository full-suite run;
- flags-off hosted checks;
- mobile / keyboard checks if browser access works;
- optional real provider canary only if environment safety is verified.

If safe hosted mutation isolation is not available, document the limitation and continue.

### C. Reconcile PR #6 / PR #7

Bring forward the unique Producer OS promotion-race-safety behavior deliberately.

Do not mechanically merge branches.

### D. Implement Commitment projection

Audit existing tasks / appointments / future timing / closing state first.

Prefer a normalized projection over existing state before creating a migration.

### E. Implement SIGNAL-ATTENTION-1.0

Build on existing attentionRank(), Opportunity Priority, NBA and commitments.

First rollout:

- read-only;
- explainable;
- optional sorting.

Required initial sort modes:

- Recommended
- High Intent
- Due Now
- Newest

Do not make Recommended default until evaluated.

### F. Implement CALENDAR-ACTIONS-1.0

Reuse existing Google Calendar infrastructure.

Producer actions:

- create;
- invite;
- reschedule;
- cancel.

Then feed appointment state back into Attention Priority and NBA.

---

## 11. Stale references to ignore

Unless re-verified, treat the following as stale:

### Stale Cloudflare project

**dontworrycoverage**

Do not investigate or configure this project for current CoverageFit work.

Current project is:

**coveragefit**

### Stale pilot eligibility

**48 hours**

Current approved fresh-lead window:

**7 days**

### Stale Signal Copilot heads

Older PR #7 heads such as:

- a65edd1...
- ac48d53...
- fa401ddb...
- dcb3085...

are historical.

Current audited PR #7 head is:

**c08721d304685d01fe82c3429de07c4d0771ba6a**

Always recheck before use.

### Stale preview deployment URLs

Immutable Cloudflare preview URLs change with deployments.

Use the branch preview or read the latest Cloudflare PR comment.

### Stale test counts

Earlier counts such as 365 are superseded by the latest recorded PR #7 full-suite evidence of 376.

Still rerun before claiming a new current result.

### Stale assumptions about Preview isolation

Do not state that Preview is isolated until Cloudflare bindings/config are inspected.

---

## 12. Thread discipline

Use one canonical CoverageFit implementation thread for:

- architecture;
- GitHub;
- branches;
- PRs;
- roadmap;
- Cloudflare;
- deployments;
- Producer OS;
- Signal;
- Copilot;
- Attention;
- Commitments;
- Calendar product work.

Separate operational threads may still handle narrow live tasks such as:

- actual prospect SMS;
- actual appointment creation;
- sales coaching.

If another thread changes CoverageFit code/configuration:

1. bring the result back to the canonical CoverageFit thread;
2. re-audit repository/provider state;
3. update this document if material;
4. only then continue implementation.

Do not let independent chat threads establish competing architectural truth.

---

## 13. Instructions for future Work Mode

Begin any substantial CoverageFit Work Mode mandate with:

> **Read docs/COVERAGEFIT-CURRENT-STATE.md from the current active development branch first. Then independently audit the repository and external configuration before acting. If the document conflicts with current repository/provider state, current state wins and the document must be updated before implementation continues. Do not rely on stale chat context.**

For Cloudflare:

> **Use a fresh browser/session because normal-session Cloudflare verification previously looped while a clean Incognito session worked. Pause only for genuine MFA/CAPTCHA/passkey/security checkpoints, then resume.**

For safety:

> **Do not merge to main, enable production AI, alter production D1, send customer communications, disable AgencyZoom automation, rotate secrets, or make irreversible production changes without explicit authorization.**

---

## 14. Definition of current success

The near-term producer experience should converge toward:

> **Open CoverageFit → immediately see who needs attention and why → understand what has happened and what was promised next → take the smallest useful producer-approved action without reconstructing context across AgencyZoom, RingCentral, Google Calendar and ChatGPT.**

That is the current producer-side operating target.
