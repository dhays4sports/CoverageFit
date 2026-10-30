-- READ ONLY. Run only in coveragefit-distribution-test after verifying its identity.
-- Do not select full data_json / summary_json: they contain contact information.
SELECT database_id, traffic_class FROM distribution_preview_identity WHERE singleton=1;
WITH j AS (
 SELECT data_json FROM pvx_records
 WHERE record_key LIKE 'pvx/web-journey/%'
 AND json_extract(data_json,'$.journeyId')='pvxj_3449352375374a89841a937b9c91c441'
), l AS (
 SELECT data_json FROM pvx_records
 WHERE record_key='lead-ops/lead/4055026c0c367c4c9626950fff2292af27228a484a90548d398f08bb9da2280d'
 AND json_extract(data_json,'$.checkpointId')='408d_pvxj_3449352375374a89841a937b9c91c441'
), s AS (
 SELECT * FROM cf_solo_sources
 WHERE workspace_id='distribution-engine:synthetic-test' AND kind='lead'
 AND source_id='408d_pvxj_3449352375374a89841a937b9c91c441'
)
SELECT (SELECT count(*) FROM j) journey_rows,
 (SELECT count(*) FROM l) checkpoint_rows,
 (SELECT count(*) FROM s) source_rows,
 (SELECT count(*) FROM cf_solo_opportunities o JOIN s ON s.opportunity_id=o.id AND s.workspace_id=o.workspace_id) linked_opportunity_rows;
SELECT s.workspace_id,s.kind,s.source_id,s.opportunity_id,o.status,
 json_extract(l.data_json,'$.checkpointId') checkpoint_id,
 json_extract(j.data_json,'$.journeyId') journey_id,
 '408d_'||json_extract(j.data_json,'$.journeyId') derived_request_id,
 json_extract(l.data_json,'$.consent.agencyContact.granted') consent_granted,
 json_extract(l.data_json,'$.consent.agencyContact.version') consent_version,
 json_extract(l.data_json,'$.consent.agencyContact.capturedAt') consent_captured_at,
 json_extract(l.data_json,'$.consent.agencyContact.scope') consent_scope,
 json_extract(s.summary_json,'$.permission.basis') source_permission_basis,
 json_extract(s.summary_json,'$.permission.callPermitted') call_permitted,
 json_extract(s.summary_json,'$.permission.personalTextPermitted') personal_text_permitted,
 json_extract(s.summary_json,'$.contactRequested') contact_requested,
 json_extract(s.summary_json,'$.context.distribution.trafficClass') traffic_class,
 json_extract(s.summary_json,'$.context.distribution.restaurant.alcoholShare') alcohol_share,
 json_extract(s.summary_json,'$.context.distribution.restaurant.eligibility') eligibility_screen,
 json_extract(s.summary_json,'$.context.distribution.restaurant.detailedUnderwritingAllowed') detailed_underwriting_gate,
 json_extract(s.summary_json,'$.context.reviewContext') review_context,
 json_extract(s.summary_json,'$.attribution.sourceKey') source_key,
 json_extract(s.summary_json,'$.context.distribution.firstTouch.utmCampaign') first_campaign,
 json_array_length(s.summary_json,'$.context.distribution.additionalTouches') subsequent_touch_count,
 json_extract(s.summary_json,'$.context.distribution.additionalTouches[0].utmCampaign') subsequent_campaign,
 json_extract(j.data_json,'$.restaurant')=json_extract(l.data_json,'$.context.distribution.restaurant') journey_lead_restaurant_equal,
 json_extract(l.data_json,'$.context.distribution')=json_extract(s.summary_json,'$.context.distribution') lead_source_distribution_equal,
 json_extract(j.data_json,'$.firstTouch')=json_extract(s.summary_json,'$.context.distribution.firstTouch') first_touch_equal,
 json_extract(j.data_json,'$.additionalTouches')=json_extract(s.summary_json,'$.context.distribution.additionalTouches') subsequent_touches_equal
FROM cf_solo_sources s
JOIN cf_solo_opportunities o ON o.id=s.opportunity_id AND o.workspace_id=s.workspace_id
JOIN pvx_records l ON l.record_key='lead-ops/lead/4055026c0c367c4c9626950fff2292af27228a484a90548d398f08bb9da2280d'
 AND json_extract(l.data_json,'$.checkpointId')=s.source_id
JOIN pvx_records j ON j.record_key LIKE 'pvx/web-journey/%'
 AND '408d_'||json_extract(j.data_json,'$.journeyId')=s.source_id
WHERE s.workspace_id='distribution-engine:synthetic-test' AND s.kind='lead'
 AND s.source_id='408d_pvxj_3449352375374a89841a937b9c91c441';
