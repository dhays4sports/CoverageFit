# Entry acquisition measurement audit

Acquisition grouping previously used mutable latest-touch columns even though
first_touch_json was retained. New projections keep original grouping fields;
reports derive original grouping from stored first touch, including historical
rows, without rewriting records. Latest-touch history remains separate.

Effort ratios now require an effort record for every opportunity in the group.
Partial recorded minutes remain visible with coverage counts/percent but cannot
produce minutes/bind or premium/hour. Premium/hour also requires no missing
premium evidence among recorded binds. These are recorded-effort measures, not
proof every minute was captured. Missing data is not imputed or zero-filled.

304 tests pass, zero fail/skip. Regressions cover historical attribution grouping
and partial effort coverage. No scoring, cohort, migration, CRM or SMS changes.
Tech remains staged separately. Authenticated hosted Analytics verification is
pending; fresh/source-specific producer records remain operator-confirmed only.
