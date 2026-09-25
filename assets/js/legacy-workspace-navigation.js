// Keep specialist analytics anchors useful without changing historical data flows.
addEventListener('DOMContentLoaded',()=>{const target=document.getElementById(location.hash.slice(1));if(!target)return;let el=target;while(el){if(el.tagName==='DETAILS')el.open=true;el=el.parentElement;}target.scrollIntoView({block:'start'});});
