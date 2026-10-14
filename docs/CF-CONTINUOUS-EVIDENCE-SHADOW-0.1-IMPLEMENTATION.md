# CF-CONTINUOUS-EVIDENCE-0.1 — Working Test-only Evidence Flywheel (2026-10-14)

**Status:** P1 FIRST ENGINEERING SLICE IMPLEMENTED AS A PURE SYNTHETIC SHADOW — NOT PERSISTENT OR LIVE.  
**Integration:** draft PR #17 stacked on the accepted Command Center **draft PR #16**, which remains stacked on unmerged PR #7. No merges, D1 writes, external communications or production deployment authorized.

## Primary outcome demonstrated

A fictional vendor import supplies carrier AAA, initially only an `imported_unverified` fact. In the test-only scenario, SIGNAL proposes a missing renewal question. A separate synthetic inbound reply reports three vehicles and an exact auto renewal date; the same memory projection carries those facts and the next SIGNAL evaluation **does not repeat the renewal question**. A third simulated reply reports homeowner status and explicitly requests a call; SIGNAL switches to `PRODUCER_CALL_REQUESTED` rather than continuing routine qualification. All decisions are test-only proposals: no SMS send, provider call, D1 write, AgencyZoom or Calendar action.

## Implemented contract

- `server/continuous-evidence-shadow.mjs`: *pure* allowlisted fact admission and scoped identity check; source event idempotency and collision holds; internal data-use rights gate; source and fact provenance; versioned logical projection; compatible exact/month renewal evidence, policy-line distinctions, same-policy conflicts, explicit producer-confirmed field-specific correction, retention expiration/pruning, as-of time filtering; imported-unverified vs customer-reported vs verified distinctions; default-deny monetization and external transfer.
- Reuses `server/engagement-shadow-simulator.mjs` for existing TEST/CONTROL/STOP, purchased/third-party list SMS and missing positive permission holds. `TEST_ONLY` scenario outputs explicitly report `messages_sent=0`, `provider_calls=0`, `writes=0` and do not grant send/channel permission.
- `tests/continuous-evidence-shadow.test.mjs`: multi-cycle acquisition → memory → SIGNAL behavior and adversarial negative tests for duplicate/collision, missing rights, malformed assertions, ambiguous identity, different policy renewal dates, correction without loss of unrelated facts, suppression, purchased SMS route, tenant filtering, expiry and future observation time.

## Nonclaims and follow-up gates

1. **This is not durable persistence.** State is returned by a pure function for deterministic tests, not stored as a canonical D1 evidence ledger or replayed from actual customer sources.
2. **This is not production source authentication.** Synthetic `rights.internal_insurance_use`, verified identity and `source.permission_verified` flags model hypothetical eligible cases; real consent and legal/provider permission must be positively established via independent production authority before any use. These flags cannot reach the live sender.
3. **No live provider data.** Actual RingCentral inbound/receipt/recovery remains not certified; the existing accepted read-only Preview and runtime are unaffected.
4. **Not yet implemented:** verified real source ownership, data-subject correction/erasure across persistent stores, actor authentication, per-source retention policy, cross-tenant auth beyond pure filtering, durable concurrency/revision, extraction from untrusted free text, AI extraction, human confirmation/UI, runtime Prospect 360 or Today integration, 1,000-record import exercise, permitted real acquisition/pilot, external transfers or market-intelligence commercialization.
5. **Next permitted engineering slice:** E0 schema/source-of-truth and rights map, then **test-isolated durable storage/transactional replay** that reuses canonical source/UCP stores if feasible; then the planned 1,000-record acquisition exercise. Separate migration/cloud deployment and real-data approvals before touching D1 environments.
6. **P0 remains parallel:** PR #7 → #16 requires owner-specific release/merge decision, including Cloudflare Pages production branch auto-publish behavior, environment flags/DB bindings and rollback. PR #17 is not an alternative integration path and must not be merged out of order.

## Economic success model

The synthetic demonstration proves a **mechanism**, not economic uplift. Next tests should instrument redundant question count and correction minutes; an actual agency/producer approved SIGNAL vs CONTROL comparison is needed for producer minutes per useful conversation, source cost/useful conversation, quote/bind and verified premium economics.

**Gate classification:** TESTED PURE FOUNDATION SLICE once exact-head CI succeeds; persistent P1 evidence flywheel, provider workflow, production and economics are **not certified**.
