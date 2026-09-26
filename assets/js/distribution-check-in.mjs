const root=document.querySelector('#review');
let state=null,busy=false;
function el(tag,text,attrs={}){const node=document.createElement(tag);if(text)node.textContent=text;for(const [k,v]of Object.entries(attrs))node.setAttribute(k,v);return node;}
function button(text,action){const b=el('button',text,{type:'button'});b.addEventListener('click',action);return b;}
function focus(){const heading=root.querySelector('h2');heading?.setAttribute('tabindex','-1');heading?.focus();}
async function request(body){
  if(busy)return;busy=true;root.querySelectorAll('button').forEach(b=>b.disabled=true);
  try{
    const response=await fetch('/api/distribution/journey',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const value=await response.json();
    if(!response.ok&&!value.deliveryPending)throw new Error(response.status===404?'This review has expired or is unavailable. Reply to Dylan’s message or contact him to continue.':'We couldn’t save that step. Reload your saved answers before trying again.');
    state=value;render();
  }catch(error){
    root.replaceChildren(el('h2','Let’s pick up safely'),el('p',error.message.includes('review')||error.message.includes('save')?error.message:'The connection was interrupted. Your saved answers are still available.'));
    root.append(button('Reload saved answers',()=>request({action:'load'})));focus();
  }finally{busy=false;root.querySelectorAll('button').forEach(b=>b.disabled=false);}
}
function contact(){
  root.replaceChildren(el('h2','Ask Dylan to follow up'));
  const form=el('form');
  for(const [name,label,type]of [['name','Your name','text'],['phone','Phone number','tel']]){
    const field=el('label',label),input=el('input','',{name,type,required:'',autocomplete:name==='name'?'given-name':'tel',maxlength:name==='name'?'80':'24'});field.append(input);form.append(field);
  }
  const channel=el('label','How would you like Dylan to respond?'),select=el('select','',{name:'mode'});
  select.append(el('option','Personal call',{value:'call'}),el('option','Personal text',{value:'text'}));channel.append(select);form.append(channel);
  if(['call','text'].includes(state.contactChoice))select.value=state.contactChoice;
  const label=el('label'),permission=el('input','',{type:'checkbox',name:'permission',required:''});label.append(permission,document.createTextNode(' I ask Dylan at Virginia Tam Insurance Agency, Inc. to contact me about this review using my chosen channel. This does not authorize automated marketing texts.'));form.append(label);
  const submit=el('button','Send my request',{type:'submit',class:'primary'});form.append(submit);
  form.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(form);request({action:'contact',revision:state.revision,name:data.get('name'),phone:data.get('phone'),mode:data.get('mode'),permission:data.has('permission')});});
  root.append(form,button('Back to my answers',render));focus();
}
function render(){
  root.replaceChildren();
  if(state.question){root.append(el('h2',state.question.prompt));for(const o of state.question.options)root.append(button(o.label,()=>request({action:'answer',revision:state.revision,questionId:state.question.id,code:o.code})));}
  else{root.append(el('h2',state.message||'Your answers are saved'));if(state.description)root.append(el('p',state.description));}
  if(state.deliveryPending)root.append(button('Retry delivery',()=>request({action:'retry_delivery'})));
  else if(!state.contactSubmitted){
    if(state.canBack)root.append(button('Back',()=>request({action:'back',revision:state.revision})));
    root.append(button('Ask Dylan to follow up',contact),el('p','You can leave now and resume this review on this device while it remains available.'));
  }
  focus();
}
request({action:'load'});
