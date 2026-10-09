# RAW Lead Hosted Certification 1.0

**Document:** CF-RAW-LEAD-HOSTED-CERTIFICATION-1.0  
**Date:** 2026-10-07  
**Scope:** isolated Cloudflare Preview only

## Purpose

Measure the real hosted cost of the current 100-row synchronous intake path before changing batch size or introducing chunking.

The certification uses only deterministic synthetic records in the reserved 202-555-0100 through 202-555-0199 range.

It must not send SMS, affect production, or enter real pilot denominators.

## Safety gate

The hosted rehearsal endpoint is unavailable unless Preview explicitly sets:

`CF_RAW_SYNTHETIC_REHEARSAL_ENABLED=1`

Keep this flag absent/off in Production.

The endpoint:
- requires normal producer authentication;
- requires same-origin POST;
- generates exactly 100 deterministic synthetic rows server-side;
- calls the real RAW importer with `synthetic:true`;
- uses TEST pilot phase rather than real NEW_LEAD denominators;
- sends zero SMS;
- preserves all existing dedupe, identity, schema and ownership checks.

## Preview procedure

1. Confirm the deployment is an isolated Preview using `coveragefit-signal-preview`.
2. Set Preview-only `CF_RAW_SYNTHETIC_REHEARSAL_ENABLED=1`.
3. Redeploy the current `signal-copilot` head.
4. In the authenticated Preview Producer Workspace browser console, create a batch identity and timestamp:

```js
const rehearsal = {
  batch_id: crypto.randomUUID(),
  received_at: new Date(Date.now() - 60_000).toISOString()
};
```

5. Preview the exact 100-row synthetic batch:

```js
const preview = await fetch('/api/solo-desk/raw-rehearsal', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem('coveragefit.producerInbox.token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({...rehearsal, action:'preview'})
}).then(async r => ({status:r.status, body:await r.json()}));
console.log(preview);
```

Expected:
- HTTP 200;
- 100 rows;
- 100 machine-safe rows;
- zero exceptions for a clean isolated Preview;
- zero SMS;
- `preview_duration_ms` populated.

6. If preview is clean, commit that exact synthetic batch once:

```js
const imported = await fetch('/api/solo-desk/raw-rehearsal', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem('coveragefit.producerInbox.token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ...rehearsal,
    action:'commit',
    confirmed:true,
    fingerprint:preview.body.fingerprint
  })
}).then(async r => ({status:r.status, body:await r.json()}));
console.log(imported);
```

Expected:
- HTTP 200;
- 100 imported;
- zero true exceptions;
- zero SMS;
- receipt records `prepare_duration_ms` and `import_duration_ms`.

7. Repeat the same commit request once.

Expected:
- no duplicate opportunities;
- 0 newly imported;
- duplicates reported;
- zero SMS.

Do not create a second batch merely to prove retries.

## Decision rule after measurement

### Keep synchronous 100-row batches for now if:
- Preview and import complete comfortably within the platform/request budget;
- retry is deterministic;
- UI remains responsive enough for producer workflow;
- no ambiguous partial result occurs.

### Increase synchronous limit only if:
- 100-row hosted results are comfortably bounded;
- per-row D1 cost scales approximately linearly;
- higher-volume synthetic testing confirms no timeout/retry ambiguity.

### Prefer chunked/background intake if:
- 100-row latency is already material;
- D1 round trips dominate;
- larger batches would approach request timeouts;
- partial provider/storage failures need independent retry;
- producer should upload once and leave rather than wait for one request.

## Current non-hosted evidence

CI synthetic 100-row preview+import rehearsal on Node 24 / in-memory SQLite:

- test duration: approximately 124 ms;
- 100 rows previewed;
- 100 rows imported;
- 0 review exceptions;
- 0 SMS;
- TEST records excluded from pilot report.

This is a code-path benchmark only. It is not a Cloudflare/D1 latency result.

## Cleanup

Synthetic TEST records may remain in isolated Preview for certification evidence. They must not be treated as real pilot inventory or customer records.

After certification, set Preview `CF_RAW_SYNTHETIC_REHEARSAL_ENABLED=0` or remove it unless another controlled rehearsal is immediately planned.
