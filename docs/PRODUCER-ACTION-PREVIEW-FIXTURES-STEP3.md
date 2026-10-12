# Producer Action Quality — Step 3 Synthetic Preview Fixture Setup

**Status:** Offline fixture generator implemented and validated; remote Cloudflare D1 insertion has NOT been performed by ChatGPT.  
**Execution authority:** Operator must separately authorize/execute SQL in a confirmed isolated Preview D1 database.  
**Code:** `scripts/prepare-producer-action-preview-fixtures.mjs`, `scripts/certify-producer-action-preview.mjs`  
**Roadmap:** COVERAGEFIT + SIGNAL — Master Roadmap 2.0, Phase 2.

## What is generated

One **SQL file** to insert nine isolated fictional scenarios into existing CoverageFit tables, and one **private JSON manifest** containing those same stable opportunity IDs. Generator does not connect to Cloudflare, any vendor, any AI model, or an SMS sender. It uses inserts only, with `ON CONFLICT DO NOTHING` for safe replay.

All nine fixtures have:
- exact `preview_cert_fixture_v1` provenance with `run_id`, `scenario`, `synthetic: true`;
- names prefixed `Synthetic QA`, no phone numbers and no email addresses;
- stable fixture IDs scoped to a random run ID and an explicit Workspace ID;
- no messages to real recipients, no external calendar events, no AgencyZoom operations;
- no real pilot/production cohort data (Preview-only D1 is the sole storage target).

Scenario coverage: ASK_ONE_QUESTION, CALL, due callback, due appointment, STOP, opted out, CONTROL, excluded TEST, tentative calendar. SIGNAL fixtures use simulated D1 conversation evidence with empty transport numbers; callback and calendar fixtures use source/task projections, not Google event creation. CONTROL and TEST use real pilot classification behavior **in isolated Preview only** to prove that producer routing obeys population rules.

## Hard stop before executing SQL

1. Verify Cloudflare Pages project **coveragefit → Settings → Bindings**: `COVERAGEFIT_DB` in **Preview** must identify a D1 database distinct from the **Production** binding by actual database UUID. If this cannot be established, **STOP**.
2. In Preview, confirm `CF_ATTENTION_ENABLED=1` and leave all outbound/AI/calendar/send automation flags **OFF**. These are fictional records, not invitations or SMS tests.
3. Verify the actual Preview producer Workspace ID (`COVERAGEFIT_SOLO_WORKSPACE_ID`; if unset, code currently defaults to `virginia-tam:dylan-haysbert`). The generator must use the exact same Workspace ID or Work will not find the fixtures.
4. Verify Preview has the existing schemas from migrations `0004`, `0011` and `0019`. Never run migrations against Production to make these fixtures work.
5. Keep generated manifest/SQL local and out of the Git repository. They have no secrets, but remain internal certification artifacts.

## Generate the fixture package offline

On a machine with Node.js 24 and the repository branch checked out:

```powershell
node scripts/prepare-producer-action-preview-fixtures.mjs --workspace=virginia-tam:dylan-haysbert --head=THE_EXACT_40_CHARACTER_PR_12_HEAD --out=.\.preview-qa-local
```

Use the actual Workspace ID and exact Cloudflare-deployed SHA. This creates:
- `producer-action-preview-fixtures.sql`: the SQL to paste **only in Preview D1 Console**;
- `producer-action-preview-manifest.json`: private local manifest schema 1.1 for the existing runner.

For convenience a reviewer may prepare these two artifacts offline in the working container and supply them as downloads. **Regenerate if the target deployment SHA or Workspace ID differs.** The `run_id` must be unique for each genuine run.

## Operator's one database step (Cloudflare browser)

Navigate: Cloudflare dashboard → D1 SQL Database → select **the identified Preview database**, not Production → Console. Confirm its UUID against the binding check again.

Paste/execute the SQL file content. Cloudflare D1 supports semicolon-delimited statements in its Console/API; **do not add BEGIN/COMMIT**, since D1 handles batches automatically. No external API calls or migrations are performed by the SQL. It inserts only the nine new test opportunities and related synthetic sources/conversation evidence.

Expected final read-only query in the SQL:

```sql
SELECT COUNT(*) AS qa_marker_count
FROM cf_solo_sources
WHERE workspace_id='virginia-tam:dylan-haysbert'
  AND kind='preview_cert_fixture_v1'
  AND json_extract(summary_json,'$.run_id')='YOUR_GENERATED_RUN_ID';
```

Expected: `qa_marker_count = 9`. This statement is already in the generated file with the correct run ID/Workspace ID. If it is not 9, **STOP**. Do not retry with a new run ID until the error is understood. Replaying the **same** SQL is idempotent.

Do **not** paste database IDs, producer access tokens, or Cloudflare API credentials into chat, GitHub or the SQL.

## Step 4: authenticated acceptance (after seeding)

Use the existing `docs/COVERAGEFIT-PRODUCER-ACTION-QUALITY-1.0.md` instructions and `scripts/certify-producer-action-preview.mjs`. Replace the two descriptive evidence placeholders in the private manifest with your actual operator verification notes. Supply the Preview-only producer token privately as an environment variable. Set exact head matching the immutable deployed SHA and `CF_PREVIEW_ISOLATION_VERIFIED=1` only when independently confirmed.

The runner checks unauthenticated access denial, nine fixture details, provenance, full list pagination, and action/Attention/evidence parity. It returns a redacted PASS or NO_GO. It has no outbound-send methods, though its authenticated GET endpoints can refresh internal projections, so it must remain in an isolated Preview database.

**Certification isn't complete until:** the operator's live hosted script reports PASS, the desktop/mobile Workspace UI is manually accepted, D1 isolation and deployed SHA evidence are documented. Green offline CI proves fixture construction only, not that Cloudflare D1 has been seeded.

## Rollback/cleanup

Keep fixtures while testing if useful; remove them only through a separately reviewed **Preview-only, run-ID-scoped** cleanup after evidence is captured. Do not delete opportunities by name/phone, remove general pilot data, or invoke Production cleanup.
