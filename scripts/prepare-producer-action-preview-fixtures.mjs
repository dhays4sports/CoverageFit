// COVERAGEFIT-PRODUCER-ACTION-QUALITY: OFFLINE Preview fixture package generator.
// Generates SQL and a private certification manifest. NEVER connects to a DB,
// Cloudflare, RingCentral, OpenAI, AgencyZoom, Calendar, or production APIs.
// Generated SQL must be executed ONLY via a verified isolated Preview D1 Console.
import {createHash,randomUUID} from 'node:crypto';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CERT_CASES} from './certify-producer-action-preview.mjs';

const VALID_RUN=/^[a-z0-9_-]{12,60}$/;
const VALID_WORKSPACE=/^[a-zA-Z0-9:_-]{3,140}$/;
const VALID_SHA=/^[a-f0-9]{40}$/;
const quote=v=>"'"+String(v).replaceAll("'","''")+"'";
const j=v=>quote(JSON.stringify(v));
const iso=d=>new Date(d).toISOString();
const stamp=(at,minutes)=>iso(new Date(at).getTime()+minutes*60000);
const hash=v=>createHash('sha256').update(v).digest('hex').slice(0,32);

export function generatePreviewFixturePackage({
 runId,workspaceId,head,now=new Date(),deploymentEvidence='VERIFY EXACT IMMUTABLE PREVIEW DEPLOYMENT',
 isolationEvidence='VERIFY DISTINCT PREVIEW AND PRODUCTION D1 IDS'
}={}){
 if(!VALID_RUN.test(String(runId||'')))throw Error('invalid_preview_run_id');
 if(!VALID_WORKSPACE.test(String(workspaceId||'')))throw Error('invalid_workspace_id');
 if(!VALID_SHA.test(String(head||'')))throw Error('invalid_40_character_head');
 const at=iso(now),recent=stamp(now,-2),due=stamp(now,5),later=stamp(now,45);
 const kinds=Object.keys(CERT_CASES),fixtures={},sql=[
 '-- COVERAGEFIT SYNTHETIC QA: PREVIEW D1 ONLY, NEVER PRODUCTION.',
 '-- Operator must independently verify actual Preview D1 database ID != Production D1 database ID.',
 '-- Verify database identity in Cloudflare UI, not from SQL text or a manifest assertion.',
 '-- This script is insert-only/idempotent. It never alters existing opportunities.',
 '-- It uses NO real phone/email, NO sender registration and NO provider calls.',
 '-- D1 executes semicolon-separated statements as a batch; do NOT add BEGIN/COMMIT.',
 '-- If any existing row has the same generated ID, do NOT try to overwrite it.',
 '-- Run ID: '+runId,
 '-- Workspace: '+workspaceId,
 '-- Generated at: '+at,
 ''
 ];
 const add=(table,fields,values)=>{
  sql.push(`INSERT INTO ${table} (${fields.join(',')}) VALUES (${values.map(quote).join(',')}) ON CONFLICT DO NOTHING;`);
 };
 const source=(id,kind,sourceId,summary)=>{
  add('cf_solo_sources',['workspace_id','kind','source_id','opportunity_id','summary_json','updated_at'],
   [workspaceId,kind,sourceId,id,JSON.stringify(summary),at]);
 };
 for(const kind of kinds){
  const id='qa-'+runId+'-'+kind;
  fixtures[kind]=id;
  const markerId='qa-marker-'+runId+'-'+kind;
  const name='Synthetic QA '+kind;
  add('cf_solo_opportunities',
   ['id','workspace_id','owner_id','contact_json','source','reason','products','deadline','stage','status','last_mutation_id','created_at','updated_at'],
   [id,workspaceId,'dylan-haysbert',JSON.stringify({name}), 'preview_certification','Synthetic Preview QA only','AUTO','','inquiry','open','qa-fixture-'+runId,at,at]);
  source(id,'preview_cert_fixture_v1',markerId,{suite:'PRODUCER_ACTION_QUALITY_1',run_id:runId,scenario:kind,synthetic:true});
  if(['ask_one_question','call','stop','opt_out','control','test_excluded'].includes(kind)){
   const cohort=kind==='control'?'CONTROL':'SIGNAL';
   const pilotPhase=kind==='test_excluded'?'TEST':'NEW_LEAD';
   const conversationId='sms-live-'+hash(runId+':'+kind);
   const pilot={pilot_id:'SIGNAL_DISTRICT_PILOT_1',pilot_phase:pilotPhase,cohort,conversation_id:conversationId,
    received_at:at,source_lead_key:'synthetic:'+runId+':'+kind,
    ...(kind==='test_excluded'?{synthetic:true,is_test:true}:{})};
   source(id,'district_pilot_v1','qa-pilot-'+runId+'-'+kind,pilot);
   if(['ask_one_question','call','stop','opt_out'].includes(kind)){
    const inbound={id:'qa-message-'+hash(kind+':'+runId),direction:'inbound',body:
     kind==='call'?'Please call me about insurance':kind==='ask_one_question'?'I would like an auto quote':kind==='stop'?'STOP':'Please stop contacting me',occurredAt:recent};
    const signal={
     managed:true,revision:1,latest_inbound:inbound.body,priority:'MEDIUM',
     decision_2:kind==='ask_one_question'?'ASK_ONE_QUESTION':'CALL',
     reply:kind==='ask_one_question'?'When does your current policy renew?':'',
     facts:{line:'AUTO',...(kind==='call'?{explicit_call_request:true}:{})},
     new_facts:kind==='call'?{explicit_call_request:true}:{},
     draft_status:'none',contact_suppressed:kind==='stop',
     az_sync_status:'none'
    };
    if(kind==='stop')signal.decision_2='STOP';
    const sms={id:conversationId,signal,transcript:[inbound],
      smsConsent:{status:kind==='opt_out'?'opted_out':'unknown'},
      firstPartyOpportunityId:null,contactPhone:'',businessPhone:''};
    add('sms_conversations',
     ['record_key','data_json','metadata_json','created_at','updated_at','expires_at'],
     ['sms-live-conversations/'+conversationId,JSON.stringify(sms),JSON.stringify({synthetic:true,runId}),at,at,'']);
   }
  }else{
   source(id,'web','qa-web-'+runId+'-'+kind,{origin:'preview_certification',run_id:runId,synthetic:true});
   if(kind==='due_callback'){
    add('cf_solo_tasks',
     ['id','workspace_id','opportunity_id','assignee_id','work_type','title','due_at','state','priority','source_key','created_at'],
     ['qa-task-'+runId,id, id,'dylan-haysbert','outreach','Callback as requested',due,'open','20','qa:callback:'+runId,at]
    );
    // Fix workspace_id inserted with the actual workspace below when rendering.
    sql[sql.length-1]=sql[sql.length-1].replace(quote(id)+','+quote(id)+','+quote('dylan-haysbert'),quote(workspaceId)+','+quote(id)+','+quote('dylan-haysbert'));
   }
   if(['due_appointment','tentative_calendar'].includes(kind)){
    source(id,'calendar','qa-calendar-'+runId+'-'+kind,{
     eventId:'qa-event-'+runId+'-'+kind,status:kind==='due_appointment'?'scheduled':'tentative',
     start:kind==='due_appointment'?due:later,title:'Synthetic QA insurance review',
     eventUrl:null,synthetic:true});
   }
  }
  sql.push('');
 }
 sql.push('-- Read-only postcheck: exactly 9 synthetic source markers in the intended workspace/run.');
 sql.push(`SELECT COUNT(*) AS qa_marker_count FROM cf_solo_sources WHERE workspace_id=${quote(workspaceId)} AND kind='preview_cert_fixture_v1' AND json_extract(summary_json,'$.run_id')=${quote(runId)};`);
 const manifest={schema_version:'1.1',synthetic_only:true,run_id:runId,head,
  isolation_evidence:isolationEvidence,deployment_evidence:deploymentEvidence,fixtures};
 return {sql:sql.join('\n')+'\n',manifest,fixtures,runId,workspaceId,at};
}

async function main(){
 const flags=Object.fromEntries(process.argv.slice(2).filter(x=>x.startsWith('--')&&x.includes('=')).map(x=>{const i=x.indexOf('=');return [x.slice(2,i),x.slice(i+1)]}));
 const runId=flags['run-id']||'qa-'+randomUUID();
 const output=resolve(flags.out||'.preview-qa-local');
 const result=generatePreviewFixturePackage({
  runId,workspaceId:flags.workspace,head:flags.head,
  isolationEvidence:flags['isolation-evidence']||'Operator must separately attest Preview DB differs from Production DB',
  deploymentEvidence:flags['deployment-evidence']||'Operator must verify immutable deployment commit in Cloudflare'
 });
 await mkdir(output,{recursive:true,mode:0o700});
 await writeFile(resolve(output,'producer-action-preview-fixtures.sql'),result.sql,{mode:0o600});
 await writeFile(resolve(output,'producer-action-preview-manifest.json'),JSON.stringify(result.manifest,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({status:'GENERATED_OFFLINE_ONLY',run_id:runId,
  sql_file:resolve(output,'producer-action-preview-fixtures.sql'),
  manifest_file:resolve(output,'producer-action-preview-manifest.json'),
  cases:Object.keys(CERT_CASES).length,db_changed:false},null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error('Fixture package not generated: '+e.message);process.exitCode=2});
