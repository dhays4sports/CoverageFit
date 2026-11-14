const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('capture',{onImage:fn=>ipcRenderer.on('screen-image',(_,data)=>fn(data)),finish:rect=>ipcRenderer.invoke('capture-result',rect)});
