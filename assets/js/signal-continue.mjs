const token=location.pathname.match(/^\/s\/([A-Za-z0-9_-]{43})\/?$/)?.[1];
const step=document.querySelector('#step'),status=document.querySelector('#status'),actions=document.querySelector('#actions');
let state=null,busy=false;
function focusStep(){const heading=step.querySelector('h2');if(heading){heading.tabIndex=-1;heading.focus();}}
function showError(code){
 actions.hidden=true;
 const unavailable=[403,404,410].includes(code);
 status.textContent=unavailable?'This link is unavailable or has expired. Reply to Dylan’s text or call him for help continuing your review.':code===409?'Your review has changed. Resume to see the current question.':'We couldn’t confirm your last answer was saved. Resume to check your saved answers before trying again.';
 step.replaceChildren();
 if(!unavailable){const retry=document.createElement('button');retry.textContent='Resume safely';retry.onclick=()=>request({action:'resume'});step.append(retry);}
 status.focus();
}
async function request(payload){
 if(busy)return;busy=true;step.setAttribute('aria-busy','true');document.querySelectorAll('button').forEach(b=>b.disabled=true);status.textContent=payload.action==='resume'?'Opening your check-in…':'Saving your answer…';
 try{
  const r=await fetch('/api/signal/continue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,...payload}),cache:'no-store',referrerPolicy:'no-referrer'});
  if(!r.ok){showError(r.status);return;}
  const d=await r.json();if(!d||(!d.done&&(!d.question?.prompt||!Array.isArray(d.question.options))))throw Error('invalid response');
  state=d;render();status.textContent='';
 }catch{showError(503);}finally{busy=false;step.setAttribute('aria-busy','false');document.querySelectorAll('button').forEach(b=>b.disabled=false);}
}
function render(){
 step.replaceChildren();
 if(state.saved_answers?.length){const review=document.createElement('details'),title=document.createElement('summary');title.textContent='Review saved answers';review.append(title);for(const a of state.saved_answers){const p=document.createElement('p');p.textContent=a.question+' — '+a.answer;review.append(p);}step.append(review);}
 actions.hidden=!!state.done;
 const h=document.createElement('h2');h.textContent=state.done?'Your check-in is saved':state.question.prompt;step.append(h);
 if(state.done){const p=document.createElement('p');p.textContent=state.message;step.append(p);focusStep();return;}
 for(const o of state.question.options){const b=document.createElement('button');b.type='button';b.textContent=o.label;b.onclick=()=>request({revision:state.revision,question_id:state.question.id,code:o.code});step.append(b);}focusStep();
}
document.querySelector('#start').onclick=()=>request({action:'resume'});
actions.onclick=e=>{const action=e.target.dataset.action;if(action==='later'){const label=document.createElement('label');label.textContent='When would you like Dylan to reconnect? (Optional)';const date=document.createElement('input');date.type='date';date.min=new Date().toISOString().slice(0,10);label.append(date);const b=document.createElement('button');b.textContent='Save future timing';b.onclick=()=>request({action:'later',revision:state.revision,...(date.value?{future_date:date.value}:{})});step.replaceChildren(label,b);actions.hidden=true;date.focus();}else if(action)request({action,revision:state.revision});};
document.querySelector('#pause').onclick=()=>{actions.hidden=true;const h=document.createElement('h2');h.textContent='Your place is saved';const p=document.createElement('p');p.textContent='Your submitted answers are saved. Open this link again when it suits you. No need to start over.';const b=document.createElement('button');b.textContent='Resume my check-in';b.onclick=()=>request({action:'resume'});step.replaceChildren(h,p,b);focusStep();};
if(!token){step.textContent='Open the personalized check-in link Dylan sent you. If you need a new one, reply to his text.';}
