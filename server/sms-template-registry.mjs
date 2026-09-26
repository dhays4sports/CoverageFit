import {SIGNAL_PREFIX,DEFAULT_TEMPLATES} from './sms-signal-core.mjs';
export const templatesFor=async store=>{
 const saved=(await store.get(SIGNAL_PREFIX+'templates'))?.templates;
 if(!saved)return DEFAULT_TEMPLATES;
 // Add newly introduced defaults without replacing customized or disabled entries.
 const ids=new Set(saved.map(t=>t.template_id));
 return [...saved,...DEFAULT_TEMPLATES.filter(t=>!ids.has(t.template_id))];
};
