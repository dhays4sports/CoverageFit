# Combined Signal preview + SMS operating system

Integration branch: `cf-signal-sms-integration`.
Parents: existing `cf-signal-decision-1.0` preview at `e02e857` and published `cf-sms-signal-os-v1` at `6b347ef`.

This combines the two implementations in one CoverageFit codebase. It does not merge anonymous sessions with identified SMS contacts, grant contact consent, change AgencyZoom stages, enable conversational auto-send, or deploy production.

## Components retained

- Preview: `/api/signal/decision`, anonymous bounded-input contract, Opportunity Priority engine, producer workspace, migration 0019, origin/CORS restrictions, fail-closed rate limiting and diagnostics.
- SMS: `/api/sms/signal`, seven campaign templates, review-first Decision 2, context/memory, manual AgencyZoom acknowledgment, queues, suppression, idempotency, simulator and audit evidence.
- Production fixes inherited with SMS: full outbound/inbound RingCentral history support, producer takeover protection, callback safeguards and retry suppression.
- Preview build compatibility: plain ESM `producer-config.mjs` imports retained in closing-flow, quote-template-api, recommendation-api and solo-desk-repository. These were the only four textual merge conflicts. Configuration parity test passed.

## Validation

- Combined Node test run: 129 passing entries, zero failures. This includes the 123 SMS/safety tests, four preview regression scripts and two new integration-boundary tests. Preview scripts contain multiple assertions; the runner counts each script as one entry.
- Integration tests verify anonymous results remain unchanged with the SMS flag enabled, anonymous PII rejection, protected SMS access and default-disabled signal processing.
- Syntax checks: 181 files, zero failures.
- Wrangler 3.114.17 Functions build: passed.
- Synthetic desktop/mobile browser checks: passed for SMS queues, Quote Ready/Future summaries and scenario/replay controls.
- No SQL migration was added or changed by the integration. Existing preview migration 0019 remains present; deployed D1 migration state is not inferred from source files.

## Preview rollout gates

1. Publish and validate the integration branch through the existing Cloudflare Pages preview pipeline.
2. Verify Preview `COVERAGEFIT_DB` is the intended isolated database and has the existing migration/rate-limit tables. Preserve `CF_SIGNAL_ALLOWED_ORIGINS` and exact bridge/Life origins.
3. Keep `CF_SMS_SIGNAL_ENABLED` unset or `0` for initial combined-preview inspection. Do not assume shared Preview environment settings are branch-specific.
4. Check anonymous Life/Home/Auto/Business routing, permitted and forbidden CORS origins, fail-closed rate limiter, no identity persistence and no exposed priority score.
5. Check protected SMS operations/simulator, existing intake/secure links and booking. Authorize a separate internal-number canary before any provider send.
6. Once the combined preview is validated, fast-forward `cf-signal-decision-1.0` to the integration commit. Never force-push or replace production main.
7. Enable the SMS pilot only after bindings and the internal-number canary are verified. Keep anonymous session/contact promotion a separate future change.

The earlier SMS handoff's publication-blocked status describes its historical local handoff; that SMS branch was subsequently published as `6b347ef` with a tree identical to approved local `9b8a6aa`. It is not evidence of deployment or activation.

No automatic production merge, environment mutation, customer outreach, or AgencyZoom write is part of this integration.
