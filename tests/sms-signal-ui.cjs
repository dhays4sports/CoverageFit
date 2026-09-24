const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
(async()=>{
 const {SIGNAL_SCENARIOS,simulateScenario}=await import('../server/sms-signal-scenarios.mjs');
 const {DEFAULT_TEMPLATES}=await import('../server/sms-signal-core.mjs');
 const server=require('child_process').spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{cwd:require('path').resolve(__dirname,'..'),stdio:'ignore'});
 let browser;
 try{
  await new Promise(r=>setTimeout(r,500));
  const binary=process.env.CF_CHROMIUM_HELPER?(await import(process.env.CF_CHROMIUM_HELPER)).default:null;
  browser=await chromium.launch({headless:true,...(process.env.CF_CHROMIUM_PATH?{executablePath:process.env.CF_CHROMIUM_PATH}:{}),...(binary?{args:binary.args}:{})});
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>sessionStorage.setItem('coveragefit.producerInbox.token','synthetic-test-token-only'));
  const at='2026-09-24T12:00:00Z';
  const mk=(id,scenario)=>({id:'sms-live-'+id.repeat(32),phone:'+12025550101',name:'Synthetic '+scenario,signal:simulateScenario(scenario,DEFAULT_TEMPLATES,at).conversation.signal});
  const conversations=[mk('a','payment'),mk('b','future'),mk('c','reactivation')];
  await page.route('**/api/**',async r=>{
   const isSignal=r.request().url().includes('/signal'),body=r.request().postDataJSON();
   const payload=isSignal?(body?.action==='simulate_scenario'?{ok:true,...simulateScenario(body.scenario_id,DEFAULT_TEMPLATES,at)}:{ok:true,enabled:true,scenarios:SIGNAL_SCENARIOS,templates:DEFAULT_TEMPLATES,metrics:{unique_leads_contacted:3,unique_meaningful_responders:3,reply_rate:1,positive_signal_rate:1,useful_conversations:3,scope:'Synthetic UI fixture'},conversations}):{ok:true,counts:{},conversations:[],config:{},certification:{}};
   await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
  });
  await page.goto('http://127.0.0.1:8765/agent/sms-operations/');await page.locator('#signalCards article').first().waitFor();
  await page.getByText('PREPARE QUOTE',{exact:true}).waitFor();await page.getByText('FUTURE OPPORTUNITY',{exact:true}).waitFor();
  await page.locator('#signalDesk').screenshot({path:'/tmp/cf-signal-desktop.png'});
  await page.selectOption('#signalView','future');if(await page.locator('#signalCards article').count()!==1)throw Error('Future filter');
  await page.selectOption('#signalView','call');if(await page.locator('#signalCards article').count()!==2)throw Error('Call filter');
  await page.setViewportSize({width:390,height:844});await page.locator('#signalDesk').screenshot({path:'/tmp/cf-signal-mobile.png'});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2))throw Error('Mobile overflow');
  await page.goto('http://127.0.0.1:8765/agent/sms-simulator/');await page.getByText('Signal simulator — fictional data only; never sends',{exact:true}).click();
  await page.selectOption('#signalExample','fresh2-text');if(await page.locator('#signalInbound').inputValue()!=='Text is easier.')throw Error('Fresh #2 preset');
  for(const id of ['fresh2-text','duplicate','mismatch','quote-timing']){
   await page.selectOption('#signalExample',id);await page.click('#signalRunScenario');
   await page.waitForFunction(()=>document.getElementById('signalResult').textContent.includes('"passed": true'));
   const result=JSON.parse(await page.locator('#signalResult').textContent());if(!result.passed||result.sends!==0)throw Error('Scenario run failed');
   await page.evaluate(()=>document.getElementById('signalResult').textContent='');
  }
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS: desktop/mobile, CALL/Future filters, Quote Ready/Future summaries, fresh/quote/replay/mismatch scenarios, zero page errors.');
 }finally{if(browser)await browser.close();server.kill();}
})();
