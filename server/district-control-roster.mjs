import {normalizeE164,ringCentralConfig} from './ringcentral-client.mjs';
import {smsLiveConversationId} from './sms-outbound-gateway.mjs';
import {sha256Hex} from './runtime-crypto.mjs';
import {writeOpsAudit} from './sms-operations-core.mjs';
export const CONTROL_PREFIX='sms-signal/district-control/';
export function parseControlCSV(text){
 if(typeof text!=='string'||text.length>24000)throw Error('Use a CSV under 24 KB, up to 100 phone numbers.');
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw Error('CSV has an unclosed quoted field.');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 const header=(rows.shift()||[]).map(x=>x.replace(/^\uFEFF/,'').trim().toLowerCase()),phoneIndex=header.indexOf('phone'),idIndex=header.indexOf('lead_id');
 if(phoneIndex<0||header.some(x=>!['phone','lead_id'].includes(x))||new Set(header).size!==header.length)throw Error('Use a phone header and optional lead_id header only.');
 if(!rows.length||rows.length>100)throw Error('Upload 1 to 100 control leads per file.');
 const seen=new Set();return rows.map((r,i)=>{if(r.length!==header.length)throw Error(`Row ${i+2}: wrong number of columns.`);const raw=r[phoneIndex].trim();if(!/^[+()\d .-]+$/.test(raw))throw Error(`Row ${i+2}: use a US phone number without extensions.`);const phone=normalizeE164(raw);if(!/^\+1[2-9]\d{2}[2-9]\d{6}$/.test(phone))throw Error(`Row ${i+2}: invalid US phone number.`);if(seen.has(phone))throw Error(`Row ${i+2}: duplicate phone number.`);seen.add(phone);return {phone,lead_id:idIndex>=0?r[idIndex].trim().slice(0,180):''};});
}
export async function prepareControlRoster(csv,options){const rows=parseControlCSV(csv),config=ringCentralConfig(options.env);const items=[];for(const row of rows){const conversation_id=await smsLiveConversationId(row.phone,config.fromNumber,config.conversationHashSecret);items.push({conversation_id,phone_last4:row.phone.slice(-4),lead_key_hash:row.lead_id?await sha256Hex(row.lead_id):null});}const fingerprint=await sha256Hex(JSON.stringify(items));return {items,fingerprint};}
export async function saveControlRoster(prepared,options){let added=0,existing=0;for(const item of prepared.items){const key=CONTROL_PREFIX+item.conversation_id;const old=await options.store.get(key);if(old){existing++;continue;}try{await options.store.setJSON(key,{pilot_id:'SIGNAL_DISTRICT_PILOT_1',cohort:'CONTROL',...item,created_at:new Date().toISOString(),basis:'operator_confirmed_preassigned_control',batch_fingerprint:prepared.fingerprint},{onlyIfNew:true});added++;}catch(e){if(await options.store.get(key))existing++;else throw e;}}await writeOpsAudit(options.store,'pilot_control_roster_imported',{detail:`CONTROL exclusions saved: ${added}; already present: ${existing}. No outreach or CRM change.`},options);return {added,existing};}
