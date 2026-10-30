# Export All Leads — local review draft

Base: CoverageFit #37, 709db6908cd8edb9cce349569e7ce699c65b3569.

The master reader lives in server/lead-export.mjs. It uses a single SQL snapshot and independent per-store counts, server-scoped authorization/rights mapping, fixed UTF-8 CSV schema, formula escaping and a byte-budget failure. No source synchronization, opportunity creation, provider calls or sales-state mutation occurs.

The Analytics button and authenticated route are prepared. **HTTP success is hard-blocked by EXPORT_RELEASE_BLOCKERS**, including in TEST. This prevents a partial reader being presented as a complete All Leads export. No configuration flag should bypass this gate.

Tests: `node --test tests/lead-export.test.mjs` (15 tests); `node --test tests/*.test.mjs` (404 tests). Evidence in portability-evidence/. Synthetic fixtures only.

Before activation: complete remaining identified-store classification and legacy alias adapters, obtain reviewed ownership/source-rights mapping, reconcile authoritative suppression across identities, hydrate direct recommendation revisions/close evidence, complete candidate/alias/exclusion reconciliation, and pass D1 capacity/hosted auth/download tests. Existing Preview firewall blocks this new route; no hosted configuration changed.

Draft policy contract (not installed): version coveragefit-leads/1; server workspace/owner; attested legacyWorkspace and ownerWorkspace; inventoryReviewed; per-kind sourceDecisions and exact sourceKeyDecisions allow/deny; explicit allowControl only when authorized. No request parameters may override it. Environment must match the isolated workspace. This is a single-principal deployment draft, not a multi-user RBAC implementation.

CSV columns and encoding are exported as COLUMNS and csvCell. Array/object cells are JSON. IDs are namespace-prefixed source identifiers, not unique-human assertions. Export does not confer contact permission. Anonymous sessions are not contacts. External-only Meta/AgencyZoom/Visiqua records are unavailable, not zero.

No migration or dependency added. No push/PR publication performed: current repository settings auto-deploy non-production branches. Preserve the existing #36/#37 and frontend #9/#10; request separate authorization before hosted deployment. Rollback removes the additive route/UI/module without changing data.
