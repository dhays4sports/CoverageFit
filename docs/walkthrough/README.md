# CoverageFit policy-date walkthrough

This local walkthrough uses existing Work, Prospect 360 and shared-profile review services. It opens the focused synthetic policy-date case directly. It has no live AgencyZoom access, sending, consent grants or active SIGNAL execution. No dependency installation or administrator access is needed to run it.

## Update Dylan’s existing Windows checkout

**Before restarting:** download any submitted walkthrough notes you want to keep. Copy any unsaved notes you want to retain. Stopping the server deletes that disposable session’s synthetic records and saved decisions. Your first feedback from this conversation is already recorded in `human-feedback.json`.

In the PowerShell window running the old preview, press **Ctrl+C**. Then paste this block. It preserves local changes by stopping if Git finds any; it never resets, cleans, stashes, merges or overwrites them. Do not continue past an error.

```powershell
& {
    $walkthroughPath = 'C:\Projects\CoverageFit-Walkthrough'
    $portableNode = "$env:USERPROFILE\Downloads\node-v24.22.3-win-x64\node-v24.22.3-win-x64\node.exe"
    if (-not (Test-Path -LiteralPath $portableNode)) { throw 'Portable Node was not found at the previously working path.' }
    if (-not (Test-Path -LiteralPath $walkthroughPath)) { throw 'The walkthrough checkout was not found.' }
    $changes = @(git -C $walkthroughPath status --porcelain)
    if ($LASTEXITCODE -ne 0) { throw 'Could not inspect the checkout. Stop here.' }
    if ($changes.Count -gt 0) {
        $changes | Out-Host
        throw 'Local changes exist. Stop here and preserve them before updating.'
    }
    git -C $walkthroughPath fetch origin feature/clear-producer-decisions-0-7
    if ($LASTEXITCODE -ne 0) { throw 'Fetch failed. Stop here.' }
    git -C $walkthroughPath switch --detach origin/feature/clear-producer-decisions-0-7
    if ($LASTEXITCODE -ne 0) { throw 'Could not select the new walkthrough. Stop here.' }
    & $portableNode "$walkthroughPath\scripts\producer-walkthrough.mjs"
    if ($LASTEXITCODE -ne 0) { throw 'The walkthrough stopped with an error.' }
}
```

Open the **new `localURL`** printed by this command. Enter the temporary **`accessKey`** on that local page. Keep the key out of chat. The old server’s URL/key do not establish that you are running the update. The page title is “Review a policy date”; the policy question opens after sign-in.

This changes only the separate walkthrough checkout. It does not update `C:\Projects\CoverageFit`, install Node or modify the system PATH. The detached checkout remains suitable for this disposable demonstration.

## Second attempt

**Task:** Review the synthetic home-policy record and decide whether its expiration date can be confirmed or should remain unresolved.

Try it without opening the engineering report or expected outcomes first. Afterwards, describe in your own words what needed attention, what supported your decision, what saving would change, and what remained uncertain or on hold. You can report confusion without completing a save. No correct date is supplied as part of this task.

Optional notes and other scenarios are under disclosures. Saving feedback does not mark usability accepted. Automated QA does not submit the owner feedback form. Do not enter real customer information.

## Other machines

From this branch, with Node 24 available:

```
node scripts/producer-walkthrough.mjs
```

Open its printed local URL and enter its temporary local session key. The server binds only to `127.0.0.1`; do not expose or forward it publicly. The key is unrelated to provider accounts. No provider credentials are provisioned.

The managed local dev entry remains in `docs/walkthrough/package.json`; it registers no hosted Site or production resource.

## Persistence, reset and recovery

Each scenario/reset has independent synthetic workspace/database markers and canonical IDs. A browser reload in the same server process retains saved decisions. A lost save response retains the exact pending request in browser storage; use its retry control to confirm the receipt before preparing another decision. Never reset/restart while relying on an unresolved receipt.

“I can’t confirm yet” leaves the issue unresolved. Its optional note is a browser draft, not a persisted deferral or local task. A different-date proposal requires a source reference and supporting excerpt; it is unconfirmed and leaves the review issue open. Both originals and earlier decisions remain in the existing evidence system during the session. Detailed engineering semantics are in the 0.7 report; they are not prerequisites to attempting the task.

Reset creates a new copy, retaining prior fixture files only until the server stops. Old drafts/requests cannot cross the new canonical identities. Restart removes the old disposable databases and local-key file. Browser drafts may remain but cannot authorize or target the new session. Download feedback first. No active archive is compacted or deleted by this work.

## Verification status

First human attempt: **unsuccessful**. Second attempt: **pending**. Exact observations are in `human-feedback.json`. Automated HTTP and DOM-to-HTTP results are engineering evidence; authenticated visual-browser QA and human usability are separate and are not claimed as passed.

Run the focused checks with existing Prospect Desk test dependencies available:

```
node --test tests/clear-producer-decisions.test.mjs
node --test tests/*.test.mjs
```

Archive implementation and scale design remain unchanged in this phase.
