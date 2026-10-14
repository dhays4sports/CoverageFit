/* CoverageFit Unified Command Center — operator-run READ ONLY.
   Generated offline with exact commit SHA, immutable Preview hostname, run ID.
   Only same-origin GET to a verified isolated Preview. No POST/send/Provider.
   Copy from the first "(async () => {" line through last "})();".
*/
(async () => {
 'use strict';
 const HOST='__PREVIEW_HOST__';
 const HEAD='__EXPECTED_HEAD__';
 const RUN='__RUN_ID__';
 const id=k=>'qa-'+RUN+'-'+k,cc=k=>'qa-'+RUN+'-cc_'+k;
 const names=['ask_one_question','call','due_callback','due_appointment','stop','opt_out','control','test_excluded','tentative_calendar'];
 const ccNames=['review_pending','renewal_verified','renewal_conflict'];
 const failures=[],passed=[];
 function check(name,condition,code='CHECK_FAILED'){
  if(condition)passed.push(name);else failures.push({check:name,code});
 }
 function blocked(e){console.error('COVERAGEFIT_UNIFIED_BLOCKED:',String(e?.message||e));}
 try{
  if(location.protocol!=='https:'||location.hostname!==HOST||!/^[a-f0-9]{8}\.coveragefit\.pages\.dev$/.test(HOST))
   throw Error('WRONG_IMMUTABLE_PREVIEW_HOST');
  if(!confirm('Confirm: the selected Preview D1 database has a DIFFERENT UUID from Production, and the SQL was seeded ONLY with fictional QA data. Continue READ-ONLY GET checks?'))
   return;
  const token=sessionStorage.getItem('coveragefit.producerInbox.token');
  if(!token||token.length<16)throw Error('PRODUCER_SESSION_REQUIRED');
  const req=async(path,auth=true)=>{
   const response=await fetch('/api/solo-desk/'+path,{
    method:'GET',credentials:'same-origin',cache:'no-store',redirect:'error',
    headers:auth?{Authorization:'Bearer '+token,Accept:'application/json'}:{Accept:'application/json'},
    signal:AbortSignal.timeout(20000)
   });
   if(!auth)return {status:response.status};
   if(!response.ok)throw Error('HTTP_'+response.status+':'+path.split('?')[0]);
   const data=await response.json();
   if(data?.ok!==true)throw Error('RESPONSE_NOT_OK:'+path.split('?')[0]);
   return data;
  };
  check('unauthenticated_401',(await req('producer-command-center',false)).status===401);
  // Prove every test record was seeded with fictional source provenance before
  // trusting the projected queues. Never echo actual customer records.
  const details={};
  for(const key of [...names,...ccNames]){
   const fullId=ccNames.includes(key)?cc(key):id(key);
   const data=await req('producer-detail?id='+encodeURIComponent(fullId));
   const sourceKind=ccNames.includes(key)?'preview_command_center_fixture_v1':'preview_cert_fixture_v1';
   const marker=(data.sources||[]).some(s=>s.kind===sourceKind&&s.summary?.run_id===RUN
    &&s.summary?.scenario===key&&s.summary?.synthetic===true);
   const contact=data.opportunity?.contact||{};
   const name=String(contact.name||'');
   const fields=[contact.mobile,contact.phone,contact.email].filter(Boolean).map(String);
   const safeFields=fields.every(v=>/example\.(invalid|test)$|^\+?1?20255501\d\d$/.test(v));
   if(data.opportunity?.id!==fullId||!marker||!/^Synthetic QA\b/.test(name)||!safeFields)
    throw Error('FIXTURE_PROVENANCE_MISSING:'+key);
   details[key]=data;
  }
  check('all_12_synthetic_sources',Object.keys(details).length===12);
  const center=await req('producer-command-center');
  check('today_inbox_enabled',center.enabled===true&&center.review_readonly_enabled===true);
  check('no_provider_certification_claim',center.coverage?.provider_inbound_live_certified===false);
  check('read_only_work',center.coverage?.read_only===true);
  check('today_call',(center.today||[]).some(x=>x.opportunity_id===id('call')&&x.next_action==='CALL_CUSTOMER'));
  check('review_draft_in_inbox',(center.inbox||[]).some(x=>x.opportunity_id===cc('review_pending')&&x.category==='DRAFT_REVIEW'));
  const prohibited=['stop','opt_out','control','test_excluded'].map(id);
  check('suppressed_control_test_excluded',prohibited.every(v=>!(center.today||[]).some(x=>x.opportunity_id===v)&&!(center.inbox||[]).some(x=>x.opportunity_id===v)));
  check('inbox_no_send_authority',(center.inbox||[]).every(x=>x.sms_send_eligible===false&&x.can_bulk_approve===false));
  const review=await req('producer-approval-preflight?ids='+encodeURIComponent(
   [cc('review_pending'),id('stop'),id('control'),id('test_excluded')].join(',')));
  const items=review.items||[],draft=items.find(x=>x.opportunity_id===cc('review_pending'));
  check('review_current_revision',review.count===4&&draft?.current_revision===3&&draft?.can_review===true);
  check('review_pending_content',draft?.draft_body==='When does your current auto policy renew?');
  check('stop_control_test_not_reviewable',items.filter(x=>x.opportunity_id!==cc('review_pending')).every(x=>x.can_review===false));
  check('selected_review_no_send',review.send_authority==='NONE'&&items.every(x=>x.can_send===false&&x.can_approve===false));
  const verified=await req('prospect-360?id='+encodeURIComponent(cc('renewal_verified')));
  const conflict=await req('prospect-360?id='+encodeURIComponent(cc('renewal_conflict')));
  check('renewal_confirmed_provenance',verified.facts?.renewal?.verification==='customer_confirmed'
   &&verified.facts?.renewal?.evidence?.some(x=>x.source_kind==='renewal_verification_v1'));
  check('renewal_conflict_not_overwritten',conflict.facts?.renewal?.verification==='conflicted'
   &&conflict.facts?.renewal?.conflict===true&&conflict.facts?.renewal?.value===null);
  check('renewal_never_sms_permission',verified.facts?.renewal?.sms_send_authorized===false
   &&conflict.facts?.contact_safety?.sms_authority==='NOT_EVALUATED');
  check('workspace_panel_visible',Boolean(document.querySelector('#command-center:not([hidden])')));
  check('workspace_no_new_send_controls',!document.querySelector('#command-center [data-cc-send],#command-center [data-cc-approve]'));
  const status=failures.length?'NO_GO':'PASS';
  console.table(failures.length?failures:[{check:'all_'+passed.length+'_combined_checks',result:'PASS'}]);
  console.log('COVERAGEFIT_UNIFIED_RESULT:',JSON.stringify({status,passed:passed.length,checked:passed.length+failures.length,
   failures,expected_deployment_head:HEAD.slice(0,7),origin:HOST,
   preview_isolation:'OPERATOR_ATTESTED_ONLY',browser_ui_automated:true,
   manual_desktop_mobile_keyboard_review:'STILL_REQUIRED',
   live_inbound:'NOT_CERTIFIED',actions:'GET_ONLY',sends:0}));
  console.info('Do not paste private tokens, Network headers, response JSON or real opportunity fields.');
 }catch(error){blocked(error);console.info('Do not share credentials or raw customer response bodies.');}
})();
