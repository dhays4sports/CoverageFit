// Observed enrolled-cohort metrics only. No reference values feed calculations.
export function efficiencySummary(records,flags){return ['CONTROL','SIGNAL'].map(cohort=>{
 const rows=records.filter(r=>r.cohort===cohort),n=rows.length,g={cohort,enrolled:n,directional:true,completeness:{},metric_completeness:{}};
 const known=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
 for(const k of flags){g[k]=rows.filter(r=>r[k]===true).length;g[k+'_known']=rows.filter(r=>typeof r[k]==='boolean').length;g.completeness[k]=`${g[k+'_known']} / ${n} reviewed`;}
 g.effort_complete=rows.filter(r=>r.effort_complete&&known(r.producer_minutes)).length;
 g.recorded_minutes=rows.some(r=>known(r.producer_minutes))?rows.reduce((s,r)=>s+(known(r.producer_minutes)?r.producer_minutes:0),0):null;
 g.producer_minutes=n&&g.effort_complete===n?g.recorded_minutes:null;
 g.call_complete=rows.filter(r=>r.calls_complete&&known(r.call_attempts)).length;
 g.call_attempts=n&&g.call_complete===n?rows.reduce((s,r)=>s+r.call_attempts,0):null;
 g.call_sources=[...new Set(rows.flatMap(r=>r.call_sources||[]))];
 g.talk_complete=rows.filter(r=>r.calls_complete&&known(r.talk_minutes)).length;
 g.talk_minutes=n&&g.talk_complete===n?rows.reduce((s,r)=>s+r.talk_minutes,0):null;
 g.premium_verified=rows.filter(r=>r.bind===true&&known(r.bound_premium)&&r.bound_premium>0).length;
 g.bound_premium=n&&g.bind_known===n&&g.premium_verified===g.bind?rows.reduce((s,r)=>s+(r.bind===true?r.bound_premium:0),0):null;
 g.farmers_count_known=rows.filter(r=>r.bind===false||(r.bind===true&&Number.isInteger(r.farmers_policy_count)&&r.farmers_policy_count>=0)).length;
 g.farmers_policy_count=n&&g.farmers_count_known===n?rows.reduce((s,r)=>s+(r.bind===true?r.farmers_policy_count:0),0):null;
 Object.assign(g.completeness,{producer_minutes:`${g.effort_complete} / ${n} complete`,call_attempts:`${g.call_complete} / ${n} attributable; ${g.call_sources.join(', ')||'unavailable'}`,talk_minutes:`${g.talk_complete} / ${n} duration-complete`,bound_premium:`${g.premium_verified} verified / ${g.bind} observed binds; ${g.bind_known} / ${n} bind reviews`,farmers_policy_count:`${g.farmers_count_known} / ${n} reviewed`,enrolled:`${n} enrolled`});
 const ratio=(name,a,b,deps,mult=1)=>{g[name]=a!=null&&b>0?a/b*mult:null;g.metric_completeness[name]=deps.map(k=>g.completeness[k]||`${g[k+'_known']} / ${n} reviewed`).join(' · ');};
 for(const k of ['useful_conversation','quote_ready','quote','bind','future_intent']){
  const count=n&&g[k+'_known']===n?g[k]:null;
  ratio('minutes_per_'+k,g.producer_minutes,count,['producer_minutes',k]);
  ratio(k+'_per_producer_hour',count,g.producer_minutes,[k,'producer_minutes'],60);
  ratio(k+'_per_100_leads',count,n,[k,'enrolled'],100);
 }
 for(const k of ['useful_conversation','quote','bind']){
  const count=n&&g[k+'_known']===n?g[k]:null;
  ratio('calls_per_'+k,g.call_attempts,count,['call_attempts',k]);
  ratio('talk_minutes_per_'+k,g.talk_minutes,count,['talk_minutes',k]);
  ratio('premium_per_'+k,g.bound_premium,count,['bound_premium',k]);
 }
 ratio('calls_per_100_leads',g.call_attempts,n,['call_attempts','enrolled'],100);
 ratio('premium_per_100_leads',g.bound_premium,n,['bound_premium','enrolled'],100);
 ratio('premium_per_producer_hour',g.bound_premium,g.producer_minutes,['bound_premium','producer_minutes'],60);
 ratio('premium_per_call',g.bound_premium,g.call_attempts,['bound_premium','call_attempts']);
 ratio('premium_per_talk_hour',g.bound_premium,g.talk_minutes,['bound_premium','talk_minutes'],60);
 return g;
});}
