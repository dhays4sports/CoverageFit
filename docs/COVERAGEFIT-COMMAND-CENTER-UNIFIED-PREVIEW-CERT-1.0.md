# COVERAGEFIT-COMMAND-CENTER-UNIFIED-PREVIEW-CERT-1.0

**Status:** HOSTED PREVIEW ACCEPTED — operator-attested immutable deployment and D1 isolation; integration/Production authority NOT granted.  
**Date:** 2026-10-12  
**Program:** CoverageFit + SIGNAL.  
**Aggregate review:** Draft PR #16 `integration/command-center-unified-certification-20261012`, based on Signal Copilot PR #7; contains exact fast-forward ancestry from PR #12 → #14 → #15.  
**Goal:** One acceptance for Producer Action Quality, Today, linked SIGNAL Inbox, Prospect 360, selected draft review and offline SHADOW. No provider/campaign activation.

## Certification result and final principal signoff — 2026-10-13

**Final disposition: `HOSTED_PREVIEW_ACCEPTED`, restricted to the reviewed read-only Command Center.**

- **Source code:** exact tested deployed head `d8083570c0425371c67b1bae74813ec6c50a9be6`; GitHub Actions [38334953705](https://github.com/dhays4sports/CoverageFit/actions/runs/38334953705) **544 tests passed, 0 failed** and critical module syntax passed. Immutable host: `https://ece607a0.coveragefit.pages.dev/agent/workspace/`, associated to tested SHA by **operator attestation**.
- **Automated hosted checks:** principal shared `COVERAGEFIT_UNIFIED_RESULT` `status=PASS`, `checked=19`, `passed=19`, `failures=[]`, `http_actions=GET_ONLY`, `sms_sends=0`, `original_call_stop_preserved=true`, `replacement_call_run=qa-20261013-replacement-call-499d2e80`, `live_ringcentral_inbound=NOT_CERTIFIED`. Expected unauthenticated GET returned HTTP **401**.
- **Synthetic data:** original 9 Producer Action Quality records, 3 Command Center records, and 1 separate replacement CALL (necessary because the original CALL's real stored synthetic conversation had independently transitioned to **STOP**). Both cases remained linked to their own distinct conversation IDs; the old CALL stayed **suppressed**. No records were overwritten to reverse an opt-out or STOP.
- **Owner's final visual attestation:** all four checks passed **on the same immutable Preview**: synthetic replacement CALL appears correctly in Today; linked Inbox and no-send multi-select review work; Prospect 360 shows correct verified versus conflicted renewal evidence; desktop/mobile and keyboard navigation are readable and operable without overlap. This **closes** the manual visual requirement noted as `STILL_REQUIRED` in the automated report; the report itself was not rerun, and the accepted evidence is the subsequent explicit principal attestation.
- **Confidence boundary:** Preview/Production D1 binding UUID separation and immutable deployment SHA were **operator-attested**; ChatGPT did not inspect Cloudflare configuration independently. These observations are not a security cryptographic attestation.
- **Excluded:** actual RingCentral inbound webhook/subscription/recovery/delivery, full provider Inbox, send or batch approval, per-recipient consent, autonomous engagement, AgencyZoom mutation, Calendar writes, real-data producer dogfood, district/economic rollout, production feature activation or production deployment.

**Next decision:** The aggregate is ready for a *separate* #7 → #16 integration/merge review with fresh SHA/CI, branch protection, diff/security and rollback packet. PR #12/#14/#15 remain audit layers not standalone merge candidates. No merge has been approved by this Preview acceptance. No additional SQL or repeated desktop/mobile hosted confirmation is needed for unchanged reviewed runtime.

---

## Reconciliation finding

All three downstream PRs are on a single linear history, with GitHub comparison showing **zero behind / no divergent heads** at each layer. The aggregate review is NOT a command to merge all four branches: PR #7 itself is still unmerged. Retain original PRs for incremental audit. **No PR merge or production deployment without separate approval.** The unified draft PR is the single conformance/integration decision lane.

Dependency and risk:
- PR #7 `signal-copilot` → PR #12: default-off Copilot; Producer Action Quality list/detail parity, suppression and commitment test coverage.
- PR #12 → PR #14: default-off Today + linked SIGNAL Inbox projections; `producerWorkspace.list({allRecords:true})` internal one-pass reuse and authenticated `producer-command-center` GET.
- PR #14 → PR #15: default-off `prospect-360` and `producer-approval-preflight` GETs, renewal evidence, local no-send SMS draft review, offline SHADOW; guarded by existing cohort, STOP, auth and explicit no-send semantics.
- Additional PR #16: one 9+3 synthetic QA package generator, one browser GET-only checker, a full real-migrations SQLite/API integration harness and this combined acceptance/rollback playbook.
- Shared runtime edit overlap is intentional, not competing implementation: `producer-workspace.mjs`, `solo-desk-api.mjs`, `assets/js/producer-workspace.mjs`, Command Center UI, CSS, and cumulative Current State. The unified tree is authoritative for **this draft review only**.
- **Not combined/authorized:** unrelated PR #9 notifications, PR #10 Desktop Copilot, outdated PR #8 calendar and #11 prior consolidation. No integration assumptions for them.

## Independent automated gate — complete when exact-head CI passes

- Real migrated in-memory SQLite/Node API tests: nine prior action-quality scenarios; Today and linked-SMS Inbox; current SIGNAL draft revision; single recipient selected review; STOP, CONTROL, TEST exclusion; Prospect 360 imported/verified/conflict; zero send authority; SHADOW purchased-list/unknown-consent blockers.
- `tests/command-center-unified-integration.test.mjs`, `tests/command-center-unified-fixtures.test.mjs` run together with entire preexisting suite.
- Offline generator `scripts/prepare-command-center-preview-fixtures.mjs` is INSERT-only and replay-idempotent. The generated QA package creates 12 **fictional** records: original 9 Producer Action Quality cases + 3 additional Command Center cases (`review_pending`, `renewal_verified`, `renewal_conflict`). It contains no real customer phone or email.
- The browser checker `scripts/command-center-combined-browser-check.template.js` makes only authenticated GETs on an **exact pinned immutable Pages Preview hostname**, checks 401 without a credential, verifies per-record synthetic source markers, then evaluates all four UI features and contact safety. It outputs a compact PASS/NO_GO line and no raw prospect bodies, tokens or provider secrets.
- This automated local gate **does not** prove hosted D1 binding, actual Cloudflare environment flags, routing, phone viewport usability or carrier SMS.

## One hosted operator session — bundled runbook

**Prepare everything BEFORE requesting the principal's attention.** Operator should not repeat separate Phase 2/3 acceptance for each feature.

1. **Immutable build and isolation verification (same session, once).** Use the latest actual Cloudflare Pages successful Preview deployment for the aggregate PR #16 exact SHA and its immutable 8-character-host URL (not moving branch alias). Independently verify **Preview D1 database UUID != Production D1 database UUID**. Confirm synthetic-only Preview workspace and no customer data. Record UUID evidence privately without publishing secrets. STOP if DB identity or deployed SHA is ambiguous.
2. **Preview-only feature flags (single config review/change):** `CF_ATTENTION_ENABLED=1`, `CF_COMMAND_CENTER_READONLY_ENABLED=1`, `CF_PROSPECT_360_READONLY_ENABLED=1`, `CF_SMS_REVIEW_READONLY_ENABLED=1`. These are **only read-only product surfaces**. Keep `CF_AI_ENABLED`, `CF_SIGNAL_COPILOT_ENABLED`, all auto-send, Calendar write, provider subscription/recovery and purchased-lead SMS enablement **OFF**; never alter Production variables. Re-deploy a **new immutable Preview build** after changing Preview flags and re-pin its exact SHA/host; do NOT use old build hashes as proof of new environment variables. If binding/credential scope is unclear, stop.
3. **Single synthetic D1 seed, once.** Generate offline with:
   ```
   node scripts/prepare-command-center-preview-fixtures.mjs --workspace=virginia-tam:dylan-haysbert --head=<FULL_FINAL_DEPLOYED_HEAD> --preview-host=<8HEX.coveragefit.pages.dev> --out=.preview-unified-qa
   ```
   Open `.preview-unified-qa/command-center-unified-fixtures.sql` and paste the WHOLE INSERT-only SQL into Cloudflare **Preview D1 Console** (not Chrome DevTools). No BEGIN/COMMIT, DELETE or UPDATE. Re-running the same file is idempotent. It includes a SELECT expected `qa_marker_count=9` and `command_center_marker_count=3`. If either count fails, STOP; never seed a second database to make the count pass. The generated `command-center-unified-manifest.json` keeps private verification evidence; no credentials.
4. **One browser API check and visible review.** Authenticate at the exact new immutable Preview `/agent/workspace/`, open Chrome **F12 → Console** (not D1 SQL Console), paste the generated **plain-text** `command-center-browser-check.txt` from the first `(async () => {` to `})();`. The checker verifies all 12 fictional source markers and combined endpoint safety, then prints `COVERAGEFIT_UNIFIED_RESULT: {"status":"PASS"...}` or one error code. Keep it **GET-only**. Do NOT paste access tokens or raw JSON into chat. In that same browser session visually inspect Today, Inbox, selected drafts, Prospect 360 source/conflict status, STOP/CONTROL/TEST exclusion, keyboard focus and a phone-width viewport. Send only the compact PASS/error and "desktop/mobile/keyboard reviewed" attestation.
5. **Close the gate only when both server and visual evidence pass.** Record exact commit, immutable URL, Preview/Production D1 isolation attestation, 9+3 marker counts, 401 auth denial, API PASS, visual signoff and any remaining block. If incomplete, status `BLOCKED` or `PARTIALLY_ACCEPTED`, never HOSTED-CERTIFIED.

**Do not try to bypass Cloudflare verification or change shared account credentials to complete this session.** If the principal cannot access Cloudflare due verification, retain the draft and report the exact operator blocker.

## Acceptance matrix

| Concern | Evidence required | Can pass offline? |
| --- | --- | --- |
| Correct aggregated branch content | Compare refs, exact SHA, CI and migrations | Yes |
| One-list producer decision parity | Source markers, list/detail and command center 9-case smoke | Yes and hosted |
| Today and Inbox categories | Current Action Quality, draft review, no implicit SMS grant | Yes and hosted |
| Renewal facts | Imported unverified, direct-confirmed, conflicting and stale | Yes and hosted |
| Draft review | Current revision, STOP/CONTROL/test held, no approval/send | Yes and hosted |
| SHADOW | STOP/purchased list/unknown permission block, 0 network/writes | Yes; offline only |
| Frontend | Real desktop/mobile layout, keyboard focus, meaningful warnings | **Hosted signoff** |
| Isolation / flags / auth | Distinct D1 UUID, Preview flags, 401 denial, pinned deployment | **Hosted signoff** |
| Live RingCentral inbound | Subscribed webhook + real acknowledgment/recovery canary | **NOT in this certification** |
| Production merge, SMS sends | Explicit owner approval + separate release gates | **NOT authorized** |

## Operator attention budget

This is ONE consolidated setup and review session, not three approvals. All local fixture generation, static checks and CI are performed before requesting it. Never request another SQL step or real SMS until readiness is documented. If Preview cannot be isolated and enabled with confidence, remain at test-passing draft status and carry the smallest outstanding operator tasks as one packet.

**Rollback:** stop using the Preview origin; disable the three Command Center read-only flags in Preview only if operator explicitly authorizes it and a rollback is needed; retain old immutable Preview, do not merge branches; preserve synthetic logs in isolated D1 for review and later safely purge only under separate scoped cleanup approval. Do not change Production D1, RingCentral or contact records.
