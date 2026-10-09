import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
declare global {
  interface Window {
    copilot: {
      call: (action: string, value?: any) => Promise<any>;
      on: (fn: (v: any) => void) => () => void;
    };
  }
}
type Capture = {
  id: string;
  data: string;
  width: number;
  height: number;
  label: string;
  reviewed?: boolean;
};
type Thread = {
  id: string;
  title: string;
  temporary: boolean;
  version: number;
  pinned: boolean;
  archived: boolean;
  lead: null;
  captures: Capture[];
  messages: { id: string; role: string; text: string; captures?: string[] }[];
};
const uid = () => crypto.randomUUID();
const api = (path: string, method = "GET", body?: any, requestId = uid()) =>
  window.copilot.call("request", { path, method, body, requestId });
function Overlay() {
  const [image, setImage] = useState(""),
    [box, setBox] = useState<any>(null);
  const start = useRef<any>(null);
  useEffect(() => {
    window.copilot.call("overlayInfo").then((v) => setImage(v.image));
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.copilot.call("cancelCapture");
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <div
      className="overlay"
      style={{ backgroundImage: `url(${image})` }}
      onPointerDown={(e) => {
        start.current = { x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (start.current)
          setBox({
            x: Math.min(e.clientX, start.current.x),
            y: Math.min(e.clientY, start.current.y),
            width: Math.abs(e.clientX - start.current.x),
            height: Math.abs(e.clientY - start.current.y),
          });
      }}
      onPointerUp={(e) => {
        if (!start.current) return;
        const r = {
          x: Math.min(e.clientX, start.current.x),
          y: Math.min(e.clientY, start.current.y),
          width: Math.abs(e.clientX - start.current.x),
          height: Math.abs(e.clientY - start.current.y),
        };
        start.current = null;
        if (r.width > 2 && r.height > 2) window.copilot.call("select", r);
      }}
    >
      <div className="captureHint">
        Drag to capture · Esc to cancel · Select within one monitor
      </div>
      {box && (
        <div
          className="selection"
          style={{
            left: box.x,
            top: box.y,
            width: box.width,
            height: box.height,
          }}
        />
      )}
    </div>
  );
}
function Review({
  capture,
  onDone,
  onCancel,
}: {
  capture: Capture;
  onDone: (c: Capture) => void;
  onCancel: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    start = useRef<any>(null);
  const [tool, setTool] = useState("cover"),
    [label, setLabel] = useState(capture.label);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = canvas.current!;
      c.width = img.width;
      c.height = img.height;
      c.getContext("2d")!.drawImage(img, 0, 0);
    };
    img.src = capture.data;
  }, [capture]);
  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvas.current!,
      r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * c.width) / r.width,
      y: ((e.clientY - r.top) * c.height) / r.height,
    };
  }
  return (
    <section className="review">
      <div className="eyebrow">1 / REVIEW CAPTURE</div>
      <h2>Keep only what you need.</h2>
      <p>
        Drag over sensitive fields to permanently cover them. No image has left
        this computer.
      </p>
      <div className="row">
        <button
          className={tool === "cover" ? "selected" : ""}
          onClick={() => setTool("cover")}
        >
          Solid redaction
        </button>
        <button
          className={tool === "crop" ? "selected" : ""}
          onClick={() => setTool("crop")}
        >
          Crop
        </button>
      </div>
      <canvas
        ref={canvas}
        onPointerDown={(e) => {
          start.current = point(e);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={(e) => {
          if (!start.current) return;
          const p = point(e),
            s = start.current,
            c = canvas.current!,
            ctx = c.getContext("2d")!;
          start.current = null;
          const x = Math.max(0, Math.floor(Math.min(p.x, s.x))),
            y = Math.max(0, Math.floor(Math.min(p.y, s.y))),
            w = Math.min(c.width - x, Math.ceil(Math.abs(p.x - s.x))),
            h = Math.min(c.height - y, Math.ceil(Math.abs(p.y - s.y)));
          if (w < 1 || h < 1) return;
          if (tool === "cover") {
            ctx.fillStyle = "#000";
            ctx.fillRect(x, y, w, h);
          } else {
            const data = ctx.getImageData(x, y, w, h);
            c.width = w;
            c.height = h;
            ctx.putImageData(data, 0, 0);
          }
        }}
      />
      <label>
        Capture label
        <input
          value={label}
          maxLength={100}
          onChange={(e) => setLabel(e.target.value)}
        />
      </label>
      <div className="row">
        <button onClick={onCancel}>Remove / cancel</button>
        <button
          onClick={() => {
            onCancel();
            window.copilot.call("capture");
          }}
        >
          Retake
        </button>
        <button
          className="primary"
          onClick={() => {
            const c = canvas.current!;
            onDone({
              ...capture,
              data: c.toDataURL("image/png"),
              width: c.width,
              height: c.height,
              label,
              reviewed: true,
            });
          }}
        >
          Reviewed — choose thread
        </button>
      </div>
    </section>
  );
}
function App() {
  const [settings, setSettings] = useState<any>(null),
    [showSettings, setShowSettings] = useState(false),
    [threads, setThreads] = useState<any[]>([]),
    [thread, setThread] = useState<Thread | null>(null),
    [review, setReview] = useState<Capture | null>(null),
    [staged, setStaged] = useState<Capture[]>([]),
    [routing, setRouting] = useState(false),
    [destination, setDestination] = useState("quick"),
    [title, setTitle] = useState(""),
    [query, setQuery] = useState(""),
    [question, setQuestion] = useState(""),
    [mode, setMode] = useState("general"),
    [approved, setApproved] = useState(false),
    [busy, setBusy] = useState(false),
    [partial, setPartial] = useState(""),
    [error, setError] = useState(""),
    [status, setStatus] = useState<any>(null),
    [showArchived, setShowArchived] = useState(false),
    [dataClass, setDataClass] = useState("synthetic"),
    [rename, setRename] = useState(""),
    [metrics, setMetrics] = useState<any>({});
  const routeOperation = useRef<any>(null);
  const active = useRef(""),
    threadRef = useRef<Thread | null>(null),
    input = useRef<HTMLTextAreaElement>(null),
    settingsRef = useRef<any>(null);
  threadRef.current = thread;
  settingsRef.current = settings;
  async function attempt(fn: () => Promise<any>) {
    try {
      setError("");
      return await fn();
    } catch (e: any) {
      setError(
        e.message?.replace(
          /^Error invoking remote method '[^']+': Error: /,
          "",
        ),
      );
    }
  }
  async function refresh() {
    setThreads(await api("/v1/threads?q=" + encodeURIComponent(query)));
  }
  async function reload() {
    const s = await window.copilot.call("settings");
    setSettings(s);
    if (s.hasToken) {
      await attempt(async () => {
        setStatus(await api("/v1/status"));
        await refresh();
      });
    }
  }
  useEffect(() => {
    reload();
    return window.copilot.on((v) => {
      if (v.type === "capture") {
        setReview(v.capture);
        setApproved(false);
      }
      if (v.type === "new") {
        setThread(null);
        setQuestion("");
      }
      if (v.type === "settings") setShowSettings(true);
      if (v.type === "reset") {
        setThread(null);
        setThreads([]);
        setReview(null);
        setStaged([]);
        setStatus(null);
      }
      if (v.type === "error") setError(v.message);
      if (v.type === "metric")
        setMetrics((m: any) => ({ ...m, [v.name]: v.value }));
      if (v.type === "stream" && v.requestId === active.current) {
        const e = v.event;
        if (e.type === "delta") setPartial((p) => p + e.text);
        if (e.type === "done") {
          setThread(e.thread);
          setMetrics((m: any) => ({ ...m, ...e.metrics }));
          setPartial("");
          setQuestion("");
          setApproved(false);
          refresh();
        }
        if (e.type === "error") setError(e.message);
      }
    });
  }, []);
  async function openThread(id: string) {
    if (busy) return;
    await attempt(async () => {
      setThread(await api("/v1/threads/" + id));
      setApproved(false);
      setPartial("");
      input.current?.focus();
    });
  }
  async function route() {
    await attempt(async () => {
      setBusy(true);
      const key = JSON.stringify([destination, title, staged]);
      if (routeOperation.current?.key !== key)
        routeOperation.current = {
          key,
          threadId: uid(),
          attachmentId: uid(),
          attachmentBody: null,
        };
      const op = routeOperation.current;
      let t: Thread;
      if (destination === "quick" || destination === "new") {
        t = await api("/v1/threads", "POST", {
          id: op.threadId,
          title: title.trim() || staged[0]?.label || "New conversation",
          temporary: destination === "quick",
        });
      } else t = await api("/v1/threads/" + destination);
      if (t.lead)
        throw Error("Verified customer routing is unavailable in this build");
      if (staged.length) {
        op.attachmentBody ??= {
          id: op.attachmentId,
          version: t.version,
          captures: staged,
          approved: true,
          destinationConfirmed: true,
        };
        t = await api(
          "/v1/threads/" + t.id + "/attachments",
          "POST",
          op.attachmentBody,
        );
      }
      setThread(t);
      routeOperation.current = null;
      setStaged([]);
      setRouting(false);
      setTitle("");
      await refresh();
      setTimeout(() => input.current?.focus(), 0);
    }).finally(() => setBusy(false));
  }
  function reviewed(c: Capture) {
    setReview(null);
    setStaged((s) => [...s, c]);
    setRouting(true);
    const pref = settingsRef.current?.route;
    setDestination(
      pref === "current" && threadRef.current
        ? threadRef.current.id
        : pref === "quick"
          ? "quick"
          : "",
    );
  }
  async function patch(v: any) {
    if (!thread) return;
    await attempt(async () => {
      setThread(
        await api("/v1/threads/" + thread.id, "PATCH", {
          version: thread.version,
          ...v,
        }),
      );
      await refresh();
    });
  }
  async function send() {
    if (!thread || !approved || busy) return;
    const requestId = uid();
    active.current = requestId;
    setBusy(true);
    setPartial("");
    const used = new Set(thread.messages.flatMap((m) => m.captures || []));
    await attempt(async () => {
      const result = await api(
        "/v1/threads/" + thread.id + "/turns",
        "POST",
        {
          id: uid(),
          version: thread.version,
          text: question,
          captures: thread.captures.filter((c) => !used.has(c.id)),
          mode,
          approved: true,
          dataClass,
        },
        requestId,
      );
      if (result.thread) setThread(result.thread);
    }).finally(() => {
      setBusy(false);
      active.current = "";
    });
  }
  const used = new Set(thread?.messages.flatMap((m) => m.captures || []) || []);
  return (
    <>
      <header>
        <div>
          <b>
            CoverageFit <span>Copilot</span>
          </b>
          <small>
            Desktop preview {settings?.version || "0.1.0"} ·{" "}
            {status?.live
              ? "AI connected · synthetic / sanitized only"
              : "Local simulation · AI not active"}
          </small>
        </div>
        <button onClick={() => setShowSettings(!showSettings)}>Settings</button>
        <button
          aria-label="Hide window"
          onClick={() => window.copilot.call("hide")}
        >
          —
        </button>
      </header>
      {error && (
        <div role="alert" className="error">
          {error}
          <button onClick={() => thread && openThread(thread.id)}>
            Reopen thread
          </button>
          <button onClick={() => setError("")}>Dismiss</button>
        </div>
      )}
      {settings && !settings.shortcutOK && (
        <div className="notice">
          Shortcut unavailable. Use Capture or choose another shortcut.
        </div>
      )}
      {showSettings && settings && (
        <section>
          <h2>Desktop settings</h2>
          <label>
            Shortcut
            <input
              value={settings.shortcut}
              onChange={(e) =>
                setSettings({ ...settings, shortcut: e.target.value })
              }
            />
          </label>
          <label>
            Gateway origin
            <input
              value={settings.gateway}
              onChange={(e) =>
                setSettings({ ...settings, gateway: e.target.value })
              }
            />
          </label>
          <label>
            Desktop access token (never an OpenAI key)
            <input
              type="password"
              autoComplete="off"
              value={settings.token || ""}
              onChange={(e) =>
                setSettings({ ...settings, token: e.target.value })
              }
            />
          </label>
          <label>
            Default route
            <select
              value={settings.route}
              onChange={(e) =>
                setSettings({ ...settings, route: e.target.value })
              }
            >
              <option value="ask">Ask every capture</option>
              <option value="quick">Preselect Quick Chat</option>
              <option value="current">Preselect active thread</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.pin}
              onChange={(e) =>
                setSettings({ ...settings, pin: e.target.checked })
              }
            />{" "}
            Keep above ordinary windows
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.login}
              onChange={(e) =>
                setSettings({ ...settings, login: e.target.checked })
              }
            />{" "}
            Launch at login
          </label>
          <small>Last measured timings: {JSON.stringify(metrics)}</small>
          <p>
            Saved thread contents live in the encrypted gateway database. Quick
            Chats expire after 30 minutes of inactivity or gateway restart. Raw
            screenshots are not saved by the desktop. No automatic updates.
          </p>
          <div className="row">
            <button
              className="primary"
              onClick={() =>
                attempt(async () => {
                  await window.copilot.call("saveSettings", {
                    shortcut: settings.shortcut,
                    gateway: settings.gateway,
                    token: settings.token,
                    route: settings.route,
                    pin: settings.pin,
                    login: settings.login,
                  });
                  setShowSettings(false);
                  await reload();
                })
              }
            >
              Save settings
            </button>
            <button
              onClick={() =>
                attempt(async () => {
                  await window.copilot.call("clearLocal");
                  setShowSettings(false);
                  await reload();
                })
              }
            >
              Forget local credentials
            </button>
          </div>
        </section>
      )}
      {review ? (
        <Review
          capture={review}
          onDone={reviewed}
          onCancel={() => setReview(null)}
        />
      ) : routing ? (
        <section>
          <div className="eyebrow">2 / CHOOSE DESTINATION</div>
          <h2>Where does this capture belong?</h2>
          <p>
            Confirming saves reviewed images to this destination on your
            gateway. It does not send them to OpenAI.
          </p>
          {staged.map((c, i) => (
            <div className="attachment" key={c.id}>
              <img src={c.data} />
              <span>{c.label}</span>
              <button
                disabled={i === 0}
                onClick={() =>
                  setStaged((s) => {
                    const a = [...s];
                    [a[i - 1], a[i]] = [a[i], a[i - 1]];
                    return a;
                  })
                }
              >
                ↑
              </button>
              <button
                onClick={() => setStaged((s) => s.filter((x) => x.id !== c.id))}
              >
                Remove
              </button>
            </div>
          ))}
          <label>
            Destination
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option value="">Choose a destination</option>
              <option value="quick">Quick Chat — temporary</option>
              <option value="new">New saved thread</option>
              {threads
                .filter((t) => !t.archived)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                    {t.temporary ? " (temporary)" : ""}
                  </option>
                ))}
            </select>
          </label>
          <div className="row">
            <input
              placeholder="Search established threads"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={() => attempt(refresh)}>Search</button>
          </div>
          {["new", "quick"].includes(destination) && (
            <input
              placeholder="Editable thread title"
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
            />
          )}
          <p>
            Check the thread title and history before combining customer
            information. This preview has no verified customer linkage.
          </p>
          <div className="row">
            <button onClick={() => window.copilot.call("capture")}>
              Add screenshot
            </button>
            <button
              onClick={() => {
                setStaged([]);
                setRouting(false);
              }}
            >
              Cancel
            </button>
            <button
              className="primary"
              disabled={!destination || busy}
              onClick={route}
            >
              Confirm destination
            </button>
          </div>
        </section>
      ) : (
        <>
          <nav>
            <button
              className="primary"
              disabled={busy}
              onClick={() => window.copilot.call("capture")}
            >
              ＋ Capture
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setStaged([]);
                setRouting(true);
                setDestination("new");
              }}
            >
              New thread
            </button>
            <button onClick={() => attempt(refresh)}>Refresh library</button>
          </nav>
          <div className="library">
            <div className="row">
              <input
                aria-label="Search threads"
                placeholder="Search threads"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button onClick={() => attempt(refresh)}>Search</button>
              <label>
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
                Archived
              </label>
            </div>
            <div className="threadList">
              {threads
                .filter((t) => showArchived || !t.archived)
                .map((t) => (
                  <button
                    className={thread?.id === t.id ? "selected" : ""}
                    key={t.id}
                    disabled={busy}
                    onClick={() => openThread(t.id)}
                  >
                    {t.pinned ? "★ " : ""}
                    {t.title}
                    {t.temporary ? " · Quick" : ""}
                    {t.archived ? " · Archived" : ""}
                  </button>
                ))}
            </div>
          </div>
          {!thread ? (
            <section className="empty">
              <div className="eyebrow">CAPTURE. REVIEW. DISCUSS.</div>
              <h1>Your next question starts here.</h1>
              <p>
                Capture an app, redact what’s private, then choose Quick Chat or
                a saved thread.
              </p>
              <p className="shortcut">
                {settings?.shortcut || "Control+Shift+Space"}
              </p>
              <p>
                Use synthetic examples for this internal preview. Configure your
                gateway in Settings to save threads or run AI tests.
              </p>
            </section>
          ) : (
            <>
              <section className="threadHeading">
                <h2>{thread.title}</h2>
                {rename && (
                  <div className="row">
                    <input
                      aria-label="Rename thread"
                      maxLength={120}
                      value={rename}
                      onChange={(e) => setRename(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        patch({ title: rename });
                        setRename("");
                      }}
                    >
                      Save name
                    </button>
                    <button onClick={() => setRename("")}>Cancel</button>
                  </div>
                )}
                <small>
                  {thread.temporary
                    ? "Quick Chat · not persistent"
                    : "Saved thread · encrypted backend"}{" "}
                  · No verified customer linked
                </small>
                <div className="row">
                  <button
                    disabled={busy}
                    onClick={() => setRename(thread.title)}
                  >
                    Rename
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => patch({ pinned: !thread.pinned })}
                  >
                    {thread.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => patch({ archived: !thread.archived })}
                  >
                    {thread.archived ? "Unarchive" : "Archive"}
                  </button>
                  {thread.temporary && (
                    <button
                      disabled={busy}
                      onClick={() => patch({ promote: true })}
                    >
                      Save thread
                    </button>
                  )}
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (
                        confirm(
                          "Delete this thread and its screenshots from the gateway? Provider-side retention is separate.",
                        )
                      )
                        attempt(async () => {
                          await api("/v1/threads/" + thread.id, "DELETE");
                          setThread(null);
                          await refresh();
                        });
                    }}
                  >
                    Delete
                  </button>
                </div>
              </section>
              <main>
                {thread.messages.map((m) => (
                  <article className={m.role} key={m.id}>
                    <small>
                      {m.role === "user"
                        ? "YOU"
                        : "SCREENSHOT ASSISTANT · UNVERIFIED"}
                    </small>
                    <p>{m.text}</p>
                    {m.role === "assistant" && (
                      <button
                        onClick={() => window.copilot.call("copy", m.text)}
                      >
                        Copy answer
                      </button>
                    )}
                  </article>
                ))}
                {partial && (
                  <article className="assistant">
                    <small>GENERATING · NOT YET SAVED</small>
                    <p>{partial}</p>
                  </article>
                )}
                {thread.captures
                  .filter((c) => !used.has(c.id))
                  .map((c) => (
                    <div className="attachment" key={c.id}>
                      <img src={c.data} />
                      <span>{c.label} · ready to send</span>
                      <button
                        disabled={busy}
                        onClick={() => patch({ removeCaptures: [c.id] })}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
              </main>
              <footer>
                <select value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="general">General screenshot chat</option>
                  <option value="insurance">
                    Insurance assistance · unverified
                  </option>
                </select>
                <textarea
                  ref={input}
                  value={question}
                  maxLength={12000}
                  placeholder="What should I say next?"
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send();
                  }}
                />
                <label>
                  <input
                    type="checkbox"
                    checked={approved}
                    onChange={(e) => setApproved(e.target.checked)}
                  />{" "}
                  I reviewed this content and authorize this submission.
                </label>
                <select
                  value={dataClass}
                  onChange={(e) => setDataClass(e.target.value)}
                >
                  <option value="synthetic">Synthetic test content</option>
                  <option value="sanitized">Properly sanitized content</option>
                </select>
                <small>
                  Customer data is not authorized.{" "}
                  {status?.live
                    ? "Sends new images and text history to OpenAI."
                    : "Local simulation only; no OpenAI transmission."}{" "}
                  Earlier images are represented by prior answers; reattach to
                  inspect them again.
                </small>
                <div className="row">
                  <button
                    disabled={busy}
                    onClick={() => window.copilot.call("capture")}
                  >
                    Add screenshot
                  </button>
                  {busy ? (
                    <button
                      onClick={() =>
                        window.copilot.call("cancelResponse", active.current)
                      }
                    >
                      Cancel response
                    </button>
                  ) : (
                    <button
                      className="primary"
                      disabled={
                        !question.trim() || !approved || thread.archived
                      }
                      onClick={send}
                    >
                      {status?.live ? "Send to AI" : "Run local simulation"}
                    </button>
                  )}
                </div>
              </footer>
            </>
          )}
        </>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  new URLSearchParams(location.search).has("overlay") ? <Overlay /> : <App />,
);
