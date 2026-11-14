import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const client=readFileSync(new URL('../assets/js/entry-client.js',import.meta.url),'utf8');
// Small DOM fixture executes the actual client; real browser checks are separate.
function harness(initial){
 let active=null;const requests=[],queue=[];
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.checked=false;this.disabled=false;this._text='';this._value=undefined;}
  setAttribute(k,v){this.attrs[k]=String(v);if(k==='name'||k==='type')this[k]=String(v);if(k==='value')this._value=String(v);}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}set textContent(v){this._text=String(v);this.children=[];}
  get value(){return this._value??(this.tag==='select'?this.children[0]?.value||'':'');}set value(v){this._value=v;}
  append(...nodes){this.children.push(...nodes);}insertBefore(node,before){this.children.splice(this.children.indexOf(before),0,node);}
  replaceChildren(...nodes){this.children=nodes;this._text='';}
  get all(){return this.children.flatMap(c=>[c,...c.all]);}
  get elements(){return this.all.filter(e=>['input','select','button'].includes(e.tag));}
  querySelectorAll(selector){return this.all.filter(e=>selector.split(',').some(s=>s[0]==='['?Object.hasOwn(e.attrs,s.slice(1,-1))||s==='[data-reload]'&&e.dataset.reload:s===e.tag));}
  querySelector(s){return this.querySelectorAll(s)[0]||null;}focus(){active=this;}
 }
 const root=new Element('section'),status=new Element('p'),data=new Element('script');data.textContent=JSON.stringify({handoff:{entry:'tech',presentation:'408_contextual'},state:initial,api:'/api/entry'});
 const nodes={'#entry-review':root,'#entry-status':status,'#entry-data':data};
 const ctx=vm.createContext({document:{querySelector:s=>nodes[s],createElement:t=>new Element(t),createTextNode:s=>{const e=new Element('text');e.textContent=s;return e;}},window:{addEventListener(){}},location:{reload(){}},FormData:class{constructor(form){this.values=new Map(form.elements.filter(e=>e.name&&(e.type!=='checkbox'||e.checked)).map(e=>[e.name,e.type==='checkbox'?'on':e.value]));}get(k){return this.values.get(k)||null;}has(k){return this.values.has(k);}},fetch:async(url,init)=>{const body=JSON.parse(init.body);requests.push(body);if(url.endsWith('/events'))return {ok:true,json:async()=>({ok:true})};const next=queue.shift();if(next instanceof Error)throw next;return {ok:next?.status?next.status<400:true,json:async()=>next?.body||next};}});
 vm.runInContext(client,ctx);
 const settle=async()=>{await new Promise(setImmediate);await new Promise(setImmediate);};
 const button=text=>root.all.find(e=>e.tag==='button'&&e.textContent===text);
 return {root,status,requests,queue,get active(){return active},button,settle,async click(text){const b=button(text);assert.ok(b,'Missing button '+text);b.onclick();await settle();},field:name=>root.all.find(e=>e.name===name)};
}
const q={id:'q',prompt:'Question',options:[{code:'a',label:'Answer'}]};
const state=(extra={})=>({ok:true,directContact:true,resumed:true,question:q,complete:false,revision:1,reviewVersion:'version',canBack:true,...extra});
test('opening exposes one early contact action and does not create a session before it is requested',async()=>{
 const h=harness(state({resumed:false,canBack:false,revision:0}));assert.equal(h.requests.filter(r=>r.action).length,0);h.queue.push(state({showContact:true,revision:0,canBack:false}));await h.click('Prefer to talk? Have Dylan contact me.');assert.equal(h.requests.find(r=>r.action).action,'open_contact');assert.ok(h.root.querySelector('form'));assert.equal(h.field('permission').checked,false);assert.equal(h.active.tag,'h2');assert.ok(!h.requests.some(r=>r.action==='contact'));
});
test('the last saved answer opens contact immediately and focuses the heading',async()=>{
 const h=harness(state());h.queue.push(state({question:null,complete:true,revision:2}));await h.click('Answer');assert.ok(h.root.querySelector('form'));assert.equal(h.active.textContent,'How would you like me to reach you?');assert.equal(h.button('Ask Dylan to follow up'),undefined);assert.ok(h.requests.some(r=>r.type==='contact_form_opened'));assert.ok(!h.requests.some(r=>r.action==='contact'));
});
test('final save failure or lost response retains the question until an explicit saved-state reload',async()=>{
 for(const failure of [new Error('lost response'),{status:503,body:{ok:false}}]){const h=harness(state());h.queue.push(failure);await h.click('Answer');assert.equal(h.root.querySelector('form'),null);assert.ok(h.button('Answer'));assert.match(h.status.textContent,/couldn’t confirm/);h.queue.push(state({question:null,complete:true,revision:2}));await h.click('Reload saved answers');assert.ok(h.root.querySelector('form'));}
});
test('completed resume opens contact without stealing focus; submitted and pending states stay distinct',()=>{
 const h=harness(state({question:null,complete:true}));assert.ok(h.root.querySelector('form'));assert.equal(h.active,null);
 for(const pending of [true,false]){const done=harness(state({question:null,complete:true,contactSubmitted:true,deliveryPending:pending,message:pending?'Saved, retry delivery':'Reached Dylan'}));assert.equal(done.root.querySelector('form'),null);assert.ok(done.button(pending?'Retry delivery':'Start a New Review'));}
});
test('Back opens a real question; returning after edits preserves the in-memory draft',async()=>{
 const h=harness(state({question:null,complete:true}));h.field('name').value='Synthetic Draft';h.field('phone').value='2025550123';h.field('mode').value='text';h.field('permission').checked=true;
 h.queue.push(state({revision:2}));await h.click('Back to my answers');assert.ok(h.button('Answer'));assert.equal(h.root.querySelector('form'),null);
 h.queue.push(state({question:null,complete:true,revision:3}));await h.click('Answer');assert.equal(h.field('name').value,'Synthetic Draft');assert.equal(h.field('mode').value,'text');assert.equal(h.field('permission').checked,true);
});
test('early Back with no answers returns to the opening without inventing an answer',async()=>{
 const h=harness(state({resumed:false,revision:0,canBack:false}));h.queue.push(state({showContact:true,revision:0,canBack:false}));await h.click('Prefer to talk? Have Dylan contact me.');await h.click('Back to my answers');assert.ok(h.button('Answer'));assert.equal(h.requests.filter(r=>r.action).length,1);
});
test('accepted submission and new review clear the previous draft and permission',async()=>{
 const h=harness(state({question:null,complete:true,combined:true}));h.field('name').value='Synthetic';h.field('phone').value='2025550123';h.field('permission').checked=true;h.root.querySelector('form').oninput();
 h.queue.push(state({question:null,complete:true,contactSubmitted:true,deliveryPending:false,message:'Accepted'}));h.root.querySelector('form').onsubmit({preventDefault(){}});await h.settle();assert.equal(h.root.querySelector('form'),null);
 h.queue.push(state({newReview:true,question:q,revision:0,canBack:false,combined:false}));await h.click('Start a New Review');h.queue.push(state({showContact:true,canBack:false,revision:0}));await h.click('Prefer to talk? Have Dylan contact me.');assert.equal(h.field('name').value,'');assert.equal(h.field('permission').checked,false);
});
test('Home + auto and buyer/condo optional time preferences remain in the shared form',()=>{
 const combined=harness(state({question:null,complete:true,combined:true}));assert.match(combined.root.textContent,/Reviewing: Home \+ auto/);
 for(const type of ['buyer','condo']){const h=harness(state({question:null,complete:true,[type]:true}));assert.ok(h.field('contactTime'));assert.match(h.root.textContent,/not confirmed appointments/);}
});
