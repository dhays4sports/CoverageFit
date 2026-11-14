const {app,BrowserWindow,ipcMain,globalShortcut,desktopCapturer,screen,clipboard,dialog,safeStorage,Tray,Menu,nativeImage}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const {Store,buildRequest,responseText}=require('./core');
const {SharedProfiles,origin:profileOrigin}=require('./shared-profile');
let win,tray,store,shared,quitting=false,capturing=false,captureSession=null,busy=new Set();
const appDir=()=>app.getPath('userData');
function key(){const file=path.join(appDir(),'credential.bin');if(!fs.existsSync(file))return process.env.OPENAI_API_KEY||'';if(!safeStorage.isEncryptionAvailable())throw Error('Windows credential encryption is unavailable.');return safeStorage.decryptString(fs.readFileSync(file));}
function sharedConfig(){const origin=store.data.settings.profileOrigin||'';const file=path.join(appDir(),'profile-credential.bin');if(!origin||!fs.existsSync(file))return {origin,token:''};if(!safeStorage.isEncryptionAvailable())throw Error('Secure credential storage is unavailable.');const c=JSON.parse(safeStorage.decryptString(fs.readFileSync(file)));return {origin,token:c.origin===origin?c.token:''};}
function show(){win.show();win.focus();}
function ready(){if(!win.isDestroyed())win.webContents.send('command','refresh');}
function status(){return {configured:!!(process.env.OPENAI_API_KEY||fs.existsSync(path.join(appDir(),'credential.bin'))),model:store.data.settings.model,dataPath:appDir(),profileOrigin:store.data.settings.profileOrigin||'',profileConfigured:!!sharedConfig().token,shortcut:globalShortcut.isRegistered('CommandOrControl+Shift+Space')};}
function guard(event){const f=event.senderFrame;if(!f||f.url!==require('node:url').pathToFileURL(path.join(__dirname,'index.html')).href)throw Error('Unauthorized window.');}
async function capture(){
 if(capturing)return;capturing=true;const wasVisible=win.isVisible();win.hide();
 try {
  await new Promise(r=>setTimeout(r,220));
  const display=screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const sources=await desktopCapturer.getSources({types:['screen'],thumbnailSize:{width:Math.round(display.size.width*display.scaleFactor),height:Math.round(display.size.height*display.scaleFactor)}});
  const source=sources.find(s=>s.display_id===String(display.id))||(sources.length===1?sources[0]:null);if(!source||source.thumbnail.isEmpty())throw Error('Screen capture is unavailable. Try Win+Shift+S, then Paste image.');
  const image=source.thumbnail;
  const overlay=new BrowserWindow({x:display.bounds.x,y:display.bounds.y,width:display.bounds.width,height:display.bounds.height,frame:false,alwaysOnTop:true,skipTaskbar:true,resizable:false,webPreferences:{preload:path.join(__dirname,'capture-preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  captureSession={overlay,image,display,wasVisible};overlay.setMenu(null);await overlay.loadFile(path.join(__dirname,'capture.html'));overlay.focus();
  overlay.webContents.send('screen-image',image.toDataURL());overlay.on('closed',()=>{captureSession=null;capturing=false;});
 }catch(e){capturing=false;if(wasVisible)show();dialog.showErrorBox('Screenshot unavailable',e.message);}
}
ipcMain.handle('capture-result',(event,rect)=>{
 const s=captureSession;if(!s||event.sender!==s.overlay.webContents)throw Error('Invalid capture.');
 if(!rect){s.overlay.close();if(s.wasVisible)show();return;}
 const size=s.image.getSize(),sx=size.width/s.display.bounds.width,sy=size.height/s.display.bounds.height;
 const x=Math.max(0,Math.min(size.width-1,Math.round(rect.x*sx))),y=Math.max(0,Math.min(size.height-1,Math.round(rect.y*sy)));
 const width=Math.min(size.width-x,Math.round(rect.width*sx)),height=Math.min(size.height-y,Math.round(rect.height*sy));if(width<2||height<2)throw Error('Select a larger area.');
 const data=s.image.crop({x,y,width,height}).toDataURL();s.overlay.close();show();win.webContents.send('capture-ready',data);
});
async function analyze(tid,review){
 if(busy.has(tid))throw Error('This thread is already processing.');const apiKey=key();if(!apiKey)throw Error('Open Settings to connect your existing OpenAI key.');
 busy.add(tid);try{const t=store.thread(tid);if(t.reviews.some(r=>r.status==='pending'&&r.sharedAttempt))throw Error('Resolve the pending shared-profile approval before continuing this thread.');if(review&&!t.prospectId)throw Error('Choose a prospect before reviewing profile updates.');if(t.prospectId&&store.prospect(t.prospectId).shared)await shared.refresh(store,store.prospect(t.prospectId));if(review&&t.prospectId&&store.prospect(t.prospectId).shared&&!t.sharedOpportunityId)throw Error('Select the policy or opportunity this update belongs to in the shared profile panel.');if(t.sharedOpportunityId&&!store.prospect(t.prospectId).sharedContext.links.some(l=>l.opportunityId===t.sharedOpportunityId))throw Error('This thread’s opportunity link changed. Select the correct opportunity before continuing.');const payload=buildRequest(store,tid,review);
 const res=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(120000),redirect:'error'});
 if(!res.ok){const messages={401:'Your OpenAI key was not accepted. Check Settings.',403:'Your OpenAI project does not have access.',429:'OpenAI usage or rate limit reached. Check your API billing or retry later.'};throw Error(messages[res.status]||`OpenAI request failed (${res.status}). Your inputs are saved. Check the model name and try again.`);}
 const body=await res.json(),answer=responseText(body);if(review){let parsed;try{parsed=JSON.parse(answer);}catch{throw Error('Could not read the proposed updates. Please retry.');}const reviewRecord=store.makeReview(tid,parsed.items);if(t.prospectId&&store.prospect(t.prospectId).shared){reviewRecord.sharedVersion=store.prospect(t.prospectId).shared.version;reviewRecord.sharedOpportunityId=t.sharedOpportunityId;store.save();}}else store.addMessage(tid,'assistant',answer);
 return store.snapshot();
 }catch(e){if(e.name==='TimeoutError'||e.name==='AbortError')throw Error('Request timed out. Your screenshot and instruction are saved. Retry when ready.');throw e;}finally{busy.delete(tid);}
}
ipcMain.handle('desk',async(event,action,a={})=>{
 guard(event);switch(action){
 case 'state':return {data:store.snapshot(),status:status()};
 case 'newProspect':if(store.data.settings.profileOrigin)throw Error('Create or link customers in CoverageFit, then use Find shared prospect. Local profile creation is disabled for this connected workspace.');store.newProspect(a.name,a.details);return store.snapshot();
 case 'newThread':return store.newThread(a.title,a.prospectId);
 case 'link':if(busy.has(a.tid))throw Error('Wait for this thread to finish processing.');store.link(a.tid,a.pid);return store.snapshot();
 case 'draft':{const t=store.thread(a.tid);if(typeof a.body!=='string'||a.body.length>40000)throw Error('Instruction is too long.');t.draft=a.body;store.save();return true;}
 case 'attach':store.addCapture(a.tid,a.dataUrl,a.label);return store.snapshot();
 case 'copy':{if(typeof a.body!=='string'||a.body.length>100000)throw Error('Invalid clipboard text.');clipboard.writeText(a.body);return true;}
 case 'paste':{const image=clipboard.readImage();if(image.isEmpty())throw Error('No image on clipboard. Use Win+Shift+S first.');return image.toDataURL();}
 case 'pickImage':{const pick=await dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:'Images',extensions:['png','jpg','jpeg','webp']}]});if(pick.canceled)return null;const f=pick.filePaths[0];if(fs.statSync(f).size>12000000)throw Error('Choose an image under 12 MB.');const image=nativeImage.createFromPath(f);if(image.isEmpty())throw Error('Could not read that image.');return image.toDataURL();}
 case 'capture':await capture();return true;
 case 'send':{if(busy.has(a.tid))throw Error('This thread is already processing.');store.addMessage(a.tid,'user',a.body,a.captureIds||[]);return analyze(a.tid,false);}
 case 'retry':return analyze(a.tid,false);
 case 'review':return analyze(a.tid,true);
 case 'approve':if(store.prospect(store.thread(a.tid).prospectId).shared)return shared.approve(store,a.tid,a.rid,a.edits);store.approve(a.tid,a.rid,a.edits);return store.snapshot();
 case 'dismiss':store.dismiss(a.tid,a.rid);return store.snapshot();
 case 'task':if(a.pid&&store.prospect(a.pid).shared)throw Error('For a shared prospect, ask for the task in its thread and select it in the profile review. It will then appear in CoverageFit too.');store.task(a.title,a.due,a.tid,a.pid);return store.snapshot();
 case 'itemStatus':{const p=store.prospect(a.pid);if(p.shared)throw Error('Shared evidence is immutable. Add a correction in the thread and approve a new reviewed entry.');const item=p.items.find(i=>i.id===a.id);if(!item||!['verified','tentative','unverified','stale','failed'].includes(a.confidence))throw Error('Invalid item status.');item.statusHistory=item.statusHistory||[];item.statusHistory.push({from:item.confidence,to:a.confidence,at:new Date().toISOString()});item.confidence=a.confidence;store.save();return store.snapshot();}
 case 'toggleTask':{const task=store.data.tasks.find(x=>x.id===a.id);if(!task)throw Error('Task not found.');if(task.shared)throw Error('Complete shared tasks in CoverageFit Producer Workspace, then refresh here.');task.completed=!task.completed;store.save();return store.snapshot();}
 case 'profileSearch':return shared.search(a.query||'',a.after||'');
 case 'profileChoose':{const p=await shared.choose(store,a.customerId,a.opportunityId);return {pid:p.id,data:store.snapshot()};}
 case 'profileOpportunity':{if(busy.has(a.tid))throw Error('Wait for this thread to finish.');const t=store.thread(a.tid),p=store.prospect(t.prospectId);if(!p.shared||!p.sharedContext.links.some(l=>l.opportunityId===a.opportunityId))throw Error('Choose a valid linked opportunity.');store.invalidateReview(t);t.sharedOpportunityId=a.opportunityId;store.save();return store.snapshot();}
 case 'profileRefresh':{await shared.refresh(store,store.prospect(a.pid));return store.snapshot();}
 case 'profileEvidence':return shared.evidence(store.prospect(a.pid),a.requestId);
 case 'profileSettings':{const origin=profileOrigin(a.origin);if(a.token){if(typeof a.token!=='string'||a.token.length<32||a.token.length>1000)throw Error('Enter the dedicated desktop-profile access token, not your producer or OpenAI key.');if(a.token.startsWith('sk-'))throw Error('Use the desktop-profile token, not an OpenAI key.');if(!safeStorage.isEncryptionAvailable())throw Error('Secure credential storage is unavailable.');fs.writeFileSync(path.join(appDir(),'profile-credential.bin'),safeStorage.encryptString(JSON.stringify({origin,token:a.token})),{mode:0o600});}store.data.settings.profileOrigin=origin;store.save();return status();}
 case 'settings':{if(typeof a.model!=='string'||!/^[a-zA-Z0-9._:-]{1,100}$/.test(a.model))throw Error('Enter a valid model ID.');if(a.key){if(typeof a.key!=='string'||!a.key.startsWith('sk-')||a.key.length>1000)throw Error('Enter your existing OpenAI API key.');if(!safeStorage.isEncryptionAvailable())throw Error('Secure credential storage is unavailable. Key was not saved.');fs.writeFileSync(path.join(appDir(),'credential.bin'),safeStorage.encryptString(a.key),{mode:0o600});}store.data.settings.model=a.model;store.save();return status();}
 case 'export':{const out=await dialog.showSaveDialog(win,{defaultPath:'Prospect-Desk-backup.json',filters:[{name:'Workspace backup',extensions:['json']}]});if(out.canceled)return false;fs.writeFileSync(out.filePath,JSON.stringify(store.snapshot(),null,2));return true;}
 default:throw Error('Unknown action.');
 }
});
if(!app.requestSingleInstanceLock())app.quit();else{
 app.on('second-instance',()=>{if(win)show();});
 app.whenReady().then(()=>{
  try{store=new Store(appDir());shared=new SharedProfiles(sharedConfig);}catch(e){dialog.showErrorBox('Workspace needs attention',e.message);app.quit();return;}
  win=new BrowserWindow({width:1360,height:900,minWidth:980,minHeight:650,title:'Prospect Desk',backgroundColor:'#f5f4f0',webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});win.setMenu(null);
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.webContents.session.setPermissionRequestHandler((wc,permission,cb)=>cb(false));
  win.loadFile(path.join(__dirname,'index.html'));
  win.on('close',e=>{if(!quitting){e.preventDefault();win.hide();}});
  const icon=nativeImage.createFromPath(path.join(__dirname,'tray.png'));tray=new Tray(icon);tray.setToolTip('Prospect Desk • Ctrl+Shift+Space');tray.setContextMenu(Menu.buildFromTemplate([{label:'Open Prospect Desk',click:show},{label:'Capture screenshot',click:capture},{label:'Quit',click:()=>{quitting=true;app.quit();}}]));tray.on('double-click',show);
  const registered=globalShortcut.register('CommandOrControl+Shift+Space',capture);if(!registered)win.webContents.once('did-finish-load',()=>win.webContents.send('command','shortcut-unavailable'));
 });app.on('before-quit',()=>{quitting=true;globalShortcut.unregisterAll();});
}
