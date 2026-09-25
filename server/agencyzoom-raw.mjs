import {pacificInputToISO} from '../assets/js/solo-desk-model.mjs';
import {normalizeE164} from './ringcentral-client.mjs';
export const RAW_VERSION='AZ-RAW-1.0';
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
 if(cell.length>8000||row.length>250||rows.length>10)throw Error('INVALID RAW FILE: field/row limit exceeded');
 }
 if(quoted)throw Error('INVALID RAW FILE: unclosed quote');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows;
}
function dateOnly(v){if(!v)return null;let s=clean(v),m;if(m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))s=`${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`;if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)throw Error('AMBIGUOUS DATE: use YYYY-MM-DD');return s;}
export function rawReceived(v){const s=clean(v);if(/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{3})?)?(?:Z|[+-]\d\d:\d\d)$/.test(s)){const d=new Date(s);if(Number.isFinite(d.getTime()))return d.toISOString();}const m=s.match(/^(\d{4}-\d\d-\d\d)[ T](\d\d:\d\d)(?::(\d\d))?$/);if(!m)throw Error('MISSING/AMBIGUOUS RECEIVED DATE: enter timestamp with timezone');dateOnly(m[1]);if(Number(m[3]||0)>59)throw Error('Invalid seconds');return new Date(Date.parse(pacificInputToISO(m[1]+'T'+m[2]))+Number(m[3]||0)*1000).toISOString();}
export function parseRaw(file,overrides={}){
 if(file?.error==='oversized')throw Error('OVERSIZED FILE: maximum 64 KB');
 if(!file||!String(file.name||'').toLowerCase().endsWith('.csv'))throw Error('UNSUPPORTED FILE: CSV required');
 if(typeof file.text!=='string'||new TextEncoder().encode(file.text).length>65536)throw Error('OVERSIZED FILE: maximum 64 KB');
 if(/\u0000|\ufffd/.test(file.text))throw Error('INVALID ENCODING: use UTF-8 CSV');
 let text=file.text.replace(/^\uFEFF/,'').replace(/^_csv_/,'');const warnings=[];
 // Exact, observed AWL header defect only. No general column-shift guessing.
 const end=text.search(/[\r\n]/),header=end<0?text:text.slice(0,end);
 if(header.includes('"Credit Rating",","Currently Insurance"')){text=header.replace('"Credit Rating",","Currently Insurance"','"Credit Rating","Currently Insurance"')+text.slice(end);warnings.push('Known AWL insurance-header defect normalized');}
 const rows=csvRows(text);if(rows.length!==2)throw Error('INVALID RAW FILE: one header and one lead per file required');
 const [headers,values]=rows;while(headers.length&&!clean(headers.at(-1)))headers.pop();while(values.length>headers.length&&!clean(values.at(-1)))values.pop();if(headers.length!==values.length)throw Error('INVALID RAW FILE: header/value count mismatch');
 const fields={},governance={A:0,B:0,C:0,D:0,E:0};headers.forEach((h,i)=>{const n=norm(h),category=fieldClass(h);governance[category]++;const key=RAW_FIELDS[n]?.[1];if(!key)return;const value=clean(values[i]);if(!value)return;if(fields[key]&&fields[key]!==value){if(key==='name')return;throw Error('AMBIGUOUS FIELD: '+h);}fields[key]=value;});
 for(const key of ['lead_key','received_at','mobile','line','source_key','state'])if(overrides[key])fields[key]=clean(overrides[key]);
 const source_key=fields.source_key||(/^AWL-/i.test(file.name)?'awl':'unknown');
 const id=fields.az_id||fields.lead_id||fields.provider_id;if(fields.az_id&&fields.lead_id&&fields.az_id!==fields.lead_id)throw Error('AMBIGUOUS LEAD ID: identifiers conflict');
 let key=fields.lead_key|| (id?(fields.az_id?'agencyzoom':source_key==='unknown'?'agencyzoom':norm(source_key))+':'+id:'');if(!key)throw Error('AMBIGUOUS LEAD ID: stable original identifier required');
 if(!/^[a-z0-9][a-z0-9_.:/-]{2,179}$/i.test(key))throw Error('AMBIGUOUS LEAD ID: invalid stable key');
 const received_at=rawReceived(fields.received_at),line=({automobile:'AUTO',auto:'AUTO',home:'HOME',homeowners:'HOME',homeowner:'HOME',condo:'HOME',renters:'HOME',bundle:'HOME_AUTO',homeauto:'HOME_AUTO',life:'LIFE'})[norm(fields.line)]||null;
 if(!line&&fields.line)throw Error('AMBIGUOUS PRODUCT: select the actual personal-lines product');if(!line)warnings.push('Product unknown; ask only if needed');
 if(!['ca','california'].includes((fields.state||'').toLowerCase()))throw Error('OUTSIDE/MISSING CALIFORNIA: confirm actual state');
 const rawPhone=fields.mobile||fields.phone||fields.evening_phone||'',phone=rawPhone?normalizeE164(rawPhone):'';
 if(rawPhone&&(!/^[+()\d .-]+$/.test(rawPhone)||!/^\+1[2-9]\d{2}[2-9]\d{6}$/.test(phone)))throw Error('MALFORMED PHONE');if(!phone)warnings.push('MISSING PHONE: no SMS link');
 const facts={line};
 for(const [,target] of Object.values(RAW_FIELDS))if(target&&target!=='line'&&Object.values(RAW_FIELDS).some(([g,k])=>g==='B'&&k===target)&&fields[target])facts[target]=fields[target];
 for(const k of ['renewal_date','closing_date','insured_since'])if(facts[k])facts[k]=dateOnly(facts[k]);
 if(/other|not listed|unknown/i.test(facts.current_carrier||''))delete facts.current_carrier;
 if(facts.currently_insured)facts.currently_insured=/^yes$/i.test(facts.currently_insured)?true:/^no$/i.test(facts.currently_insured)?false:null;
 const first_name=fields.first_name||fields.name?.split(/\s+/)[0]||'',last_name=fields.last_name||fields.name?.split(/\s+/).slice(1).join(' ')||'';
 return {mapping_version:RAW_VERSION,lead_key:key.toLowerCase(),received_at,line,source_key,contact:{firstName:first_name,lastName:last_name,name:[first_name,last_name].filter(Boolean).join(' '),mobile:phone,email:fields.email||'',contactBasis:'RAW identity only; no SMS/marketing permission inferred'},facts,provenance:Object.fromEntries(Object.keys(facts).map(k=>[k,{source:'agencyzoom_raw',observed_at:received_at,mapping_version:RAW_VERSION}])),warnings,governance};
}
