# Export All Leads — local review draft

Base: CoverageFit #37, 709db6908cd8edb9cce349569e7ce699c65b3569.

The master reader lives in server/lead-export.mjs. It uses a single SQL snapshot and independent per-store counts, server-scoped authorization/rights mapping, fixed UTF-8 CSV schema, formula escaping and a byte-budget failure. No source synchronization, opportunity creation, provider calls or sales-state mutation occurs.

The Analytics button and authenticated route are prepared. **HTTP success is hard-blocked by EXPORT_RELEASE_BLOCKERS**, including in TEST. This prevents a partial reader being presented as a complete All Leads export. No configuration flag should bypass this gate.

Current validation: `node --test tests/lead-export.test.mjs` (19 passing); `node --test tests/*.test.mjs` (415 passing, no failures/skips). Synthetic fixtures only. The files in portability-evidence/ preserve the earlier 15/404-test baseline, not the current run. See CONTINUOUS-REVENUE-DELIVERY-3.0.md for the canonical execution ledger.

The reconciled draft preserves distribution first/subsequent-touch evidence and request context in explicit JSON columns, resolves nested web-source suppression links, retains source IDs without checkpoints, prevents imported checkpoint duplication, and prevents expired checkpoints reappearing through their journey/source aliases. Unknown suppression remains unknown; full adapter coverage remains blocked.

Before activation: complete remaining identified-store classification and legacy alias adapters, obtain reviewed ownership/source-rights mapping, reconcile authoritative suppression across identities, hydrate direct recommendation revisions/close evidence, complete candidate/alias/exclusion reconciliation, and pass D1 capacity/hosted auth/download tests. Existing Preview firewall blocks this new route; no hosted configuration changed.

Draft policy contract (not installed): version coveragefit-leads/1; server workspace/owner; attested legacyWorkspace and ownerWorkspace; inventoryReviewed; per-kind sourceDecisions and exact sourceKeyDecisions allow/deny; explicit allowControl only when authorized. No request parameters may override it. Environment must match the isolated workspace. This is a single-principal deployment draft, not a multi-user RBAC implementation.

CSV columns and encoding are exported as COLUMNS and csvCell. Array/object cells are JSON. IDs are namespace-prefixed source identifiers, not unique-human assertions. Export does not confer contact permission. Anonymous sessions are not contacts. External-only Meta/AgencyZoom/Visiqua records are unavailable, not zero.

No migration or dependency added. No push/PR publication performed: current repository settings auto-deploy non-production branches. Preserve the existing #36/#37 and frontend #9/#10; verify the exact isolated deployment/security scope before any hosted deployment; new Preview API allowlisting requires separate security approval. Rollback removes the additive route/UI/module without changing data.
