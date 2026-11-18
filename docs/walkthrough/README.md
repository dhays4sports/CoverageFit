# CoverageFit synthetic producer walkthrough

This is a working local interaction with the existing Work projections, Prospect 360 component and shared-profile review services. Explicit supported decisions persist in disposable isolated SQLite fixtures. There is no live AgencyZoom access, sending, consent grant or active SIGNAL execution.

## Start

Use Node 24 from the repository checkout on this draft branch:

```
node scripts/producer-walkthrough.mjs
```

Open the exact `localURL` printed by the command, then enter its temporary `accessKey` on the local entry page. The key is specific to this disposable server session; it is unrelated to provider credentials. The server binds only to `127.0.0.1`. No dependency installation is needed to run the walkthrough. Do not expose or forward it as an unauthenticated public service.

For a managed preview daemon, `docs/walkthrough/package.json` provides the local dev entry. No hosted Site or production resource is registered by these files. The application has a separate temporary key gate even when a preview relay exists.

## Try it

Choose a scenario. Its task describes the goal, not the expected answer. Open the Work record, then the existing Review tab. Inspect source originals before choosing a supported factual or task decision. Compare the home and auto opportunities where relevant.

Source inspection is read-only. “Review proposed addition” and “Approve & save” are separate steps. Only source-bound fact review and exact external/local task reconciliation can save in this harness. Generic updates, task creation, callbacks, drafts, attachments, providers and sends are unavailable. Changing a date does not authorize contact.

The expected outcomes are in `scenarios.json`; leave that file closed during your first attempt. Some cases intentionally require retaining a hold and explaining missing proof.

After a scenario, optionally record what was clear or confusing in the walkthrough notes form. Those are self-reported observations, not an automatic usability pass. Download the feedback JSON before stopping the server. Do not enter real customer information.

## Session and reset behavior

Each scenario and reset gets an independently marked synthetic workspace/database and distinct canonical IDs. Shared-profile drafts therefore cannot accidentally move between fixtures. Browser reload retains the current process's saved decisions; switch back to a scenario to inspect its current data.

“Start a fresh synthetic copy” retains the prior fixture file until the server stops and opens a new copy. Earlier copies are not available through the new copy's API. Old drafts and pending request payloads cannot be applied to the new identifiers. Confirm pending decision receipts before resetting; reset is not a receipt-recovery feature.

Stopping the command tears down this deliberately disposable session, including synthetic databases and the private local-key file. Browser draft storage may remain but cannot authorize a new server or apply to its new fixture IDs. Download feedback first. Reset does not delete archived evidence in an active fixture; it creates a separate test copy. The missing-original scenario deliberately damages only its own synthetic fixture as a fault injection, not a retention feature.

## Status and verification

Human acceptance is **pending** until Dylan actually participates and observations are reviewed. `human-feedback.json` is intentionally empty. Automated tests never submit notes to the delivered session.

Automated HTTP and DOM tests exercise real persistence, replay, scope, reset and STOP preservation. The entry page was observed in the managed browser. Authenticated interactive browser QA remains unverified; it is not substituted with a claim that the owner participated.

Run the tests with the existing Prospect Desk test dependencies installed:

```
node --test tests/producer-walkthrough.test.mjs
node scripts/archive-scale.mjs
```

The scale runner uses separate short-lived Node processes, reads the declared workloads and ceilings in `workloads.json`, and writes `scale-results.json`. Measurements are local engineering evidence only. No bounds are raised, originals compacted or storage selector changed.
