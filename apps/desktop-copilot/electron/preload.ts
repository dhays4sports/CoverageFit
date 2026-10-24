import { contextBridge, ipcRenderer } from "electron";
const allowed = new Set([
  "capture",
  "overlayInfo",
  "select",
  "cancelCapture",
  "settings",
  "saveSettings",
  "request",
  "cancelResponse",
  "copy",
  "hide",
  "clearLocal",
]);
contextBridge.exposeInMainWorld("copilot", {
  call: (action: string, value?: unknown) => {
    if (!allowed.has(action)) throw Error("Unknown action");
    return ipcRenderer.invoke("copilot", action, value);
  },
  on: (fn: (event: unknown) => void) => {
    const listener = (_event: unknown, value: unknown) => fn(value);
    ipcRenderer.on("copilot-event", listener);
    return () => ipcRenderer.removeListener("copilot-event", listener);
  },
});
