# COVERAGEFIT-PRODUCER-ACTION-QUALITY-1.0

**Status:** Active implementation mandate  
**Date:** 2026-10-08  
**Repository:** dhays4sports/CoverageFit  
**Branch:** signal-copilot

## Purpose

Make each actionable Producer Work row answer three questions consistently:

1. **Why now?**
2. **What exactly should the producer do?**
3. **What evidence supports that recommendation?**

This mandate does not replace Attention, Signal Decision 2, Opportunity Priority, Commitments, or NBA. It reconciles their existing authority into one deterministic producer-facing projection.

## Audit findings

### Attention Priority
Question answered: **Why does this relationship deserve producer attention now?**

Strengths:
- clock-aware;
- suppression-aware;
- explains NOW / TODAY / HIGH / UPCOMING / WAITING / NORMAL;
- recent unresolved inbound, due commitments and current urgency can outrank static opportunity scoring.

Boundary:
- Attention does not determine the exact producer action.

### Signal Decision 2
Question answered: **What is the current governed SMS disposition?**

Canonical actions:
- CALL
- ASK_ONE_QUESTION
- LATER
- CLOSE
- STOP

Strengths:
- closest to current conversation state;
- captures compliance, wrong-number, opt-out, human-required, future timing, quote response and bounded one-question qualification;
- STOP/suppression must outrank every sales-priority signal.

Boundary:
- Decision 2 is conversation-specific and does not replace broader opportunity workflow or commitments.

### Opportunity Priority
Question answered: **How much scarce producer attention does this opportunity deserve from Need / Intent / Timing / Fit?**

Strengths:
- evidence-gated;
- separates UNKNOWN from LOW;
- supports shoot_now / quick_play / develop / nurture / low_priority / unclassified;
- can recommend one missing micro-question when evidence is incomplete.

Boundary:
- it is not the exact next action and never grants contact permission.

### Commitments
Question answered: **What did someone say should happen next, and when?**

Strengths:
- preserves callback, appointment, follow-up, quote review, document expectation, future bind, closing and renewal state;
- separates evidence-only timing from producer-recorded commitments;
- due and overdue confirmed commitments can create actionable clock state.

Boundary:
- raw renewal or closing evidence is not automatically a producer commitment.

### NBA
Question answered: **What is the broader opportunity-level next best action?**

Strengths:
- already handles explicit proceed requests, client questions, calendar preparation, Policy.box review, recommendation/closing state, Opportunity Priority and FIV fallback;
- gives a concrete action label and rationale.

Boundary:
- NBA was designed independently of the newest SMS/Attention layer and can be stale or more generic than current conversation state.

## Reconciliation problem

Before this mandate, Producer Work could simultaneously expose:

- Attention = NOW
- Signal Decision 2 = ASK_ONE_QUESTION
- Opportunity Priority = shoot_now
- NBA = CONNECT_OR_PREPARE_NOW

Each statement could be individually valid, but the producer still had to decide which instruction controlled the immediate action.

That is the gap this mandate closes.

## Producer Action Quality projection

New deterministic module:

`server/producer-action-quality.mjs`

Output contract:

- `why_now`
  - Attention band
  - compact reason
  - source reference
  - due time when present
- `action`
  - stable action code
  - producer-readable label
  - channel when known
  - due time when known
  - actionable boolean
  - source authority
- `evidence`
  - bounded provenance-preserving support from Attention, Signal Decision 2, Commitments, Opportunity Priority and NBA
- `precedence`
  - explicit authority order used to resolve collisions

## Precedence

Immediate producer-action authority is:

1. **Contact safety**
   - STOP
   - opt-out
   - wrong number
   - suppression
2. **Signal Decision 2 STOP / CLOSE / LATER**
3. **Due or overdue confirmed commitment**
4. **Current Signal Decision 2**
5. **Upcoming confirmed commitment**
6. **NBA**
7. Opportunity Priority remains supporting evidence unless NBA or Attention uses it.

Important consequence:

> Attention can say **why now** without overriding the exact current Signal Decision 2 action.

Example:

- Attention: NOW — explicit call request
- Signal Decision 2: ASK_ONE_QUESTION — "When does your policy renew?"
- Opportunity Priority: shoot_now
- NBA: CONNECT_OR_PREPARE_NOW

Producer Action Quality returns:

- Why now: explicit customer signal
- Do: ask the one governed missing question
- Evidence: Attention + Signal Decision 2 + Opportunity Priority + NBA

The broader urgency does not silently override the current conversation state.

## UI behavior

When Producer Action Quality is actionable, each Work row should show:

- **Why now:** compact Attention reason
- **Do:** exact producer action
- **Evidence:** top supporting governed evidence

Opportunity detail should show the full evidence list and explicitly state that the projection:

- is deterministic;
- does not grant contact permission;
- does not make underwriting, eligibility, pricing or bind decisions;
- does not mutate AgencyZoom or provider state.

## Safety rules

- DISTRICT_CONTROL receives no Producer Action Quality projection.
- TEST/synthetic records remain excluded from normal Producer Work.
- STOP/suppression cannot be overridden by Opportunity Priority, NBA, quote readiness or commitments.
- CLOSE/LATER cannot be converted back into immediate sales outreach by a generic high score.
- Evidence-only dates do not become producer commitments.
- AI may assist draft generation elsewhere, but it does not own action authority here.

## Initial implementation

Implemented:
- deterministic reconciliation module;
- Producer Work list projection;
- Producer detail projection;
- actionable row rendering for Why / Do / Evidence;
- detailed evidence rendering;
- collision tests for STOP, CLOSE, LATER, due commitments, current Signal Decision 2, Opportunity Priority and NBA;
- CONTROL exclusion.

## Remaining certification

Before broadening scope:
1. fresh full-suite CI must pass;
2. deploy to isolated Preview with Attention enabled;
3. certify at least one controlled actionable fixture for:
   - ASK_ONE_QUESTION;
   - CALL;
   - due callback/appointment;
   - STOP/suppressed;
4. verify Work list and detail agree on the exact action;
5. verify no action surface implies contact permission beyond existing governed state.

## Next slice after certification

After the projection is clean, improve **action specificity** without adding new authority:

- CALL → distinguish explicit callback vs fresh inbound review vs quote response;
- ASK_ONE_QUESTION → preserve the exact approved question and known evidence it fills;
- quote-ready → distinguish prepare quote vs review existing quote;
- commitment actions → use type-specific labels and due-state language;
- NBA fallback → tighten labels where they remain generic.

Do not add calendar mutation, AgencyZoom mutation, autonomous send, or new provider authority as part of this slice.

## Hosted Preview certification runner — 2026-10-12

**Status:** Implemented and tested as a repeatable acceptance harness; **hosted certification is NOT yet complete**. Run only in an authenticated, confirmed **database-isolated Cloudflare Preview** against synthetic operator-controlled fixtures. The harness does not provision fixtures, inspect Cloudflare secrets/bindings, authenticate the operator, or prove isolation by itself.

### What was added

- `scripts/certify-producer-action-preview.mjs`: Preview-host allowlist and strict fail-closed preconditions; bounded authenticated GETs for the current `producer-work` list (including pagination) and `producer-detail` fixtures; list/detail parity of exact action and why-now evidence; machine-readable redacted PASS/NO_GO results.
- `tests/producer-action-preview-certification.test.mjs`: offline Node tests for target/origin rejection, exact SHA and isolation attestation, nine required scenarios, STOP/opt-out, CONTROL and TEST safety, unknown calendar behavior, wrong action and mismatched evidence.

**The checker has no POST/PUT/PATCH/DELETE support, makes no AI or SMS requests, and never logs a bearer credential.** However, some existing producer GET handlers can update internal population/projection records as they read. Therefore even these GETs **must not run until D1 Preview/Production isolation has been independently verified**. Calling them "read-only" refers to HTTP methods only, not guaranteed zero internal database mutations.

### Preflight — operator evidence, not an assertion from CI

1. In Cloudflare project `coveragefit`, confirm **exact immutable Preview deployment commit** from Cloudflare deployment detail, and separately confirm Preview D1 database **identifier** differs from Production. A branch alias or successful build is not sufficient.
2. Confirm Preview contains **no real customer information** and only explicitly approved synthetic fixtures for this run. Never copy production data into Preview to make the tests pass.
3. Confirm `CF_ATTENTION_ENABLED=1` only in the intended isolated Preview. Retain manual fallback; do not activate customer-facing automation to test recommendations.
4. Confirm normal producer authorization is available to the operator; do not paste tokens into GitHub, chat, shell history, filenames, or evidence logs.
5. Record the deployment evidence reference and isolation evidence reference in the local manifest. These are operator attestations; the script will enforce their presence and matching SHA but cannot fetch Cloudflare binding IDs itself.

### Fixture contract

Create or identify **nine distinct, synthetic, Preview-only** opportunities, each with verified provenance and a stable opportunity ID (no real names, phone numbers, or customer messages). Some must be visible in ordinary Work to test parity; the `test_excluded` fixture must use TEST/synthetic pilot provenance and remain excluded. Never mark a visible cohort fixture as real production evidence, and never count these in any real pilot denominators.

| Manifest key | Expected behavior |
| --- | --- |
| `ask_one_question` | Action `ASK_ONE_QUESTION`, question evidence, list/detail agree |
| `call` | Current explicit call → `CALL_CUSTOMER`, consistent action/reason |
| `due_callback` | Confirmed due callback → `CALL_BACK` |
| `due_appointment` | Confirmed scheduled appointment due → `PREPARE_OR_HOLD_APPOINTMENT` |
| `stop` | STOP → `DO_NOT_CONTACT`, `SUPPRESSED` |
| `opt_out` | Stored consent opt-out → `DO_NOT_CONTACT`, `SUPPRESSED` |
| `control` | DISTRICT_CONTROL has no Action Quality or Attention guidance |
| `test_excluded` | TEST/synthetic excluded from list; direct detail auditable with no guidance |
| `tentative_calendar` | Unconfirmed calendar cannot create a due callback/appointment or NOW/TODAY attention |

### 1.1 synthetic-source verification (mandatory)

The hosted harness no longer trusts `synthetic_only: true` by itself. Each opportunity's authenticated detail response must contain a source record with:

```json
{
  "kind": "preview_cert_fixture_v1",
  "source_id": "qa-marker-unique-to-fixture",
  "summary": {
    "suite": "PRODUCER_ACTION_QUALITY_1",
    "run_id": "qa-certification-20261012",
    "scenario": "call",
    "synthetic": true
  }
}
```

The `scenario` must match that fixture's manifest key and `run_id` must match the manifest's run ID. The actual opportunity contact name must begin with `Synthetic QA` or `Synthetic Certification`. Any contact phone must be within reserved `202-555-0100`–`202-555-0199` (with optional +1); any contact email must use `example.invalid` or `example.test`. Prefer empty phone/email wherever possible. A TEST-excluded fixture must also have original `district_pilot_v1` source provenance marked `pilot_phase: TEST`, `is_test: true`, or `synthetic: true`. A CONTROL fixture must have `DISTRICT_CONTROL` classification in both list and detail.

**Important fixture-design distinction:** Most ordinary TEST pilot opportunities are intentionally excluded from the Work list. To test visible scenarios without silently making real opportunities, the operator must create **explicitly marked fictional fixture records inside the verified, isolated Preview database only**, using existing evidence/CRM contracts plus the separate `preview_cert_fixture_v1` source. Do not change production cohort rules to make TEST records appear. No fixture creation, migrations, provider sends or customer contact are authorized by the checker itself.

Before running, independently verify that the target isolated Preview database contains no real customer records. The source marker verifies test intent, **not** a cryptographic guarantee that the record is safe; the operator's D1 isolation check remains mandatory. The checker preflights the nine direct details and validates marker/contact fields **before** scanning the general Work inventory. Its authenticated GETs may still update internal projections, so a production database remains prohibited.

The target URL must be the **immutable 8-hex deployment host**, such as `https://d3c3521f.coveragefit.pages.dev/`, not a branch alias; the exact SHA is separately attested against Cloudflare's deployment record.

### Local manifest (never commit it)

Place a local file such as `preview-qa-private.json` **outside the repository** containing this structure, replacing placeholders with actual Preview fixture IDs and the exact 40-character SHA:

```json
{
  "schema_version": "1.1",
  "synthetic_only": true,
  "run_id": "qa-certification-20261012",
  "head": "<exact-40-character-hex-deployment-sha>",
  "isolation_evidence": "Cloudflare Preview/Production D1 identifiers visually verified different; internal change record ...",
  "deployment_evidence": "Cloudflare immutable Preview build record and exact commit ...",
  "fixtures": {
    "ask_one_question": "qa-cert-ask",
    "call": "qa-cert-call",
    "due_callback": "qa-cert-callback",
    "due_appointment": "qa-cert-appointment",
    "stop": "qa-cert-stop",
    "opt_out": "qa-cert-optout",
    "control": "qa-cert-control",
    "test_excluded": "qa-cert-test-excluded",
    "tentative_calendar": "qa-cert-tentative"
  }
}
```

Values above are **illustrative**; the script refuses missing or invalid identities and cannot create them.

### Run in an operator-controlled environment

Set these variables privately without printing their values or putting tokens on the command line:

```text
CF_PREVIEW_URL=https://<immutable-build>.coveragefit.pages.dev/
CF_PREVIEW_EXPECTED_HEAD=<exact-40-character-hex-head>
CF_PREVIEW_DEPLOYED_HEAD=<same-exact-head-as-Cloudflare-deployment-detail>
CF_PREVIEW_ISOLATION_VERIFIED=1
CF_PREVIEW_PRODUCER_TOKEN=<Preview-producer-only-secret>
```

Then execute:

```sh
node scripts/certify-producer-action-preview.mjs /private/path/preview-qa-private.json
```

Do **not** run it against `coveragefit.com`, Production D1, an unverified Preview alias, or actual prospect records. The script rejects production hosts, redirects, changed SHA, unverified isolation, missing fixtures, and an off Attention flag. Store the redacted JSON result with the exact deployment evidence. PASS reports that those **synthetic fixtures** met the defined list/detail checks, not that provider writes or customer workflows were exercised.

### Gate decisions

- **PASS**: all nine cases are witnessed on the exact Preview deployed head, with independent operator evidence of D1 isolation, plus manual browser checks for UI presentation, keyboard/mobile, no mistaken permission language and disabled/manual fallback. Only then mark this part of Phase 2 `HOSTED-CERTIFIED`.
- **NO_GO/BLOCKED**: any unknown binding, missing fixture, unconfirmed deployed SHA, non-401 unauthorized access, inconsistent case, missing/unsafe suppression, unexpected runtime write, or no accessible Preview producer login. Keep draft, do not activate live features.
- **Out of scope:** sending SMS, receiving RingCentral webhook traffic, creating events, applying migrations, enabling Copilot, turning off AgencyZoom, or merging PRs. Those retain separate release gates.

The latest synthetic CI at first introduction of the runner passed **487 tests**; recheck its latest GitHub Actions run and commit before citing it as current evidence.
