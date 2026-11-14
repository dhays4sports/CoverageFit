const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desk',{
 call:(action,payload)=>ipcRenderer.invoke('desk',action,payload),
 onCapture:fn=>{ipcRenderer.on('capture-ready',(_,data)=>fn(data));},
 onCommand:fn=>{ipcRenderer.on('command',(_,data)=>fn(data));}
});
