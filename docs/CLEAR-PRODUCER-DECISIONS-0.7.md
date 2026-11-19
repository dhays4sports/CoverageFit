# Clear producer decisions 0.7

Mandate: `CF-CLEAR-PRODUCER-DECISIONS-0.7`.
Engineering: **PASS locally**. Remote results must be checked on the actual published PR head and are recorded separately in its description. First human attempt: **UNSUCCESSFUL**. Second attempt: **PENDING**. No usability acceptance or real-world benefit is claimed.

## Verified prerequisite

Fetched main and PR #49, checked ancestry and relevant open work, read the inherited implementation/acceptance and applicable supplied project instructions. No repository AGENTS.md was found. Stack parent: `507fb740c373a5dacece934022a25e589ad05927` (#49), tree `0a88d7b9f08f41c9cf4e22f8773342d238b49610`. Main remained `43588dcf066b24adbed53302d4962ba216358687`. #49 was draft/unmerged; its exact-head [offline CI 44425404129](https://github.com/dhays4sports/CoverageFit/actions/runs/44425404129) and [shared-profile/Windows CI 44425404109](https://github.com/dhays4sports/CoverageFit/actions/runs/44425404109) were observed successful. Fresh local baseline: 659/659 root, 24/24 desktop tests.

No prerequisite or separate SIGNAL branch was merged. Unrelated features and branches were preserved. No connector resource, storage migration, archive implementation, live transport or production route was added. Existing disabled defaults, scoped authorization and matching isolated database markers remain required.

## Human evidence

Dylan reported opening the local preview and reaching “Inspect source originals,” then said he did not understand what was happening and found it confusing. He also confirmed that the reason for review was unclear before the inspector. `walkthrough/human-feedback.json` retains the actual statements, marks the first attempt unsuccessful and records the second as pending. It does not infer other scenarios, a saved decision, a technical failure or approval. The original 0.6 engineering acceptance does not establish human usability.

## Implementation and bounded decisions

The existing `mountSharedWorkspace` accepts an opt-in `focusedPolicyDate` presentation, implemented by `assets/js/policy-date-decision.mjs`. Only the local walkthrough opts in for the policy-conflict and STOP-plus-policy cases. The default scenario is s03/Home; other Work records/scenarios remain available behind optional disclosures. Ordinary production/desktop mount defaults and generic review flows retain their behavior. This is a focused rendering of an existing shared profile, not another profile, authority or reconciliation application.

The question, customer/Home opportunity, policy/carrier/term context, disagreement and consequences appear on entry. The actual expiration observations are March 1 and April 1, 2027. The former is the imported policy field; the latter is an attributed reference `document-1`. The fixture supplies no underlying document title or content. The UI does not turn the observation ID `renewal-letter` into a document title or invent a quotation. Original values, date-only precision, observation times and relevant limitations are visible. Both timestamps are identical; no winner is preselected and no recency heuristic is used. Renewal effective, producer review and timezone-bearing callback values appear as separate date kinds, never expiration choices.

| Choice | Existing operation and resulting state |
| --- | --- |
| Confirm an observed date | Explicit support reason and attestation, then review, then confirm. Existing source-bound fact approval with current source revision/digest, exact fact key/customer/opportunity and expected profile version. Producer-reviewed, not independent carrier verification. |
| Different date with support | Requires a valid date, source reference, excerpt and reason. Saves an existing **tentative/unknown-freshness** source-bound fact. The proposal stays unconfirmed and the expiration issue stays open. This UI does not provide a shortcut to verify a new external document. |
| Cannot confirm yet | No service request. Original review issue remains; explains missing proof/next inspection. Optional browser draft only, no new persisted deferral semantics. |
| Correction | Existing `supersedes` relationship for the single active prior review. Prior decision and evidence remain retained. Multiple active prior reviews block this bounded UI pending reconciliation. |

The save proposal names the date/type, customer, policy/opportunity, support and reason; it explains what remains unresolved, retention of originals, no AgencyZoom update, no sending and unchanged STOP/DNC. Plain-language success replaces receipt IDs as the primary result. Decision history and supporting evidence remain inspectable through the existing evidence service. IDs, source revisions/digests, synchronization diagnostics, capacity and SHADOW are optional technical details. Material uncertainty, missing originals and active contact holds remain visible.

A different-date proposal may explicitly supersede a previous reviewed date while retaining it historically. The previous date is no longer current, and the proposal does not become verified. This conservative choice prevents an unsupported replacement from silently inheriting verified status. It does not change the broader shared-profile service’s manual correction policy.

## Integrity, receipts and authority

No backend review or identity rules were weakened. Existing scope, source integrity, CAS/profile-version, correction and request-fingerprint checks still decide acceptance. The evidence payload retains the selected exact observation, full normalized original policy-source summary and any separately supplied unverified supporting reference/excerpt. Existing server records supply actor/time, expected/prior versions and receipt identity. No new archive metadata/schema or task authority is introduced.

A retry record is stored before submission; if storage cannot preserve it, no request is sent. An uncertain result retains the exact payload/request ID across remount. Retry checks the existing receipt and does not create another fact. Conflicting reuse rejects. Stale source/profile decisions reject and retain notes; a replay of an old accepted receipt after a source change does not label the old date current. Current missing/corrupt supporting sources block confirmation; earlier reviewed evidence remains historical and affected conclusions are invalidated by existing projections. A truncated inspected history blocks confirmation.

A factual choice cannot clear a hold, grant consent, take provider ownership, create local work or activate SIGNAL. Active holds are visible even after the date issue is resolved. Other review issues remain identified. Local task state and original source observations are unchanged. The synthetic harness still rejects generic updates, tasks, callbacks, attachments and provider routes. Local HTTP only; no live authentication, network provider access or communications. No Virginia agency data was accessed, copied, migrated or reassigned.

## Local acceptance

Node 24, isolated temporary SQLite fixtures; no production configuration/databases or real customer records.

| Verification | Result |
| --- | --- |
| Fresh #49 baseline | PASS — 659/659 root, 24/24 desktop |
| Focused new decision tests | PASS — 15/15 |
| Complete CoverageFit regression suite | PASS — 674/674 |
| Prospect Desk regression suite | PASS — 24/24 |
| Direct delivered app entry and DOM-to-HTTP save | PASS — s03 opens focused, real review persistence |
| Exact candidates, date-kind separation, no winner, support/review/save, correction/history | PASS |
| Deferral, tentative different date, missing/corrupt originals, stale versions/conflicting replay | PASS |
| Lost-response retry/remount, changed-source replay, failed retry storage | PASS |
| STOP/DNC, local task/SHADOW separation, safe text/read-only/opportunity scope | PASS |
| External network attempts in focused HTTP flow | 0; no provider adapter/route/action added |
| Existing walkthrough isolation, reset, provider-route rejection and regression workload tests | PASS in full suite |
| Authenticated visual browser QA for 0.7 | UNVERIFIED; automated DOM/HTTP does not establish visual or human success |
| First human attempt / second attempt | UNSUCCESSFUL / PENDING |

Commands: `node --test tests/clear-producer-decisions.test.mjs`; `node --test tests/*.test.mjs`; `npm test` in `apps/prospect-desk`. CI watches the new module/tests and uploads this report with the existing walkthrough artifacts. Exact remote run results belong in the published PR description; no remote pass is inferred from local results.

## Delivery and remaining limits

[Exact portable Windows update/restart instructions and uncoached retest goal](walkthrough/README.md). Preserve local edits, stop on any Git error, download feedback before stopping the disposable session and use the new printed URL/key. No admin installation/PATH edit is required. The local command is the reproducible interactive preview; no hosted resource or production deployment is delivered.

Remaining: Dylan’s second walkthrough, authenticated visual/browser validation, independent verification of any different-date support, and real AgencyZoom semantics (still entirely unverified). This bounded presentation focuses on the one Home policy/term fixture; it is not a general multi-policy review selector or evidence-document verification tool. Partial resource/inventory coverage remains a source limitation, not proof of complete carrier history. No scale/retention readiness is claimed and no archive policy is changed.

Next milestone should follow actual second-attempt feedback: retain this narrow focus until Dylan can explain the problem, support, decision consequences and remaining holds without coaching. Connector expansion and archive implementation remain paused. The connector stays disabled by default; live access and action execution remain unauthorized.
