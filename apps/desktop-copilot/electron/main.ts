import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  globalShortcut,
  desktopCapturer,
  screen,
  ipcMain,
  nativeImage,
  clipboard,
  safeStorage,
  session,
} from "electron";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import {
  settings as settingsSchema,
  rect,
  pixelRect,
  gatewayURL,
} from "../shared/contracts.mjs";
let chat: BrowserWindow,
  tray: Tray,
  quitting = false,
  paused = false,
  capturing = false;
let config = {
  shortcut: "Control+Shift+Space",
  login: false,
  pin: false,
  route: "ask",
  gateway: "http://127.0.0.1:4317",
};
let token = "",
  shortcutOK = false;
const overlays = new Map<
  number,
  {
    window: BrowserWindow;
    display: Electron.Display;
    image: Electron.NativeImage;
  }
>();
let pending: unknown = null;
const requests = new Map<string, AbortController>();
const index = join(__dirname, "../dist/index.html"),
  preload = join(__dirname, "preload.cjs");
const configPath = () => join(app.getPath("userData"), "settings.json");
function save() {
  const encrypted =
    token && safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(token).toString("base64")
      : "";
  writeFileSync(configPath(), JSON.stringify({ ...config, encrypted }), {
    mode: 0o600,
  });
}
function emit(value: unknown) {
  if (chat && !chat.isDestroyed())
    chat.webContents.send("copilot-event", value);
}
function harden(w: BrowserWindow) {
  w.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  w.webContents.on("will-navigate", (e) => e.preventDefault());
  w.webContents.on("will-attach-webview", (e) => e.preventDefault());
}
function open() {
  if (chat && !chat.isDestroyed()) {
    chat.show();
    chat.focus();
    return;
  }
  chat = new BrowserWindow({
    width: 580,
    height: 790,
    minWidth: 420,
    minHeight: 520,
    show: false,
    alwaysOnTop: config.pin,
    backgroundColor: "#101820",
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged,
    },
  });
  harden(chat);
  chat.loadFile(index);
  chat.once("ready-to-show", () => {
    chat.show();
    if (pending) {
      emit(pending);
      pending = null;
    }
  });
  chat.on("close", (e) => {
    if (!quitting) {
      e.preventDefault();
      chat.hide();
    }
  });
}
function shortcut() {
  globalShortcut.unregisterAll();
  try {
    shortcutOK =
      !paused && globalShortcut.register(config.shortcut, () => void capture());
  } catch {
    shortcutOK = false;
  }
  menu();
  return shortcutOK;
}
function menu() {
  if (!tray) return;
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Capture Screenshot", click: () => void capture() },
      { label: "Open Chat", click: open },
      {
        label: "New Conversation",
        click: () => {
          open();
          emit({ type: "new" });
        },
      },
      {
        label: "Settings",
        click: () => {
          open();
          emit({ type: "settings" });
        },
      },
      {
        label: "Pause Shortcut",
        type: "checkbox",
        checked: paused,
        click: () => {
          paused = !paused;
          shortcut();
        },
      },
      {
        label: shortcutOK
          ? config.shortcut
          : "Shortcut unavailable — use Capture Screenshot",
        enabled: false,
      },
      { type: "separator" },
      { label: "Quit", click: () => app.quit() },
    ]),
  );
}
function cancelCapture() {
  for (const o of overlays.values()) o.window.destroy();
  overlays.clear();
  capturing = false;
  open();
}
async function capture() {
  if (capturing) return;
  capturing = true;
  const started = Date.now();
  try {
    chat?.hide();
    await new Promise((r) => setTimeout(r, 180));
    const displays = screen.getAllDisplays();
    const size = {
      width: Math.max(
        ...displays.map((d) => Math.ceil(d.size.width * d.scaleFactor)),
      ),
      height: Math.max(
        ...displays.map((d) => Math.ceil(d.size.height * d.scaleFactor)),
      ),
    };
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: size,
      fetchWindowIcons: false,
    });
    for (const d of displays) {
      const src = sources.find((s) => s.display_id === String(d.id));
      if (!src || src.thumbnail.isEmpty())
        throw Error("Display capture unavailable");
      const w = new BrowserWindow({
        x: d.bounds.x,
        y: d.bounds.y,
        width: d.bounds.width,
        height: d.bounds.height,
        frame: false,
        transparent: false,
        backgroundColor: "#000000",
        skipTaskbar: true,
        resizable: false,
        alwaysOnTop: true,
        show: false,
        webPreferences: {
          preload,
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          webSecurity: true,
        },
      });
      harden(w);
      overlays.set(w.webContents.id, {
        window: w,
        display: d,
        image: src.thumbnail,
      });
      await w.loadFile(index, { query: { overlay: "1" } });
      w.show();
    }
    emit({
      type: "metric",
      name: "captureReadyMs",
      value: Date.now() - started,
    });
  } catch {
    cancelCapture();
    emit({
      type: "error",
      message:
        "Screen capture unavailable. Protected windows cannot be captured. Try again or use a different display.",
    });
  }
}
ipcMain.handle("copilot", async (event, action, value) => {
  const overlay = overlays.get(event.sender.id);
  const trusted =
    event.sender === chat?.webContents &&
    event.senderFrame === chat.webContents.mainFrame;
  if (!trusted && !overlay) throw Error("Untrusted sender");
  if (overlay) {
    if (event.senderFrame !== overlay.window.webContents.mainFrame)
      throw Error("Untrusted frame");
    if (action === "overlayInfo") return { image: overlay.image.toDataURL() };
    if (action === "cancelCapture") {
      cancelCapture();
      return;
    }
    if (action === "select") {
      const completed = Date.now();
      const r = rect.parse(value);
      const crop = pixelRect(r, overlay.display.size, overlay.image.getSize());
      const image = overlay.image.crop(crop);
      const bounds = overlay.display.workArea;
      cancelCapture();
      const [w, h] = chat.getSize();
      chat.setPosition(
        Math.max(bounds.x, bounds.x + bounds.width - w - 20),
        Math.max(
          bounds.y,
          Math.min(bounds.y + 20, bounds.y + bounds.height - h),
        ),
      );
      emit({
        type: "capture",
        capture: {
          id: randomUUID(),
          data: image.toDataURL(),
          ...image.getSize(),
          label: "Screenshot",
        },
      });
      emit({
        type: "metric",
        name: "captureChatMs",
        value: Date.now() - completed,
      });
      return;
    }
    throw Error("Overlay action denied");
  }
  switch (action) {
    case "capture":
      return capture();
    case "hide":
      chat.hide();
      return;
    case "settings":
      return {
        ...config,
        hasToken: !!token,
        shortcutOK,
        version: app.getVersion(),
        secureStorage: safeStorage.isEncryptionAvailable(),
      };
    case "saveSettings": {
      const v = settingsSchema.parse(value);
      const gateway = gatewayURL(v.gateway);
      if (gateway !== config.gateway || (v.token && v.token !== token)) {
        for (const a of requests.values()) a.abort();
        token = "";
        emit({ type: "reset" });
      }
      if (v.token) token = v.token;
      config = {
        shortcut: v.shortcut,
        login: v.login,
        pin: v.pin,
        route: v.route,
        gateway,
      };
      chat.setAlwaysOnTop(config.pin);
      if (process.platform === "win32")
        app.setLoginItemSettings({ openAtLogin: config.login });
      save();
      shortcut();
      return { ...config, shortcutOK };
    }
    case "copy":
      if (typeof value !== "string" || value.length > 50000)
        throw Error("Invalid copy");
      clipboard.writeText(value);
      return;
    case "clearLocal":
      for (const a of requests.values()) a.abort();
      token = "";
      rmSync(configPath(), { force: true });
      await session.defaultSession.clearStorageData();
      emit({ type: "reset" });
      return;
    case "cancelResponse":
      if (typeof value === "string") requests.get(value)?.abort();
      return;
    case "request": {
      const { path, method = "GET", body, requestId } = value || {};
      if (
        typeof path !== "string" ||
        !/^\/v1\/(status|threads(?:\/[0-9a-f-]{36}(?:\/(?:attachments|turns))?)?)(?:\?q=[^#]*)?$/.test(
          path,
        ) ||
        !["GET", "POST", "PATCH", "DELETE"].includes(method) ||
        typeof requestId !== "string" ||
        !token
      )
        throw Error("Configure a valid desktop gateway token in Settings");
      if (requests.size >= 4) throw Error("Too many requests");
      const data = body === undefined ? undefined : JSON.stringify(body);
      if (data && data.length > 32_000_000) throw Error("Request too large");
      const abort = new AbortController();
      requests.set(requestId, abort);
      const timeout = setTimeout(() => abort.abort(), 95000);
      try {
        const r = await fetch(config.gateway + path, {
          method,
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
          body: data,
          signal: abort.signal,
          redirect: "error",
        });
        if (!r.ok) {
          let message = "Gateway request failed";
          try {
            message = (await r.json()).error || message;
          } catch {}
          throw Error(message);
        }
        if (r.headers.get("content-type")?.includes("ndjson")) {
          const decoder = new TextDecoder();
          let buffer = "";
          for await (const chunk of r.body as any) {
            buffer += decoder.decode(chunk, { stream: true });
            if (buffer.length > 32_000_000) throw Error("Response too large");
            let i;
            while ((i = buffer.indexOf("\n")) >= 0) {
              const line = buffer.slice(0, i);
              buffer = buffer.slice(i + 1);
              if (line)
                emit({ type: "stream", requestId, event: JSON.parse(line) });
            }
          }
          return { streamed: true };
        }
        return await r.json();
      } catch (e) {
        if (abort.signal.aborted) throw Error("Request cancelled or timed out");
        throw e;
      } finally {
        clearTimeout(timeout);
        requests.delete(requestId);
      }
    }
    default:
      throw Error("Unknown action");
  }
});
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", open);
  app.whenReady().then(() => {
    try {
      const c = JSON.parse(readFileSync(configPath(), "utf8"));
      config = {
        ...config,
        ...settingsSchema
          .omit({ token: true })
          .parse({
            shortcut: c.shortcut,
            login: c.login,
            pin: c.pin,
            route: c.route,
            gateway: c.gateway,
          }),
      };
      config.gateway = gatewayURL(config.gateway);
      if (c.encrypted && safeStorage.isEncryptionAvailable())
        token = safeStorage.decryptString(Buffer.from(c.encrypted, "base64"));
    } catch {}
    session.defaultSession.setPermissionRequestHandler((_w, _p, cb) =>
      cb(false),
    );
    session.defaultSession.setPermissionCheckHandler(() => false);
    const icon = nativeImage.createFromDataURL(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAXUlEQVR4AcXBQRFAUAAA0bUjgKOjEqLo8/uIIhQFuJnZ96Zl3W5CEpOYxCQmsZkP4zr509gP3khMYhKTmMQkJjGJSUxiEpOYxCQmMYlJTGISm5Z1uwlJTGISk5jEHkhPBc/LAMutAAAAAElFTkSuQmCC",
    );
    tray = new Tray(icon);
    tray.setToolTip("CoverageFit Copilot");
    tray.on("double-click", open);
    open();
    shortcut();
  });
  app.on("before-quit", () => {
    quitting = true;
    for (const a of requests.values()) a.abort();
    globalShortcut.unregisterAll();
    for (const o of overlays.values()) o.window.destroy();
  });
  app.on("window-all-closed", () => {});
}
