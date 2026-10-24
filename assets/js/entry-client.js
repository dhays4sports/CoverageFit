(function(){
  'use strict';
  const boot=JSON.parse(document.querySelector('#entry-data').textContent),root=document.querySelector('#entry-review'),status=document.querySelector('#entry-status');
  let state=boot.state,started=Boolean(state.resumed),busy=false,finished=Boolean(state.contactSubmitted),answered=started;
  let contactDraft={};
  const el=(tag,text,attrs={})=>{const n=document.createElement(tag);if(text)n.textContent=text;for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
  const button=(text,fn)=>{const n=el('button',text,{type:'button'});n.onclick=fn;return n;};
  function metric(type){fetch(boot.api+'/events',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,handoff:boot.handoff}),keepalive:true}).catch(()=>{});}
  function focus(){root.querySelector('legend,h2')?.focus();}
  async function send(body){
    if(busy)return;busy=true;root.setAttribute('aria-busy','true');root.querySelectorAll('button').forEach(b=>b.disabled=true);status.textContent='Saving your answer…';
    try{
      const response=await fetch(boot.api+'/interact',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,...(started&&state.reviewVersion?{reviewVersion:state.reviewVersion}:{})})});
      const value=await response.json();if(value.reviewChanged){status.textContent=value.message;root.replaceChildren(el('h2','Your review changed in another tab',{tabindex:'-1'}),button('Reload current review',()=>location.reload()));focus();return;}if(!response.ok&&!value.deliveryPending)throw Error('save');
      state=value;if(value.newReview)contactDraft={};started=true;answered=!value.newReview;finished=Boolean(state.contactSubmitted);status.textContent=value.newReview?'New review started.':'Saved.';render();focus();if(value.newReview)metric('first_question_view');
    }catch{
      status.textContent='We couldn’t confirm that step was saved. Your earlier answers are kept. Retry the step, or reload saved answers before continuing.';
      if(!root.querySelector('[data-reload]')){const b=button('Reload saved answers',()=>send({action:'load'}));b.dataset.reload='true';root.append(b);}
    }finally{busy=false;root.setAttribute('aria-busy','false');root.querySelectorAll('button').forEach(b=>b.disabled=false);}
  }
  function answer(code,value){send(started?{action:'answer',revision:state.revision,questionId:state.question.id,code,...(value!==undefined?{value}:{})}:{action:'start',handoff:boot.handoff,questionId:state.question.id,code});}
  function contact(){
    root.replaceChildren(el('h2','Ask Dylan to follow up',{tabindex:'-1'}));const form=el('form');
    for(const [name,label,type]of [['name','Your name','text'],['phone','Phone number','tel']]){const l=el('label',label),i=el('input','',{name,type,required:'',autocomplete:name==='name'?'given-name':'tel',maxlength:name==='name'?'80':'24'});l.append(i);form.append(l);}
    const l=el('label','How would you like Dylan to respond?'),select=el('select','',{name:'mode'});select.append(el('option','Personal call',{value:'call'}),el('option','Personal text',{value:'text'}));if(['call','text'].includes(state.contactChoice))select.value=state.contactChoice;l.append(select);form.append(l);
    const permission=el('label'),check=el('input','',{type:'checkbox',name:'permission',required:''});permission.append(check,document.createTextNode(' I ask Dylan at Virginia Tam Insurance Agency, Inc. to contact me about this review using my chosen channel. This does not authorize automated marketing texts. Consent is not a condition of purchase.'));form.append(permission,el('button','Send my request',{type:'submit',class:'primary'}));
    if(state.buyer){const l=el('label','Convenient time (optional)'),t=el('select','',{name:'contactTime'});for(const [v,label]of [['','No preference'],['morning','Morning'],['afternoon','Afternoon'],['evening','Evening']])t.append(el('option',label,{value:v}));l.append(t);form.insertBefore(l,permission);form.append(el('p','Times are preferences, not confirmed appointments.'));}
    for(const input of form.elements){if(input.name in contactDraft){if(input.type==='checkbox')input.checked=contactDraft[input.name]===true;else input.value=contactDraft[input.name];}}
    form.oninput=()=>{for(const input of form.elements)if(input.name)contactDraft[input.name]=input.type==='checkbox'?input.checked:input.value;};
    form.onsubmit=e=>{e.preventDefault();const d=new FormData(form);send({action:'contact',revision:state.revision,name:d.get('name'),phone:d.get('phone'),mode:d.get('mode'),permission:d.has('permission'),...(state.buyer?{contactTime:d.get('contactTime')||''}:{})});};root.append(form,button('Back to my review',render));focus();
  }
  function render(){
    root.replaceChildren();if(state.question){const field=el('fieldset');field.append(el('legend',state.question.prompt,{tabindex:'-1'}));if(state.question.input==='zip'){const f=el('form'),l=el('label','California ZIP code'),i=el('input','',{name:'zip',inputmode:'numeric',autocomplete:'postal-code',pattern:'9[0-9]{4}',maxlength:'5',required:''});i.value=state.question.value||'';l.append(i);f.append(l,el('p',state.question.hint),el('button','Continue',{type:'submit',class:'primary'}));i.oninput=()=>i.setCustomValidity('');f.onsubmit=e=>{e.preventDefault();if(Number(i.value)<90001||Number(i.value)>96162){i.setCustomValidity('Enter a California ZIP code, or choose I don’t know yet.');i.reportValidity();return;}answer('zip',i.value);};field.append(f);}
    for(const o of state.question.options)field.append(button(o.label,()=>answer(o.code)));root.append(field);}
    else{root.append(el('h2',state.message||'Your answers are saved',{tabindex:'-1'}));if(state.description)root.append(el('p',state.description));}
    if(state.urgent){root.append(el('p','Closing within 7 days? You can call Dylan directly while your request is reviewed.'),el('a','Call (408) 327-6377',{href:'tel:+14083276377'}));}
    if(state.deliveryPending){root.append(button('Retry delivery',()=>send({action:'retry_delivery'})),el('p','Start a New Review is available after this saved request reaches Dylan’s workspace.'));}
    if(state.contactSubmitted){if(!state.deliveryPending)root.append(button('Start a New Review',()=>send({action:'new_review',handoff:boot.handoff})));root.append(el('a','Contact Dylan',{href:boot.handoff.presentation==='408_contextual'?'/contact/':'/support/'}));}
    else if(!state.contactSubmitted&&started){if(state.canBack)root.append(button('Back',()=>send({action:'back',revision:state.revision})));root.append(button('Ask Dylan to follow up',contact));}
  }
  root.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>answer(b.dataset.answer));
  if(started)render();
  metric('landing_view');if(!started&&state.question)metric('first_question_view');
  window.addEventListener('pagehide',()=>{if(answered&&!finished&&!state.complete)metric('abandon');});
})();
