// One-off, offline-only unified Preview certification fixture package.
// Nine prior Action Quality cases PLUS three NEW fictional Command Center cases.
// This script never calls Cloudflare, RingCentral, a database or any provider.
import {generatePreviewFixturePackage} from './prepare-producer-action-preview-fixtures.mjs';
import {createHash,randomUUID} from 'node:crypto';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const q=v=>"'"+String(v).replaceAll("'","''")+"'";
const hash=v=>createHash('sha256').update(v).digest('hex').slice(0,32);
const plusDays=(now,n)=>new Date(new Date(now).getTime()+n*86400000).toISOString().slice(0,10);
export function generateCommandCenterFixturePackage({runId,workspaceId,head,now=new Date()}={}){
 const base=generatePreviewFixturePackage({runId,workspaceId,head,now});
 const at=new Date(now).toISOString();
 const verifiedDate=plusDays(now,45),conflictDate=plusDays(now,68);
 const extra={};
 const sql=[];
 const insert=(table,fields,values)=>{
  sql.push('INSERT INTO '+table+' ('+fields.join(',')+') VALUES ('+values.map(q).join(',')+') ON CONFLICT DO NOTHING;');
 };
 function source(id,kind,sid,v){
  insert('cf_solo_sources',['workspace_id','kind','source_id','opportunity_id','summary_json','updated_at'],
   [workspaceId,kind,sid,id,JSON.stringify(v),at]);
 }
 for(const kind of ['review_pending','renewal_verified','renewal_conflict']){
  const id='qa-'+runId+'-cc_'+kind;
  extra[kind]=id;
  insert('cf_solo_opportunities',
   ['id','workspace_id','owner_id','contact_json','source','reason','products','deadline','stage','status','last_mutation_id','created_at','updated_at'],
   [id,workspaceId,'dylan-haysbert',JSON.stringify({name:'Synthetic QA Command Center '+kind}), 'preview_certification','Synthetic combined Preview QA','AUTO','','inquiry','open','qa-cc-'+runId,at,at]);
  source(id,'preview_command_center_fixture_v1','qa-cc-marker-'+runId+'-'+kind,
   {suite:'COVERAGEFIT_COMBINED_COMMAND_CENTER_1',run_id:runId,scenario:kind,synthetic:true});
  if(kind==='review_pending'){
   const cid='sms-live-'+hash(runId+':cc:'+kind);
   source(id,'district_pilot_v1','qa-cc-pilot-'+runId,
    {pilot_id:'SIGNAL_DISTRICT_PILOT_1',pilot_phase:'NEW_LEAD',cohort:'SIGNAL',conversation_id:cid,
     received_at:at,source_lead_key:'synthetic:'+runId+':review_pending'});
   const recent=new Date(new Date(now).getTime()-120000).toISOString();
   const message={id:'qa-cc-msg-'+hash(runId),direction:'inbound',
    body:'Please help me compare auto coverage.',occurredAt:recent};
   const sms={id:cid,signal:{managed:true,revision:3,decision_2:'ASK_ONE_QUESTION',priority:'HIGH',
    latest_inbound:message.body,reply:'When does your current auto policy renew?',draft_status:'pending',
    facts:{line:'AUTO'},new_facts:{},contact_suppressed:false,az_sync_status:'none'},transcript:[message],
    smsConsent:{status:'unknown'},contactPhone:'',businessPhone:''};
   insert('sms_conversations',['record_key','data_json','metadata_json','created_at','updated_at','expires_at'],
    ['sms-live-conversations/'+cid,JSON.stringify(sms),JSON.stringify({synthetic:true,runId}),at,at,'']);
  }else{
   source(id,'web','qa-cc-web-'+runId+'-'+kind,{origin:'preview_certification',synthetic:true,run_id:runId});
   source(id,'renewal_verification_v1','qa-cc-confirm-'+runId+'-'+kind,
    {renewal_exact_date:verifiedDate,verification_status:'customer_confirmed',confirmed_at:at,synthetic:true});
   if(kind==='renewal_conflict')source(id,'lead','qa-cc-raw-'+runId,
    {rawFacts:{renewal_date:conflictDate},synthetic:true});
  }
 }
 const comment=[
  '-- Additional combined Command Center fictional QA only. No UPDATE/DELETE/POST.',
  '-- Run only on independently verified isolated Preview D1 with all new flags OFF until intentional Preview enablement.',
  '-- Each insert is idempotent and never alters existing records.',
  ...sql,
  '-- Exactly three additional Command Center QA source markers expected.',
  "SELECT COUNT(*) AS command_center_marker_count FROM cf_solo_sources WHERE workspace_id="+q(workspaceId)+" AND kind='preview_command_center_fixture_v1' AND json_extract(summary_json,'$.run_id')="+q(runId)+";"
 ].join('\n')+'\n';
 return {sql:base.sql+'\n'+comment,
  manifest:{...base.manifest,combined_suite:'COMMAND_CENTER_UNIFIED_1.0',command_center_fixtures:extra,expected_renewal_date:verifiedDate,
   deployment_evidence:'Operator to verify exact immutable Preview Pages build SHA',
   isolation_evidence:'Operator to independently verify Preview and Production D1 UUIDs differ'},
  fixtures:{...base.fixtures,...extra},runId,workspaceId};
}
async function main(){
 const args=Object.fromEntries(process.argv.slice(2).filter(x=>x.startsWith('--')&&x.includes('=')).map(x=>{const i=x.indexOf('=');return [x.slice(2,i),x.slice(i+1)]}));
 const result=generateCommandCenterFixturePackage({runId:args['run-id']||'qa-'+randomUUID(),workspaceId:args.workspace,head:args.head});
 const out=resolve(args.out||'.preview-unified-local');
 await mkdir(out,{recursive:true,mode:0o700});
 await writeFile(resolve(out,'command-center-unified-fixtures.sql'),result.sql,{mode:0o600});
 await writeFile(resolve(out,'command-center-unified-manifest.json'),JSON.stringify(result.manifest,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({status:'OFFLINE_FIXTURE_READY',records:Object.keys(result.fixtures).length,
  sql_path:resolve(out,'command-center-unified-fixtures.sql'),manifest_path:resolve(out,'command-center-unified-manifest.json'),
  provider_calls:0,database_changes:0},null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{
 console.error('Combined fixture generation failed: '+String(e?.message||e));process.exitCode=2;
});
