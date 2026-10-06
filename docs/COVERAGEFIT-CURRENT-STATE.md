# CoverageFit Current State

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
