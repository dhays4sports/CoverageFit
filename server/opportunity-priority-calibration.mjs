const parse=value=>{try{return JSON.parse(value||'{}')}catch{return {}}};
const clean=(value,max=180)=>String(value??'').trim().replace(/[<>\u0000-\u001f\u007f]/g,'').slice(0,max);
const stamp=()=>new Date().toISOString();
const ratio=(a,b)=>b?Math.round((a/b)*1000)/10:null;
const moneyRatio=(cents,minutes)=>minutes?Math.round((Number(cents||0)*60)/minutes):null;
const evidenceStatus=n=>n>=30?'usable':n>=10?'directional':'early';
export const PRIORITY_CALIBRATION_BUILD='CF-OPPORTUNITY-PRIORITY-CAL-1.0';
const BANDS=Object.freeze([
  {key:'tier_a',label:'Tier A · 80–100',min:80,max:100},
  {key:'tier_b',label:'Tier B · 65–79',min:65,max:79},
  {key:'tier_c',label:'Tier C · 50–64',min:50,max:64},
  {key:'tier_d',label:'Tier D · 30–49',min:30,max:49},
  {key:'tier_e',label:'Tier E · 0–29',min:0,max:29}
]);

export async function capturePriorityBaseline(repo,opportunityId,projection){
  if(!projection||projection.status!=='ready'||!Number.isInteger(projection.score))return null;
  const d=projection.dimensions||{},at=stamp();
  try{
    await repo.sql(`INSERT OR IGNORE INTO cf_opportunity_priority_baselines(
      workspace_id,opportunity_id,score,need_points,intent_points,timing_points,fit_points,queue,projection_json,engine,basis,captured_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
      repo.scope.workspace,opportunityId,projection.score,d.need?.points,d.intent?.points,d.timing?.points,d.fit?.points,
      projection.queue,JSON.stringify(projection),projection.engine||'CF-OPPORTUNITY-PRIORITY-1.0','first_ready',at).run();
    const row=await repo.sql('SELECT * FROM cf_opportunity_priority_baselines WHERE workspace_id=? AND opportunity_id=?',repo.scope.workspace,opportunityId).first();
    return row?{score:Number(row.score),queue:row.queue,capturedAt:row.captured_at,basis:row.basis}:null;
  }catch(error){if(/no such table/i.test(String(error?.message||'')))return null;throw error;}
}

function blankBand(band){return {...band,opportunities:0,qualified:0,quotesPrepared:0,recommendationsDelivered:0,closeAsked:0,bound:0,boundPremiumCents:0,premiumEvidenceGaps:0,producerMinutes:0,effortMeasuredOpportunities:0};}
function finish(group){return {...group,bindRatePct:ratio(group.bound,group.opportunities),quoteRatePct:ratio(group.quotesPrepared,group.opportunities),premiumPerOpportunityCents:group.opportunities?Math.round(group.boundPremiumCents/group.opportunities):null,producerMinutesPerBind:group.bound&&group.producerMinutes?Math.round((group.producerMinutes/group.bound)*10)/10:null,premiumPerProducerHourCents:group.producerMinutes?moneyRatio(group.boundPremiumCents,group.producerMinutes):null,effortCoveragePct:ratio(group.effortMeasuredOpportunities,group.opportunities),evidenceStatus:evidenceStatus(group.opportunities)};}
function bandForScore(score){return BANDS.find(b=>score>=b.min&&score<=b.max)||null;}
function signalKey(dimension,item){return `${dimension}:${item.code||'unknown'}`;}
function addSignal(map,dimension,item,row){
  const key=signalKey(dimension,item),g=map.get(key)||{key,dimension,code:item.code||'unknown',label:clean(item.label)||item.code||'Unknown signal',points:Number(item.points)||0,opportunities:0,bound:0,boundPremiumCents:0,producerMinutes:0};
  g.opportunities++;if(row.bound_at)g.bound++;if(row.written_premium_cents!=null)g.boundPremiumCents+=Number(row.written_premium_cents);if(row.producer_minutes!=null)g.producerMinutes+=Number(row.producer_minutes);map.set(key,g);
}

export function opportunityPriorityCalibration(repo){
  const workspace=repo.scope.workspace;
  return {
    async ready(){await repo.sql('SELECT opportunity_id FROM cf_opportunity_priority_baselines WHERE workspace_id=? LIMIT 1',workspace).first();},
    async summary(params=new URLSearchParams()){
      const days=Math.max(14,Math.min(365,Number(params.get?.('days')||90)||90)),to=new Date(),from=new Date(to.getTime()-days*86400000),fromIso=from.toISOString(),toIso=to.toISOString();
      const rows=await repo.rows(`SELECT b.*,m.qualified_possession_at,m.quote_prepared_at,m.recommendation_delivered_at,m.close_asked_at,m.bound_at,m.written_premium_cents,m.producer_minutes,m.producer_minutes_basis
        FROM cf_opportunity_priority_baselines b
        LEFT JOIN cf_acq_opportunity_measurements m ON m.workspace_id=b.workspace_id AND m.opportunity_id=b.opportunity_id
        WHERE b.workspace_id=? AND b.captured_at>=? AND b.captured_at<=? ORDER BY b.captured_at`,workspace,fromIso,toIso);
      const bands=new Map(BANDS.map(b=>[b.key,blankBand(b)])),signals=new Map();
      for(const row of rows){
        const band=bandForScore(Number(row.score));if(!band)continue;const g=bands.get(band.key);
        g.opportunities++;if(row.qualified_possession_at)g.qualified++;if(row.quote_prepared_at)g.quotesPrepared++;if(row.recommendation_delivered_at)g.recommendationsDelivered++;if(row.close_asked_at)g.closeAsked++;if(row.bound_at)g.bound++;if(row.written_premium_cents!=null)g.boundPremiumCents+=Number(row.written_premium_cents);else if(row.bound_at)g.premiumEvidenceGaps++;if(row.producer_minutes!=null){g.producerMinutes+=Number(row.producer_minutes);g.effortMeasuredOpportunities++;}
        const p=parse(row.projection_json);for(const dimension of ['need','intent','timing','fit'])for(const item of p?.dimensions?.[dimension]?.reasons||[])addSignal(signals,dimension,item,row);
      }
      const bandRows=BANDS.map(b=>finish(bands.get(b.key))).filter(g=>g.opportunities>0);
      const signalRows=[...signals.values()].map(s=>({...s,bindRatePct:ratio(s.bound,s.opportunities),premiumPerOpportunityCents:s.opportunities?Math.round(s.boundPremiumCents/s.opportunities):null,premiumPerProducerHourCents:s.producerMinutes?moneyRatio(s.boundPremiumCents,s.producerMinutes):null,evidenceStatus:evidenceStatus(s.opportunities)})).sort((a,b)=>b.opportunities-a.opportunities||b.boundPremiumCents-a.boundPremiumCents).slice(0,40);
      const total=finish(bandRows.reduce((acc,g)=>{for(const k of ['opportunities','qualified','quotesPrepared','recommendationsDelivered','closeAsked','bound','boundPremiumCents','premiumEvidenceGaps','producerMinutes','effortMeasuredOpportunities'])acc[k]+=Number(g[k]||0);return acc;},blankBand({key:'all',label:'All first-ready scores',min:0,max:100})));
      const warnings=[];
      if(total.effortCoveragePct==null||total.effortCoveragePct<60)warnings.push('Producer-time evidence is sparse. Treat revenue/premium-per-hour comparisons as directional until more actual minutes are recorded.');
      if(bandRows.every(row=>row.evidenceStatus==='early'))warnings.push('Score-band samples are still early. Do not change point rules from small samples.');
      if(total.premiumEvidenceGaps)warnings.push('Some bound opportunities lack verified term-premium evidence and are excluded from premium comparisons.');
      return {build:PRIORITY_CALIBRATION_BUILD,period:{days,from:fromIso,to:toIso},baseline:'first_ready_opportunity_priority',observationalOnly:true,autoRecalibration:false,bands:bandRows,signals:signalRows,totals:total,warnings};
    }
  };
}
