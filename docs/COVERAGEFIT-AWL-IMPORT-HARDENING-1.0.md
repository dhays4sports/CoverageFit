# AWL import hardening 1.0

2026-09-28 (Pacific). Baseline CoverageFit main fbe003cfad98687716c0965d4562f32054070378. Incremental change; no 408FARMERS changes, new schema, Cloudflare configuration, scoring weights, cohort algorithm or outbound capability.

## Root causes and verified source support

The old importer accepted only single-lead files, treated repeated vehicles as conflicting scalars, trimmed blank headers independently of data, rejected every >48-hour lead at ingestion, and discarded parsed details on exceptions. Its generic correction form could not resolve structural failures.

Four original exports were inspected locally, never committed. Home exports have the exact 64-column AWL header layout and an extra blank value at source column 23. This shifts the carrier to column 24, renewal to 25 and remaining fields through claims at 63. The normalization recognizes the full header signature and independent value-shape anchors (blank placeholder, carrier, renewal, excluded birthdate-shaped slot, numeric claims). It removes only that verified placeholder and ignores paired empty padding. The observed semantic assertion is carrier Foremost / renewal 2027-04-01. Excluded values are inspected only to validate the known layout; they are not retained or logged by the importer.

Auto originals have the known insurance-header quoting defect, repeated unnumbered Vehicle groups and empty terminal padding of differing lengths. One- and two-vehicle originals now parse. Numbered Vehicle (2) groups are supported too. `_csv_` and BOM prefixes remain supported. Normalization version AWL-NORM-1.0; mapping version AZ-RAW-2.0.

No arbitrary column-shift guessing. The external combined CSV contains the union of Buyer Name and Buyerid schemas; its alignment is not authoritative. Such rows remain NEEDS_REVIEW and recommend original exports. Unrecognized home variants, nonempty unlabeled values and unknown structural mismatches require source review. Unclosed quoting cannot safely establish row boundaries and holds the file; isolated valid CSV rows with validation errors do not block other rows.

## Canonical evidence and compatibility

`facts.vehicles` is a collection of descriptions, ownership, usage, mileage, deductibles and permitted coverage facts. `vehicle_count` counts supplied vehicle descriptions. The legacy `facts.vehicle` remains the first description. Facts retain column/header/entity provenance. Existing RAW records are not rewritten; duplicate import preserves existing facts and immutable assignment. Safe fact refresh is deferred rather than silently replacing evidence.

Original stable IDs and valid received timestamps cannot be overridden to choose a cohort or refresh eligibility. Missing/invalid fields have targeted correction controls; operator corrections are recorded. Source fields excluded by RAW governance (including DOB, age, gender, medical, credit, job/education, relationship and VIN) are not included in persisted Signal facts. Synthetic test fixtures reproduce header layouts, not real prospects.

## Import versus pilot

Each row has independent import_status, pilot_status, SMS state, issues and recovery fields. Age >48h is READY for import and INELIGIBLE_AGE for NEW_LEAD. Received dates stay unchanged. These records use the existing cf_solo_sources storage with kind district_raw_v2; no district_pilot_v1 row or cohort is created. Producer population is OTHER. Priority detail/backfill excludes them, and SMS ownership holds them for manual handling even with stale first-party context. STOP and producer takeover retain precedence.

Fresh eligible Auto/Home/Bundle leads use the unchanged deterministic pilot assignment and enrollment path. Existing enrollments retain their cohort on reimport. Stable source IDs dedupe across old/new import kinds. Phone conflicts remain blocked without phone-only merging. Manual pilot enrollment cannot promote a previously imported old source, even through a different opportunity. Synthetic data remains separately marked and outside production pilot denominators.

## Bounds and operator UX

Upload 1–20 files, up to 100 leads per request, 256 KB per file and 1 MB total UTF-8 data. Endpoint JSON envelope is bounded separately to accommodate escaping. Row, cell and column bounds remain. Use original AWL files; same-schema batch files and canonical allowlisted row layouts are supported. No manual combination is needed.

Preview reports file/row, identity, product, source, Pacific received time, phone state, import status, SMS state, pilot eligibility and specific issues. Unknown phone state is NOT_EVALUATED, not MISSING. Structural failures do not offer unrelated correction fields. Future source timestamps require source/timezone review, not changing the date to today.

Primary action: Import valid leads. Commit reports imported, duplicates, review-needed, pilot enrollments, outside-pilot imports, SMS links and zero sends independently. Outside-pilot inventory is in Work → OTHER (or search/ALL), not the SIGNAL queue. Vehicle evidence is displayed intelligibly in opportunity detail.

## Verification and limits

Full CoverageFit suite: 327 passed, 0 failed, 0 skipped, including 15 additional regressions. Coverage includes source prefix/defect, shifted home semantics, one/two/numbered vehicles, prohibited-field exclusion, batch isolation/bounds, duplicate and phone conflicts, fresh/old/future eligibility, historical scalar compatibility, CONTROL isolation, non-pilot priority exclusion, STOP/takeover, no import outreach, structured preview and targeted UI recovery.

Four actual source files parsed locally. No live prospect was imported or contacted for testing. Live historical RAW storage was not accessed or rewritten; backward compatibility was exercised using persisted synthetic records with the prior mapping/scalar shape. Hosted preview/commit verification remains a separate operator checkpoint, not claimed by unit tests.

## Deployment and rollback

Publish this change to CoverageFit main; existing Pages deployment workflow applies. No new variables, bindings, secrets or SQL migration; do not reapply 0019. Verify Import now says Import valid leads, then preview original AWL files. Older rows should show READY / outside NEW_LEAD, identity and valid phone when present. An explicitly confirmed import should appear under Work → OTHER and stay outside pilot reports. No SMS is sent.

If deployment is not automatic, the operator should deploy the committed main revision in the existing Cloudflare Pages project serving coveragefit.com; preserve all bindings/variables. Verify the revision before retrying import. No Cloudflare login is required from the coding agent.

Rollback: pause import UI/endpoint if needed. Retain the district_raw_v2 SMS/priority/manual-enrollment guards after any outside-pilot records exist; reverting only the parser/UI is safer than reverting all code. Preserve records, original timestamps and source kinds. A wholesale rollback to the old runtime could mis-handle the newly linked non-pilot relationships and is not a safe data rollback.
