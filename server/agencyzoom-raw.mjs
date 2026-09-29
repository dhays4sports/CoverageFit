import {normalizeAwlText,normalizeAwlRawExport,AWL_NORMALIZATION_VERSION} from './awl-normalization.mjs';
import {pacificInputToISO} from '../assets/js/solo-desk-model.mjs';
import {normalizeE164} from './ringcentral-client.mjs';
export const RAW_VERSION='AZ-RAW-2.0';
const norm=x=>String(x).trim().toLowerCase().replace(/[^a-z0-9]/g,'');
const clean=x=>String(x||'').trim().slice(0,240);
export const RAW_FIELDS={
 leadid:['A','lead_id'],agencyzoomleadid:['A','az_id'],originalleadid:['A','provider_id'],provider:['A','source_key'],leadsource:['A','source_key'],source:['A','source_key'],
 name:['A','name'],firstname:['A','first_name'],lastname:['A','last_name'],date:['A','received_at'],receivedat:['A','received_at'],receiveddate:['A','received_at'],
 leadtype:['B','line'],product:['B','line'],line:['B','line'],state:['A','state'],address:['A','address'],city:['A','city'],zipcode:['A','zip'],zip:['A','zip'],
 cellphone:['A','mobile'],mobile:['A','mobile'],phone:['A','phone'],dayphone:['A','phone'],eveningphone:['A','evening_phone'],primaryemail:['A','email'],email:['A','email'],
 currentlyinsurance:['B','currently_insured'],currentlyinsured:['B','currently_insured'],currentinsuranceco:['B','current_carrier'],currentcarrier:['B','current_carrier'],currentinsurer:['B','current_carrier'],
 experationdate:['B','renewal_date'],expirationdate:['B','renewal_date'],renewaldate:['B','renewal_date'],insuredsince:['B','insured_since'],needsquote:['B','stated_need'],
 vehicle:['B','vehicle'],ownership:['B','vehicle_ownership'],usage:['B','vehicle_usage'],annualmiles:['B','annual_mileage'],bipd:['B','liability_limits'],compcoll:['B','deductibles'],umbi:['B','umbi'],umpd:['B','umpd'],filingrequired:['B','filing_requirement'],
 currentresidence:['B','residence'],propertytype:['B','property_type'],occupancy:['B','occupancy'],closingdate:['B','closing_date'],bundleinterest:['B','bundle_interest'],shoppingintent:['B','shopping_intent'],
 buyerid:['C',null],bestday:['C',null],besttime:['C',null],vin:['C',null],comments:['C',null],primarydriver:['C',null],county:['C',null],fax:['C',null],alternativeemail:['C',null],
};
const prohibited=/age|dob|birth|gender|sex|race|ethnic|religion|health|medical|credit|income|wealth|affluen|marital|education|occupation|goodstudent|relation|propensity/;
export function fieldClass(header){const n=norm(header);return RAW_FIELDS[n]?.[0]||(prohibited.test(n)?'D':'E');}
export function csvRows(text){
 const rows=[];let row=[],cell='',quoted=false,closed=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;}
 else if(c==='"'){if(cell.trim()||closed)throw Error('INVALID RAW FILE: malformed quoting');quoted=true;}
 else if(c===','||c==='\n'||c==='\r'){row.push(cell);cell='';closed=false;if(c!==','){if(c==='\r'&&text[i+1]==='\n')i++;if(row.some(x=>x.trim()))rows.push(row);row=[];}}
 else {if(closed&&!/\s/.test(c))throw Error('INVALID RAW FILE: characters after quote');cell+=c;}
 if(cell.length>8000||row.length>250||rows.length>101)throw Error('INVALID RAW FILE: field/row limit exceeded');
 }
 if(quoted)throw Error('INVALID RAW FILE: unclosed quote');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);if(rows.some(r=>r.length>250))throw Error('INVALID RAW FILE: maximum 250 columns');return rows;
}
function dateOnly(v){if(!v)return null;let s=clean(v),m;if(m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))s=`${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`;if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)throw Error('AMBIGUOUS DATE: use YYYY-MM-DD');return s;}
export function rawReceived(v){const s=clean(v);if(/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{3})?)?(?:Z|[+-]\d\d:\d\d)$/.test(s)){const d=new Date(s);if(Number.isFinite(d.getTime()))return d.toISOString();}const m=s.match(/^(\d{4}-\d\d-\d\d)[ T](\d\d:\d\d)(?::(\d\d))?$/);if(!m)throw Error('MISSING/AMBIGUOUS RECEIVED DATE: enter timestamp with timezone');dateOnly(m[1]);if(Number(m[3]||0)>59)throw Error('Invalid seconds');return new Date(Date.parse(pacificInputToISO(m[1]+'T'+m[2]))+Number(m[3]||0)*1000).toISOString();}
export const RAW_FILE_BYTES=262144;
export const RAW_BATCH_LEADS=100;
const correctionFields=message=>/LEAD ID/.test(message)?['lead_key']:/RECEIVED DATE|Invalid seconds|Invalid.*time/.test(message)?['received_at']:/PRODUCT/.test(message)?['line']:/CALIFORNIA/.test(message)?['state']:/PHONE/.test(message)?['mobile']:[];
export function parseRawRows(file){
 try{
  if(file?.error==='oversized')throw Error('OVERSIZED FILE: maximum 256 KB');
  if(!file||!String(file.name||'').toLowerCase().endsWith('.csv'))throw Error('UNSUPPORTED FILE: CSV required');
  if(typeof file.text!=='string'||new TextEncoder().encode(file.text).length>RAW_FILE_BYTES)throw Error('OVERSIZED FILE: maximum 256 KB');
  if(/\u0000|\ufffd/.test(file.text))throw Error('INVALID ENCODING: use UTF-8 CSV');
  const text=normalizeAwlText(file.text),rows=csvRows(text.text);
  if(rows.length<2||!rows[0].some(x=>['leadid','agencyzoomleadid','originalleadid'].includes(norm(x))))throw Error('INVALID RAW FILE: recognized lead header and data required');
  if(rows.length>RAW_BATCH_LEADS+1)throw Error('CSV maximum is 100 leads');
  return rows.slice(1).map((values,i)=>{
   const normalized=normalizeAwlRawExport(rows[0],values),partial={mapping_version:RAW_VERSION,normalization_version:AWL_NORMALIZATION_VERSION,schema:normalized.schema,warnings:[...text.warnings,...normalized.warnings]};
   try{
    const lead=mapRaw(file,normalized,file.rowCorrections?.[i+2]||(rows.length===2?file.corrections||{}:{}),partial);
    if(normalized.error)return {row_number:i+2,lead,error:normalized.error,correction_fields:[],stage:'schema'};
    return {row_number:i+2,lead,correction_fields:[]};
   }catch(e){return {row_number:i+2,lead:partial,error:normalized.error||e.message,correction_fields:normalized.error?[]:correctionFields(e.message),stage:normalized.error?'schema':'validation'};}
  });
 }catch(e){return [{row_number:null,error:e.message,correction_fields:[],stage:'file'}];}
}
export function parseRaw(file,overrides={}){
 // Retain the legacy single-lead API and its 64 KB bound for existing callers.
 if(typeof file?.text==='string'&&new TextEncoder().encode(file.text).length>65536)throw Error('OVERSIZED FILE: maximum 64 KB');
 const results=parseRawRows({...file,corrections:overrides});
 if(results.length!==1)throw Error('INVALID RAW FILE: one header and one lead per file required by single-lead parser');
 if(results[0].error)throw Error(results[0].error);
 return results[0].lead;
}
function mapRaw(file,normalized,overrides,partial){
 const {headers,values,columns}=normalized,warnings=partial.warnings;
 const fields={},governance={A:0,B:0,C:0,D:0,E:0},vehicles=[],sourceFields={};let vehicleIndex=-1;
 const vehicleKeys={vehicle:'vehicle',ownership:'ownership',usage:'usage',annualmiles:'annual_mileage',compcoll:'deductibles',bipd:'liability_limits',umbi:'umbi',umpd:'umpd'};
 headers.forEach((h,i)=>{
  const base=h.replace(/\s*\(\d+\)$/, ''),n=norm(base),category=fieldClass(base);governance[category]++;
  // Do not map optional facts from structurally or semantically unverified rows.
  if(normalized.error&&(!normalized.schema.startsWith('AWL-HOME-64')&&normalized.schema!=='AWL-UNVERIFIED-COMBINED'||i>=19))return;
  if(n==='vehicle')vehicleIndex++;
  const value=clean(values[i]);if(!value)return;
  if(vehicleKeys[n]&&vehicleIndex>=0){vehicles[vehicleIndex]||={};vehicles[vehicleIndex][vehicleKeys[n]]=value;sourceFields.vehicles||=[];sourceFields.vehicles.push({header:h,column:columns[i]+1,entity:vehicleIndex});return;}
  const key=RAW_FIELDS[n]?.[1];if(!key||(/\(\d+\)$/.test(h)&&!vehicleKeys[n]))return;
  if(normalized.error&&!['lead_id','az_id','provider_id','name','first_name','last_name','received_at','line','state','mobile','phone','evening_phone','email','source_key'].includes(key))return;
  if(fields[key]&&fields[key]!==value){if(['name','address','city','zip','filing_requirement'].includes(key))return;throw Error('AMBIGUOUS FIELD: '+h);}
  fields[key]=value;sourceFields[key]||=[];sourceFields[key].push({header:h,column:columns[i]+1});
 });
 const corrections={};
 for(const key of ['lead_key','received_at','mobile','line','source_key','state'])if(overrides[key]){
  if(key==='lead_key'&&(fields.az_id||fields.lead_id||fields.provider_id))throw Error('IDENTITY CONFLICT: original stable ID cannot be overridden');
  if(key==='source_key'&&(/^AWL[-_]/i.test(file.name)||fields.source_key))throw Error('IDENTITY CONFLICT: established source cannot be overridden');
  if(key==='received_at'&&fields.received_at){let valid=false;try{rawReceived(fields.received_at);valid=true;}catch{}if(valid&&rawReceived(fields.received_at)!==rawReceived(overrides[key]))throw Error('RECEIVED DATE: valid original timestamp cannot be changed');}
  fields[key]=clean(overrides[key]);corrections[key]={source:'operator_correction'};
 }
 const source_key=fields.source_key||(/^AWL[-_]/i.test(file.name)||['AWL-HOME-64-1.0','AWL-AUTO-GROUPS-1.0'].includes(normalized.schema)?'awl':'unknown');
 const id=fields.az_id||fields.lead_id||fields.provider_id;if(fields.az_id&&fields.lead_id&&fields.az_id!==fields.lead_id)throw Error('AMBIGUOUS LEAD ID: identifiers conflict');
 let key=fields.lead_key|| (id?(fields.az_id?'agencyzoom':source_key==='unknown'?'agencyzoom':norm(source_key))+':'+id:'');if(!key)throw Error('AMBIGUOUS LEAD ID: stable original identifier required');
 if(!/^[a-z0-9][a-z0-9_.:/-]{2,179}$/i.test(key))throw Error('AMBIGUOUS LEAD ID: invalid stable key');
 Object.assign(partial,{lead_key:key.toLowerCase(),source_key,contact:{firstName:fields.first_name||fields.name?.split(/\s+/)[0]||'',name:fields.name||[fields.first_name,fields.last_name].filter(Boolean).join(' ')}});
 const received_at=rawReceived(fields.received_at);partial.received_at=received_at;
 const line=({automobile:'AUTO',auto:'AUTO',home:'HOME',homeinsurance:'HOME',homeowners:'HOME',homeowner:'HOME',condo:'HOME',renters:'HOME',bundle:'HOME_AUTO',homeauto:'HOME_AUTO',life:'LIFE'})[norm(fields.line)]||null;
 partial.line=line;
 if(!line&&fields.line)throw Error('AMBIGUOUS PRODUCT: select the actual personal-lines product');if(!line)warnings.push('Product unknown; ask only if needed');
 if(!['ca','california'].includes((fields.state||'').toLowerCase()))throw Error('OUTSIDE/MISSING CALIFORNIA: confirm actual state');
 const rawPhone=fields.mobile||fields.phone||fields.evening_phone||'',phone=rawPhone?normalizeE164(rawPhone):'';
 if(rawPhone&&(!/^[+()\d .-]+$/.test(rawPhone)||!/^\+1[2-9]\d{2}[2-9]\d{6}$/.test(phone)))throw Error('MALFORMED PHONE');if(!phone)warnings.push('MISSING PHONE: no SMS link');
 partial.contact={...partial.contact,mobile:phone};
 if(normalized.error)throw Error(normalized.error);
 const facts={line};
 const validVehicles=vehicles.filter(x=>x?.vehicle);if(validVehicles.length){facts.vehicles=validVehicles;facts.vehicle_count=validVehicles.length;facts.vehicle=validVehicles[0].vehicle;}
 for(const [,target] of Object.values(RAW_FIELDS))if(target&&target!=='line'&&Object.values(RAW_FIELDS).some(([g,k])=>g==='B'&&k===target)&&fields[target])facts[target]=fields[target];
 for(const k of ['renewal_date','closing_date','insured_since'])if(facts[k])facts[k]=dateOnly(facts[k].replace(/ 12:00:00\s*AM$/i,''));
 if(/other|not listed|unknown/i.test(facts.current_carrier||''))delete facts.current_carrier;
 if(facts.currently_insured)facts.currently_insured=/^yes$/i.test(facts.currently_insured)?true:/^no$/i.test(facts.currently_insured)?false:null;
 const first_name=fields.first_name||fields.name?.split(/\s+/)[0]||'',last_name=fields.last_name||fields.name?.split(/\s+/).slice(1).join(' ')||'';
 return {...partial,corrections,mapping_version:RAW_VERSION,lead_key:key.toLowerCase(),received_at,line,source_key,contact:{firstName:first_name,lastName:last_name,name:[first_name,last_name].filter(Boolean).join(' '),mobile:phone,email:fields.email||'',contactBasis:'RAW identity only; no SMS/marketing permission inferred'},facts,provenance:Object.fromEntries(Object.keys(facts).map(k=>[k,{source:'agencyzoom_raw',observed_at:received_at,mapping_version:RAW_VERSION,normalization_version:AWL_NORMALIZATION_VERSION,source_fields:sourceFields[k]||(['vehicle','vehicle_count'].includes(k)?sourceFields.vehicles:[])||[],...(overrides[k]?{operator_corrected:true}: {})}])),warnings,governance};
}
