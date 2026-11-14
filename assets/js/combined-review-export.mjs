// Portable, bounded view of an authenticated producer record. No new authority.
export function combinedReviewExport(detail){
 const source=(detail.sources||[]).find(s=>s.kind==='lead'&&s.summary?.context?.distribution?.professionalCombined?.version===1);
 if(!source)return null;
 const d=source.summary.context.distribution,c=d.professionalCombined;
 return {schemaVersion:'home-auto-review-1.0',opportunityId:detail.opportunity.id,sourceId:source.source_id,contactEntry:d.contactEntry||null,requestedProducts:[...c.requestedProducts],selectionSource:c.selectionSource,productEvidence:structuredClone(c.productEvidence),earliestReportedTiming:c.earliestReportedTiming,contact:structuredClone(detail.opportunity.contact),permission:structuredClone(source.summary.permission),attribution:structuredClone(source.summary.attribution),firstTouch:structuredClone(d.firstTouch),answers:structuredClone(d.answers),nextAction:c.nextAction};
}
export function combinedReviewRows(detail){
 const review=combinedReviewExport(detail);if(!review)return [];
 const reason={nonrenewal_notice:'Cancellation or nonrenewal notice',renewal_change:'Renewal or price changed',buying_home:'Buying a home',shopping_price:'Comparing options',coverage_review:'Coverage review',just_researching:'Just researching',new_vehicle:'New vehicle',add_driver:'Adding a driver',need_now:'Needs coverage now',renewal_price:'Renewal or price changed',coverage_change:'Changing coverage',just_comparing:'Comparing options'};
 const timing={now:'Today or now',within_14:'Within 2 weeks',within_30:'Within 30 days',days_31_60:'31–60 days',future:'Later',unknown:'Not sure yet'};
 const property={single_family:'House',condo:'Condo',townhome:'Townhome',other:'Other property',unsure:'Not sure yet'};
 const {home,auto}=review.productEvidence,p=review.permission;
 return [['Home — reason',reason[home.reasonCode]||'Not provided'],['Home — timing',timing[home.decisionTiming]||'Not provided'],['Auto — reason',reason[auto.reasonCode]||'Not provided'],['Auto — timing',timing[auto.decisionTiming]||'Not provided'],['Property type',property[home.propertyType]||'Not provided'],['Contact preference',p.callPermitted?'Personal call':p.personalTextPermitted?'Personal text':'Not recorded']];
}
