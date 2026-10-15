# PR #8 Reconciliation — 2026-10-07

This note records the current reconciliation decision for `commitment-attention-foundation` against the active `signal-copilot` branch.

## PORT NOW

- `server/commitment-projection.mjs` — read-only normalization, no migration, no external action authority.
- `server/attention-priority.mjs` — deterministic read-only prioritization, no contact permission or send authority.
- `tests/commitment-attention.test.mjs` — regression coverage for commitment normalization, safety precedence, CONTROL exclusion and Attention ordering.

These files were ported unchanged from the older PR #8 tree because they are standalone foundations and do not overwrite current Copilot transport/safety logic.

## REIMPLEMENT AGAINST CURRENT HEAD

- `server/producer-workspace.mjs`
- `assets/js/producer-workspace.mjs`

Reason: PR #8 integration is based on an older Copilot branch and must not replace current hosted-certified behavior. The older workspace also contains stale integration assumptions (including a pending-SMS sort reference that does not belong in the current path). Reapply Attention/Commitment wiring surgically behind default-off flags.

## DEFER UNTIL ATTENTION READ-ONLY INTEGRATION IS CLEAN

- `server/producer-calendar-actions.mjs`
- `assets/js/producer-calendar.mjs`
- calendar route additions in `server/solo-desk-api.mjs`
- Google event transport changes in `server/sms-callback-scheduling-core.mjs`
- calendar/source synchronization changes

Reason: calendar mutations increase external write authority. They belong after the read-only Attention/Commitment projection is integrated and after the AgencyZoom/data-governance gate is applied.

## REGENERATE FROM CURRENT TREE

- `scripts/environment-contract-inventory.py`
- `docs/COVERAGEFIT-ENVIRONMENT-CONTRACT.md`

The old generated environment document is useful evidence but its source references come from the stale PR #8 tree. Port the generator if useful, then regenerate against the current source. Do not copy the stale generated inventory as current certification.

## DO NOT MERGE PR #8 WHOLESALE

PR #8 is substantially behind the current Copilot branch. Its concepts remain valuable, but integration must preserve current:
- hosted Copilot fixes;
- RingCentral sender readiness changes;
- review-first action authority;
- stale-context/duplicate-send protections;
- Producer OS race-safety reconciliation;
- AgencyZoom coexistence/data-governance direction.

