# Buyer conversion backend candidate

Paired with dhays4sports/408finneas branch `upgrade/buyer-conversion-1`, report `docs/BUYER-CONVERSION-1.0.md` and screenshots/test logs there.

Adds buyer flow version 1 only to new immediate buyer sessions, reusing the existing PVX journey, lead checkpoint and producer projection. Captures closing window, optional ZIP and relevant property facts, preserves selected-channel consent, supplies urgency/summary/producer task, and records a first-party qualified-request event only after successful durable producer delivery. Does not activate AgencyZoom sends, messages, calendar booking, Pixel/CAPI or migrations.

Validation: 34/34 buyer/distribution tests; full test glob 336/337. The sole failure is the inherited AgencyZoom RAW fixture expecting “48 hours” while baseline implementation uses “7 days”; reproduced on untouched main 2cafacb. Acquisition paired regression suite 63/63. Actual browser urgent submission and same-browser resume passed against isolated SQLite. Production-equivalent Cloudflare/D1 and Meta WebView checks remain outstanding.

Deploy backend before acquisition after hosted gates. Preserve support for existing buyerFlowVersion 1 sessions during rollback; blindly restoring old backend code can strand their new question IDs. Keep records and consent; no destructive rollback. Production and paid advertising are not declared ready.
