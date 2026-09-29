export const AWL_NORMALIZATION_VERSION='AWL-NORM-1.0';
const HOME_HEADERS=["Buyer Name", "Lead Type", "Lead ID", "Date", "Needs Quote", "Best Day", "Best Time", "First Name", "Last Name", "Address", "City", "County", "State", "Zipcode", "Day Phone", "Evening Phone", "Cell Phone", "Primary Email", "Alternative Email", "Current Residence", "Newly Purchased", "Currently Insured", "Current Carrier", "Renewal Date", "Credit History", "Applicant's Birthdate", "Yrs Current Residence", "Yrs Previous Residence", "Social Security #", "Address", "City, County", "State, Zip Code", "Garage Type", "Square Footage", "Dwelling Value", "Built Year", "Property Type", "Occupancy", "Foundation", "Alarm", "Stories", "Bedrooms/Bathrooms", "Fireplaces / Decks", "Major Upgrades", "Proximity to water", "Heating Type", "Wiring Type", "Panel Type", "Construction Class", "Construction Type", "Roof Type", "Exterior Walls", "Dog", "Content Value", "Fire Department", "Additional Features", "Coverage", "Sewer Backup Protection", "Liability Protection", "Earthquake Protection", "Deductible", "Number of Claims", "", " "];
const norm=x=>String(x).trim().toLowerCase().replace(/[^a-z0-9]/g,'');
const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)||/^\d{1,2}\/\d{1,2}\/\d{4}(?: 12:00:00\s*AM)?$/i.test(v);
export function normalizeAwlText(text){
 const warnings=[];let s=text.replace(/^\uFEFF/,'');
 if(s.startsWith('_csv_')){s=s.slice(5);warnings.push('AWL export prefix normalized');}
 const end=s.search(/[\r\n]/),head=end<0?s:s.slice(0,end);
 if(head.includes('"Credit Rating",","Currently Insurance"')){s=head.replace('"Credit Rating",","Currently Insurance"','"Credit Rating","Currently Insurance"')+(end<0?'':s.slice(end));warnings.push('Known AWL insurance-header defect normalized');}
 return {text:s,warnings};
}
export function normalizeAwlRawExport(headers,values){
 const h=[...headers],v=[...values],warnings=[];let schema='AWL-CANONICAL-1.0',columns=h.map((_,i)=>i);
 const fullHome=JSON.stringify(h.map(norm))===JSON.stringify(HOME_HEADERS.map(norm));
 // Exact observed 64-column home layout: blank at 22, carrier at 23,
 // renewal at 24, DOB at 26, claims at 62. Never infer arbitrary shifts.
 if(fullHome){
  schema='AWL-HOME-64-1.0';
  if(v.length!==64)return {headers:h,values:v,columns,schema,warnings,error:'AWL format not safely recognized — review source file'};
  if(v[22].trim()===''&&v[23].trim()&&!date(v[23].trim())&&date(v[24].trim())&&/^\d{4}-\d{2}-\d{2}$/.test(v[26].trim())&&/^\d+$/.test(v[62].trim())){
   v.splice(22,1);columns.splice(22,1);v.push('');columns.push(null);
   warnings.push('Known AWL home placeholder normalized; labeled fields realigned from verified schema');
  }else if(!date(v[23].trim()))return {headers:h,values:v,columns,schema,warnings,error:'AWL home alignment unresolved — review original source file'};
 }
 // Union headers introduced by external combination lose original schema alignment.
 if(h.some(x=>norm(x)==='buyername')&&h.some(x=>norm(x)==='buyerid'))return {headers:h,values:v,columns,schema:'AWL-UNVERIFIED-COMBINED',warnings,error:'Combined AWL schema not safely recognized — upload original exports'};
 if(!fullHome&&h.some(x=>norm(x)==='buyername')&&h.some(x=>norm(x)==='currentcarrier'))return {headers:h,values:v,columns,schema:'AWL-HOME-UNRECOGNIZED',warnings,error:'AWL home schema not safely recognized — review original source file'};
 // Only discard paired empty padding. A value without a label is never reassigned.
 while(h.length&&!h.at(-1).trim()&&(v.length<h.length||!String(v.at(-1)||'').trim())){h.pop();if(v.length>h.length)v.pop();columns.pop();}
 while(v.length>h.length&&!v.at(-1).trim())v.pop();
 if(h.some((x,i)=>!x.trim()&&String(v[i]||'').trim()))return {headers:h,values:v,columns,schema,warnings,error:'Unlabeled source values require review; no column shifting applied'};
 if(h.length!==v.length)return {headers:h,values:v,columns,schema,warnings,error:'INVALID RAW FILE: header/value count mismatch — review source file'};
 if(h.some(x=>norm(x)==='buyerid')&&h.some(x=>norm(x)==='vehicle'))schema='AWL-AUTO-GROUPS-1.0';
 return {headers:h,values:v,columns,schema,warnings};
}
