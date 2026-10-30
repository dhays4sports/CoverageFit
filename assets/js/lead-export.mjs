export function mountLeadExport(button,status,getToken){
 button.addEventListener('click',async()=>{
  const token=getToken();if(!token){status.textContent='Connect producer access under Tools first.';return;}
  button.disabled=true;status.textContent='Checking export scope and completeness…';
  try{
   const response=await fetch('/api/solo-desk/export-leads.csv',{headers:{Authorization:`Bearer ${token}`},cache:'no-store',credentials:'same-origin'});
   if(!response.ok){const e=await response.json();throw Error(e.error?.message||'No complete export is available.');}
   const blob=await response.blob();
   if(getToken()!==token)throw Error('Producer connection changed; download cancelled.');
   const manifest=JSON.parse(response.headers.get('X-CoverageFit-Export-Manifest')||'null');
   if(!manifest||manifest.exported!==Number(response.headers.get('X-CoverageFit-Export-Rows')))throw Error('Export accounting is unavailable; download cancelled.');
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='coveragefit-leads-v1.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   status.textContent=`Downloaded ${manifest.exported} leads. Excluded: ${JSON.stringify(manifest.excluded)}. External-only records unavailable. Suppression remains authoritative.`;
  }catch(e){status.textContent=e.message;}finally{button.disabled=false;}
 });
}
