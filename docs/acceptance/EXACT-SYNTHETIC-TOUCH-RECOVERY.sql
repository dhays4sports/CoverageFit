-- Exact existing TEST fixture only. No INSERT, sync, new submission or other field changes.
-- Each statement is idempotent; after interruption rerun then verify both arrays.
WITH target AS (SELECT j.data_json AS journey, l.record_key AS lead_key
 FROM pvx_records j JOIN pvx_records l ON l.record_key='lead-ops/lead/4055026c0c367c4c9626950fff2292af27228a484a90548d398f08bb9da2280d'
 JOIN cf_solo_sources s ON s.workspace_id='distribution-engine:synthetic-test' AND s.kind='lead' AND s.source_id='408d_pvxj_3449352375374a89841a937b9c91c441'
 JOIN cf_solo_opportunities o ON o.id=s.opportunity_id AND o.workspace_id=s.workspace_id
 WHERE o.id='opp_src_ae960d98c5e3f0b296d2edbedd9dd91e' AND j.record_key='pvx/web-journey/76a245a82c86b77d6c3d62a4220336523bb11c780d02114d0e42d1b38d435440' AND json_extract(j.data_json,'$.journeyId')='pvxj_3449352375374a89841a937b9c91c441'
 AND json_extract(j.data_json,'$.contact.delivered')=1
 AND json_extract(l.data_json,'$.checkpointId')=s.source_id
 AND json_extract(l.data_json,'$.context.distribution.journeyId')=json_extract(j.data_json,'$.journeyId')
 AND json_extract(s.summary_json,'$.context.distribution.journeyId')=json_extract(j.data_json,'$.journeyId')
 AND json_extract(l.data_json,'$.context.distribution.firstTouch')=json_extract(j.data_json,'$.firstTouch')
 AND json_extract(s.summary_json,'$.context.distribution.firstTouch')=json_extract(j.data_json,'$.firstTouch')
 AND (l.expires_at IS NULL OR l.expires_at>'2026-10-30T04:10:03.811Z')) UPDATE pvx_records
   SET data_json=json_set(data_json,'$.context.distribution.additionalTouches',json(COALESCE(json_extract((SELECT journey FROM target),'$.additionalTouches'),'[]')))
   WHERE record_key=(SELECT lead_key FROM target)
   AND COALESCE(json_extract(data_json,'$.context.distribution.additionalTouches'),'[]')<>COALESCE(json_extract((SELECT journey FROM target),'$.additionalTouches'),'[]') AND EXISTS(SELECT 1 FROM distribution_preview_identity WHERE singleton=1 AND database_id='f5ac694d-1028-4a30-9fbd-c264b2e5995e' AND traffic_class='TEST') AND EXISTS(SELECT 1 FROM cf_solo_opportunities WHERE workspace_id='distribution-engine:synthetic-test' AND id='opp_src_ae960d98c5e3f0b296d2edbedd9dd91e' AND status='open');

WITH target AS (SELECT j.data_json AS journey, l.record_key AS lead_key
 FROM pvx_records j JOIN pvx_records l ON l.record_key='lead-ops/lead/4055026c0c367c4c9626950fff2292af27228a484a90548d398f08bb9da2280d'
 JOIN cf_solo_sources s ON s.workspace_id='distribution-engine:synthetic-test' AND s.kind='lead' AND s.source_id='408d_pvxj_3449352375374a89841a937b9c91c441'
 JOIN cf_solo_opportunities o ON o.id=s.opportunity_id AND o.workspace_id=s.workspace_id
 WHERE o.id='opp_src_ae960d98c5e3f0b296d2edbedd9dd91e' AND j.record_key='pvx/web-journey/76a245a82c86b77d6c3d62a4220336523bb11c780d02114d0e42d1b38d435440' AND json_extract(j.data_json,'$.journeyId')='pvxj_3449352375374a89841a937b9c91c441'
 AND json_extract(j.data_json,'$.contact.delivered')=1
 AND json_extract(l.data_json,'$.checkpointId')=s.source_id
 AND json_extract(l.data_json,'$.context.distribution.journeyId')=json_extract(j.data_json,'$.journeyId')
 AND json_extract(s.summary_json,'$.context.distribution.journeyId')=json_extract(j.data_json,'$.journeyId')
 AND json_extract(l.data_json,'$.context.distribution.firstTouch')=json_extract(j.data_json,'$.firstTouch')
 AND json_extract(s.summary_json,'$.context.distribution.firstTouch')=json_extract(j.data_json,'$.firstTouch')
 AND (l.expires_at IS NULL OR l.expires_at>'2026-10-30T04:10:03.811Z')) UPDATE cf_solo_sources
   SET summary_json=json_set(summary_json,'$.context.distribution.additionalTouches',json(COALESCE(json_extract((SELECT journey FROM target),'$.additionalTouches'),'[]')))
   WHERE workspace_id='distribution-engine:synthetic-test' AND kind='lead' AND source_id='408d_pvxj_3449352375374a89841a937b9c91c441' AND EXISTS(SELECT 1 FROM target)
   AND COALESCE(json_extract(summary_json,'$.context.distribution.additionalTouches'),'[]')<>COALESCE(json_extract((SELECT journey FROM target),'$.additionalTouches'),'[]') AND EXISTS(SELECT 1 FROM distribution_preview_identity WHERE singleton=1 AND database_id='f5ac694d-1028-4a30-9fbd-c264b2e5995e' AND traffic_class='TEST') AND EXISTS(SELECT 1 FROM cf_solo_opportunities WHERE workspace_id='distribution-engine:synthetic-test' AND id='opp_src_ae960d98c5e3f0b296d2edbedd9dd91e' AND status='open');
