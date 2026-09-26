(function(){
  'use strict';
  const boot=JSON.parse(document.querySelector('#entry-data').textContent),root=document.querySelector('#entry-review'),status=document.querySelector('#entry-status');
  let state=boot.state,started=Boolean(state.resumed),busy=false,finished=Boolean(state.contactSubmitted),answered=started;
  const el=(tag,text,attrs={})=>{const n=document.createElement(tag);if(text)n.textContent=text;for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
  const button=(text,fn)=>{const n=el('button',text,{type:'button'});n.onclick=fn;return n;};
  function metric(type){fetch(boot.api+'/events',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,handoff:boot.handoff}),keepalive:true}).catch(()=>{});}
  function focus(){root.querySelector('legend,h2')?.focus();}
  async function send(body){
    if(busy)return;busy=true;root.setAttribute('aria-busy','true');root.querySelectorAll('button').forEach(b=>b.disabled=true);status.textContent='Saving your answer…';
    try{
      const response=await fetch(boot.api+'/interact',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const value=await response.json();if(!response.ok&&!value.deliveryPending)throw Error('save');
      state=value;started=true;answered=true;finished=Boolean(state.contactSubmitted);status.textContent='Saved.';render();focus();
    }catch{
      status.textContent='We couldn’t confirm that step was saved. Your earlier answers are kept. Retry the step, or reload saved answers before continuing.';
      if(!root.querySelector('[data-reload]')){const b=button('Reload saved answers',()=>send({action:'load'}));b.dataset.reload='true';root.append(b);}
    }finally{busy=false;root.setAttribute('aria-busy','false');root.querySelectorAll('button').forEach(b=>b.disabled=false);}
  }
  function answer(code){send(started?{action:'answer',revision:state.revision,questionId:state.question.id,code}:{action:'start',handoff:boot.handoff,questionId:state.question.id,code});}
  function contact(){
    root.replaceChildren(el('h2','Ask Dylan to follow up',{tabindex:'-1'}));const form=el('form');
    for(const [name,label,type]of [['name','Your name','text'],['phone','Phone number','tel']]){const l=el('label',label),i=el('input','',{name,type,required:'',autocomplete:name==='name'?'given-name':'tel',maxlength:name==='name'?'80':'24'});l.append(i);form.append(l);}
    const l=el('label','How would you like Dylan to respond?'),select=el('select','',{name:'mode'});select.append(el('option','Personal call',{value:'call'}),el('option','Personal text',{value:'text'}));if(['call','text'].includes(state.contactChoice))select.value=state.contactChoice;l.append(select);form.append(l);
    const permission=el('label'),check=el('input','',{type:'checkbox',name:'permission',required:''});permission.append(check,document.createTextNode(' I ask Dylan at Virginia Tam Insurance Agency, Inc. to contact me about this review using my chosen channel. This does not authorize automated marketing texts.'));form.append(permission,el('button','Send my request',{type:'submit',class:'primary'}));
    form.onsubmit=e=>{e.preventDefault();const d=new FormData(form);send({action:'contact',revision:state.revision,name:d.get('name'),phone:d.get('phone'),mode:d.get('mode'),permission:d.has('permission')});};root.append(form,button('Back to my review',render));focus();
  }
  function render(){
    root.replaceChildren();if(state.question){const field=el('fieldset');field.append(el('legend',state.question.prompt,{tabindex:'-1'}));for(const o of state.question.options)field.append(button(o.label,()=>answer(o.code)));root.append(field);}
    else{root.append(el('h2',state.message||'Your answers are saved',{tabindex:'-1'}));if(state.description)root.append(el('p',state.description));}
    if(state.deliveryPending)root.append(button('Retry delivery',()=>send({action:'retry_delivery'})));
    else if(!state.contactSubmitted&&started){if(state.canBack)root.append(button('Back',()=>send({action:'back',revision:state.revision})));root.append(button('Ask Dylan to follow up',contact));}
  }
  root.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>answer(b.dataset.answer));
  if(started)render();
  metric('landing_view');if(!started&&state.question)metric('first_question_view');
  window.addEventListener('pagehide',()=>{if(answered&&!finished&&!state.complete)metric('abandon');});
})();
