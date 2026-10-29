# Distribution Engine 1.2 — implemented, release blocked

2026-10-28 Pacific. No production promotion, customer messages, CRM test leads, spend or partner sends.

## Source evidence

408Farmers.com is served by Cloudflare Pages project `408farmers-v2`, with `_worker.js` routing active audience pages through `server/entry-presentation-proxy.mjs`. The old `engineers/index.html` is not the active entry renderer. `professional-presentation.mjs` supplies the newer engineering offer. CoverageFit project `coveragefit` supplies `functions/api/distribution/presentation.js`, `assets/js/entry-client.js`, and `server/distribution-journey.mjs`.

GitHub main baselines: 408finneas `29ea29a9818006ed139cf87f0990306c769b63c9`; CoverageFit `4aacbb82d789bf55a5b7e289a9f014382df5d36f`. Their Cloudflare check runs succeeded, deployment IDs `cedce447-38ad-4a40-b243-637c2a915936` and `4da0a416-6560-4b05-8ccb-c61a3a26a23d`. Check output labels branch previews; this alone does NOT prove which production branch is configured. Current production entry-client.js exactly matches CoverageFit main (SHA256 `5444baefaa0d2807a1ede40e10b0bec6eb9681376752eb915ad4ce8191d7a6b5`). Live engineers HTML matches the dynamic proxy/presentation implementation and loads that asset. Exact current production deployment ID/branch binding remains blocked by Cloudflare sign-in. These are the active code owners, not obsolete static pages.

## Reproduction and repairs

The unchanged baseline with isolated synthetic storage returns requestedAudience=engineers, resumedAudience=condo, question=condo_closing. Root cause: one global resume cookie plus unconditional resume rendering.

Audience-scoped HttpOnly cookies keep separate reviews for condo, buyer, engineers, tech, healthcare and teachers. The legacy cookie remains intact. A different audience shows Continue saved review / Start separate review before questions; starting never copies answers, consent or attribution. Returning to the old route recovers it. Same-audience continuation keeps original first touch; new visits do not overwrite it. Completed same-audience new-review behavior and pending-delivery protection remain unchanged. This does not add an unlimited same-audience review archive.

Business contact links retain bounded UTM fields, partner_id and placement_id. SMS/email show a concise readable source reference; agency email remains dylan.vtam@farmersagency.com. Caller is asked to mention the reference; an ordinary telephone call is not automatically attributed. Opening an SMS/email link is not counted as an inquiry. Producer should record the mentioned source/placement on the actual inbound contact.

Callback now enters `/business/` using the existing CoverageFit intake with business product context, instead of losing the source at `/home/#form`. It requests follow-up rather than promising an exact appointment. New route is included in the Worker routing manifest. Placement ID survives normalized distribution, durable lead and producer source projection. Confirmation includes the existing unique checkpoint ID.

## Acceptance evidence and limits

- 408finneas full Node suite: 73/73 passed.
- CoverageFit full Node suite: 382/383 passed; inherited AgencyZoom assertion expects “48 hours” while unchanged implementation says “7 days.” No sender/retry changes.
- Eight new CoverageFit regression tests: all requested audience transitions; original/global-cookie recovery; distinct first touch; stale-tab rejection; voluntary call-only consent; request ID; business product; identical source/placement/campaign in durable and producer records; deduplication; authenticated producer-work API; file-backed SQLite close/reopen durability.
- Three new contact tests: tagged SMS/email/callback, malformed/oversized values, untagged behavior and deployed route inclusion.
- Existing buyer/condo/reliability regressions cover failure, retry, reconciliation and concurrent deduplication. No provider adapters or production credentials used. Synthetic SQLite store only; tests never enter campaign reports.
- Producer destination for this intake is the existing CoverageFit Solo Desk / WEB_DIRECT queue. The durable checkpoint is `408d_<journeyId>`; its source context keeps journeyId, contact, product, source and permission. Recovery is existing operator-triggered lead sync, not an autonomous background delivery guarantee. AgencyZoom, email notifications and calendar receipts are NOT claimed as verified.
- The browser could not access the local isolated QA host (ERR_BLOCKED_BY_CLIENT). Cloudflare dashboard requires sign-in. Therefore no new desktop/mobile browser pass, no hosted isolated D1 pass, no production producer receipt and no release smoke pass are claimed. Existing historical mobile checks do not certify these edits. Real iOS/Android/in-app testing remains outstanding.
- Agency mailbox unchanged; producer accessibility requires user mailbox confirmation or a separately approved self-addressed test. No email sent.

## Coordinated release sequence — do not merge independently

The old frontend proxy drops audience-specific Set-Cookie responses. Deploy the **cookie-transport-only bridge commit first**, while the backend still uses legacy cookies. Then deploy CoverageFit changes. Only then deploy the remaining acquisition changes enabling `/business/` and attributed callback links. This avoids both losing scoped cookies and linking to an unsupported business handler. Draft PR commits separate the bridge from the full feature. Confirm production branch settings before applying this sequence.

Before any production promotion: sign in to Cloudflare; inspect production branch/revision for both projects; inspect preview D1 identity and all provider bindings; use a distinct synthetic-only DB and no live providers; never set BUYER_STAGING_ISOLATED merely to bypass the guard. Configure paired preview upstream using the existing supported mechanism. Execute desktop, 390×844 and narrow viewport scenarios, refresh/back, second partner, failed network/retry, and producer authenticated readback. Match accepted checkpoint to stored and producer-visible records. Exclude QA from reports.

If isolated hosted proof cannot establish production producer access, prepare one self-addressed canary for Dylan, scoped to his controlled destination, with no prospect contact, no CRM automation, and explicit separate approval before execution. Do not run it until exclusion/recovery and exact destination are confirmed. A queued local row or HTTP 200 is insufficient.

Rollback: disable new business callback navigation first if needed. Keep the scoped-cookie bridge and compatible backend available for existing scoped reviews; do not blindly revert to a backend that ignores them. Retain all consented records and recovery. No migrations required.

## Agency approval packet — prepared only

Canonical tracker Offer Copy rows 8–13 contains exact CONDO-1.1, PROFESSIONAL-1.1 and BUSINESS-1.1 newsletter/short versions, CTA, footer and proposed destinations. Request Virginia/Farmers approval of those exact words and final rendering, authorized logo treatment, agency identity, license disclosure, applicable California occupation/product eligibility and conditional discount wording. Preserve no-obligation, no guaranteed savings, underwriting/policy-terms and no-binding-coverage language; no employer/association endorsement. 408-FARMERS is secondary contact. Life is excluded from these placement packages. Existing professional live header treatment still needs approval, not presumed compliant by this technical fix.

Partner placement permission remains separate. Five inquiry drafts in Placement Sprint 1.1 rows 23–27 remain unchanged and unsent. No publication until both technical and advertising/partner gates pass.
