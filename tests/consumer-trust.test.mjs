import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const client=await readFile(new URL('../assets/js/signal-continue.mjs',import.meta.url),'utf8');
function harness(response,path='/s/'+'A'.repeat(43)){
 const all=[];let active=null;
 class Element{constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.hidden=false;this.textContent='';all.push(this);}append(...els){this.children.push(...els);}replaceChildren(...els){this.children=els;}setAttribute(k,v){this.attrs[k]=v;}focus(){active=this;}querySelector(tag){return this.children.find(e=>e.tag===tag)||null;}}
 const nodes=Object.fromEntries(['step','status','actions','start','pause'].map(k=>[k,new Element(k)]));
 const context=vm.createContext({location:{pathname:path},document:{querySelector:s=>nodes[s.slice(1)],querySelectorAll:()=>all.filter(e=>e.tag==='button'),createElement:t=>new Element(t)},fetch:async()=>{if(response instanceof Error)throw response;return response;},Date});
 vm.runInContext(client,context);return {nodes,context,active:()=>active};
}
test('expired or invalid token does not expose server message or leave sales actions active',async()=>{
 const h=harness({ok:false,status:404,json:async()=>({error:{message:'private opportunity ID internal stack'}})});
 await h.nodes.start.onclick();assert.match(h.nodes.status.textContent,/expired/);assert.doesNotMatch(h.nodes.status.textContent,/private|stack/);assert.equal(h.nodes.actions.hidden,true);assert.equal(h.nodes.step.children.length,0);assert.equal(h.active(),h.nodes.status);
});
test('network uncertainty offers resume without claiming last answer saved',async()=>{
 const h=harness(Error('secret transport detail'));await h.nodes.start.onclick();assert.match(h.nodes.status.textContent,/couldn’t confirm/);assert.equal(h.nodes.step.children[0].textContent,'Resume safely');assert.equal(h.nodes.step.attrs['aria-busy'],'false');
});
test('question and completion move focus; submitted-answer review remains available',async()=>{
 const h=harness({ok:true,json:async()=>({done:false,question:{prompt:'What changed?',id:'reason',options:[{label:'Renewal increased',code:'price'}]},saved_answers:[{question:'Known context',answer:'Saved'}]})});
 await h.nodes.start.onclick();assert.equal(h.active().textContent,'What changed?');assert.equal(h.nodes.step.children[0].tag,'details');
 vm.runInContext("state={done:true,message:'Thanks — Dylan has what he needs.'};render();",h.context);assert.equal(h.nodes.actions.hidden,true);assert.equal(h.active().textContent,'Your check-in is saved');
});
test('pause provides immediate reentry without restarting a questionnaire',async()=>{
 const h=harness({ok:true,json:async()=>({done:false,question:{prompt:'Next useful question',id:'intent',options:[]}})});await h.nodes.start.onclick();h.nodes.pause.onclick();assert.equal(h.nodes.actions.hidden,true);assert.equal(h.nodes.step.children[2].textContent,'Resume my check-in');await h.nodes.step.children[2].onclick();assert.equal(h.active().textContent,'Next useful question');
});
test('direct landing without token offers safe human help',()=>{const h=harness(null,'/signal-continue');assert.match(h.nodes.step.textContent,/personalized.*Dylan/);});
test('consumer title stays canonical and personalized page contains identity, disclosure and no external assets',async()=>{
 const p=JSON.parse(await readFile(new URL('../producer.json',import.meta.url),'utf8'));assert.equal(p.title,'Insurance Producer');
 const html=await readFile(new URL('../signal-continue.html',import.meta.url),'utf8');assert.match(html,/4528400/);assert.match(html,/Virginia Tam Insurance Agency, Inc./);assert.match(html,/no-referrer/);assert.match(html,/noindex/);assert.match(html,/href="\/privacy\/"/);assert.match(html,/href="\/terms\/"/);assert.doesNotMatch(html,/(?:src|href)="https?:/);assert.doesNotMatch(html,/Opportunity Priority|cohort|CONTROL|FIV/);
});
