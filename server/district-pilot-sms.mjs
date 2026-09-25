import {CONTROL_PREFIX} from './district-control-roster.mjs';
import {identity,parse} from './solo-desk-repository.mjs';
// Exact operator-confirmed existing RingCentral relationship only; no fuzzy identity matching.
export async function districtSmsCohort(conversation,env={},store=null){
 if(store&&conversation?.id&&await store.get(CONTROL_PREFIX+conversation.id))return 'CONTROL';
 if(!env.COVERAGEFIT_DB||!conversation?.id)return null;
 const r=await env.COVERAGEFIT_DB.prepare("SELECT summary_json FROM cf_solo_sources WHERE workspace_id=? AND kind='district_pilot_v1' AND json_extract(summary_json,'$.conversation_id')=? LIMIT 2").bind(identity(env).workspace,conversation.id).all();
 const rows=r.results||[];if(rows.length>1)throw new Error('Conflicting pilot SMS relationships require producer review.');
 return rows.length?parse(rows[0].summary_json).cohort:null;
}
