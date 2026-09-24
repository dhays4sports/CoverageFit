# Production SMS hotfix, September 22

Base: CoverageFit 48aa763de25336fbc64093daa110849a7162a799 (3.20.254).
Known live rollback: dontworrycoverage 90dbffdca9524d562d0e7dfb4f381ef311da6a74 (3.20.224), Cloudflare deployment 60dd6e07-bf8b-4494-9513-24f48e2fc284.

## Changes
- Pages JSON import compatibility fix (four server imports).
- At most one unresolved scheduling clarification; then silent producer handoff.
- Uncertain availability and text/email deferrals hand off without inventing an appointment. Raw follow-up request is included in the producer summary; this does not create a timed reminder or calendar event.
- Explicit producer pause takes precedence over callback, aged-lead and generic routing. STOP/START consent remains ahead of pause routing.
- Gateway reloads stored permission immediately before sending; paused/opted-out sends are not queued for retry. Existing retries become suppressed when processed while paused.
- Manual outbound ingestion stops remaining callback campaign steps.

## Validation
Run the test entry tests/production-sms-safety.test.mjs bundled for Node with esbuild (JSON modules in this deployment require bundling). Fifteen tests cover the incident, bounded availability, deferral, prior booking acknowledgment, exact timing, webhook manual takeover, STOP, stale gateway snapshot and suppressed retry creation.
Run: npx --yes wrangler@3.114.17 pages functions build --outdir=<directory outside deploy root>

## Release gates still requiring live access
- Verify production D1 binding and applied schema against migrations 0007–0018. Source migrations are not proof of applied database state. Do not blindly replay migrations.
- Verify production RingCentral outbound recovery/subscription coverage, required credentials, callback calendar configuration and disabled-by-default feature gates.
- Use a controlled internal number to validate manual reply ingestion and no subsequent automated prompt, plus STOP and callback booking. No customer SMS was sent during local testing.
- Merge only this production candidate into main after gates pass. Do not merge, modify or deploy any existing signal preview branch or change its bindings.
- Verify production deployment success and live behavior; retain identified rollback deployment.

## Operational limits
Manual messages must reach CoverageFit through RingCentral webhook/recovery before it can know to pause. Until that ingestion is verified, use the existing explicit producer pause control when taking over. Unregistered outbound campaign messages also trigger conservative producer pause; registered invitation workflows remain available.

A store read and an external provider send are not atomic: messages already accepted by RingCentral cannot be recalled. This patch narrows the stale-snapshot window but does not claim a distributed transaction or cancellation of provider-accepted SMS.

Existing pending retry jobs must be reviewed/suppressed before resuming paused conversations. The new handler does not create retry jobs for pause or consent rejections.

Release status: candidate only, pending live schema/configuration verification and controlled canary.

## Outbound recovery follow-up
Production binding and schema definitions through 0017 were confirmed by the operator; operator supplied verification of both 0018 tables and all four indexes after applying migration 0018. Current webhook UI reports 236 successes, zero failures, zero pending retries. Manual outbound test did not appear.

Recovery now requests both directions, validates each against the configured business number, replays chronologically using the existing provider-ID/fingerprint registry, and runs even when maintenance finds the subscription healthy. Registered automation cannot override an existing explicit producer pause. Failed replay stops later replay. Truncated history fails without advancing the cursor or replaying a partial window. Initial upgrade scans the configured lookback instead of trusting an inbound-only checkpoint.

Live follow-up: verify the maintenance worker schedule and run a recovery cycle after deployment. Default recovery limit is 100 messages and lookback 72 hours; if recovery_window_limit occurs, use a suitable bounded lookback or increase RINGCENTRAL_RECOVERY_MAX_MESSAGES (maximum 500), then retry. No history was fetched or replayed against production during development. Recovery is periodic, not an instant manual-send notification guarantee. Use explicit producer pause until the live canary establishes ingestion and latency.

## RC-RECOVERY-1.2 bounded catch-up
The live audit showed repeated recovery_window_limit failures. Recovery now halves an oversized time window until the oldest complete slice fits the configured cap, then replays that slice chronologically. A persisted pendingFrom resumes unfinished history on the next maintenance/repair run, even beyond the moving lookback floor. Boundary messages are reread and provider IDs deduplicate them. Audit status catching_up means another run is needed; completed means the selected history has caught up. A dense minimum slice still fails without replay or cursor advancement. Existing producer pause and consent guards remain in place. Seventeen bundled tests and the Wrangler 3.114.17 Functions build pass. Live verification remains outstanding.
