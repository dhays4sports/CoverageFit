import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { PNG } from "pngjs";
import { authorizeProducer } from "../../../server/consultation-inbox-core.mjs";
import { ThreadStore } from "./store.mjs";
import { answer } from "./provider.mjs";
import {
  createThread,
  editThread,
  turn,
  attach,
  id,
} from "../shared/contracts.mjs";
const fail = (status, message) => {
  throw Object.assign(Error(message), { status });
};
const hash = (v) =>
  createHash("sha256").update(JSON.stringify(v)).digest("hex");
export function validateImages(captures) {
  for (const c of captures) {
    const b = Buffer.from(c.data.split(",")[1], "base64");
    if (
      b.length > 6_000_000 ||
      b.length < 24 ||
      b.toString("hex", 0, 8) !== "89504e470d0a1a0a"
    )
      fail(400, "Invalid PNG");
    const w = b.readUInt32BE(16),
      h = b.readUInt32BE(20);
    if (w !== c.width || h !== c.height || w * h > 16_000_000)
      fail(400, "Image dimensions exceed limits");
    let png;
    try {
      png = PNG.sync.read(b, { checkCRC: true });
    } catch {
      fail(400, "Invalid PNG");
    }
    if (png.width !== w || png.height !== h) fail(400, "Invalid PNG");
  }
}
async function body(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 32_000_000) fail(413, "Request too large");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks));
  } catch {
    fail(400, "Invalid JSON");
  }
}
const publicThread = (t) => ({ ...t, requests: undefined });
export function makeServer({ env = process.env, store, fetcher = fetch } = {}) {
  if (
    !env.CF_DESKTOP_TOKEN ||
    env.CF_DESKTOP_TOKEN.length < 32 ||
    !env.CF_DESKTOP_OWNER
  )
    throw Error("Configure a desktop-scoped token and owner");
  store ??= new ThreadStore(
    env.CF_DESKTOP_DB || "threads.db",
    env.CF_DESKTOP_STORAGE_KEY,
  );
  const owner = env.CF_DESKTOP_OWNER;
  const active = new Map();
  const server = createServer(async (req, res) => {
    const json = (value, status = 200) => {
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(JSON.stringify(value));
    };
    try {
      if (req.headers.origin) fail(403, "Browser requests are not supported");
      const auth = authorizeProducer(
        new Request("http://127.0.0.1", {
          headers: { Authorization: req.headers.authorization || "" },
        }),
        { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: env.CF_DESKTOP_TOKEN },
      );
      if (!auth.ok) fail(401, "Authentication expired or invalid");
      const url = new URL(req.url, "http://127.0.0.1");
      const segments = url.pathname.split("/").filter(Boolean);
      if (segments[0] !== "v1") fail(404, "Not found");
      if (url.pathname === "/v1/status" && req.method === "GET")
        return json({
          version: "0.1.0",
          live: env.CF_DESKTOP_LIVE === "1",
          customerDataAllowed: false,
          crm: false,
          retention:
            "Quick: memory, 30 minute inactivity. Saved: encrypted backend until deletion. OpenAI store=false; provider abuse retention may apply.",
        });
      if (segments[1] !== "threads") fail(404, "Not found");
      if (segments.length === 2 && req.method === "GET") {
        const q = (url.searchParams.get("q") || "").toLowerCase();
        return json(
          store
            .list(owner)
            .filter((t) =>
              (t.title + " " + t.messages.map((m) => m.text).join(" "))
                .toLowerCase()
                .includes(q),
            )
            .map((t) => ({
              id: t.id,
              title: t.title,
              pinned: t.pinned,
              archived: t.archived,
              temporary: t.temporary,
              updated: t.updated,
            })),
        );
      }
      if (segments.length === 2 && req.method === "POST") {
        const v = createThread.parse(await body(req));
        let old;
        try {
          old = store.get(owner, v.id);
        } catch {}
        if (old) return json(publicThread(old));
        if (store.list(owner).length >= 200)
          fail(429, "Thread limit reached; delete unused threads");
        return json(
          publicThread(
            store.save(owner, {
              ...v,
              version: 0,
              messages: [],
              captures: [],
              requests: {},
              pinned: false,
              archived: false,
              lead: null,
            }),
          ),
        );
      }
      const threadId = id.parse(segments[2]);
      let t = store.get(owner, threadId);
      if (segments.length === 3 && req.method === "GET")
        return json(publicThread(t));
      if (segments.length === 3 && req.method === "DELETE") {
        active.get(threadId)?.abort();
        store.delete(owner, threadId);
        return json({ deleted: true });
      }
      if (segments.length === 3 && req.method === "PATCH") {
        if (active.has(threadId))
          fail(409, "Wait for or cancel the active response");
        const v = editThread.parse(await body(req));
        if (t.version !== v.version) fail(409, "Thread changed; reopen it");
        if (v.promote) t.temporary = false;
        if (v.removeCaptures)
          t.captures = t.captures.filter(
            (c) => !v.removeCaptures.includes(c.id),
          );
        for (const key of ["title", "pinned", "archived"])
          if (v[key] !== undefined) t[key] = v[key];
        t.version++;
        return json(publicThread(store.save(owner, t)));
      }
      if (segments[3] === "attachments" && req.method === "POST") {
        const v = attach.parse(await body(req));
        const previous = t.requests[v.id];
        if (previous) {
          if (previous.hash !== hash(v)) fail(409, "Request ID reused");
          return json(publicThread(t));
        }
        if (active.has(threadId) || t.version !== v.version)
          fail(409, "Thread changed; reopen it");
        if (t.archived) fail(409, "Unarchive thread first");
        validateImages(v.captures);
        if (t.captures.length + v.captures.length > 24)
          fail(413, "Thread capture limit reached");
        for (const c of v.captures) {
          const existing = t.captures.find((x) => x.id === c.id);
          if (existing) {
            if (hash(existing) !== hash(c)) fail(409, "Capture ID collision");
          } else t.captures.push(c);
        }
        t.requests[v.id] = { hash: hash(v), status: "attached" };
        t.version++;
        return json(publicThread(store.save(owner, t)));
      }
      if (segments[3] !== "turns" || req.method !== "POST")
        fail(404, "Not found");
      const v = turn.parse(await body(req));
      validateImages(v.captures);
      const previous = t.requests[v.id];
      if (previous) {
        if (previous.hash !== hash(v)) fail(409, "Request ID reused");
        if (previous.status === "done")
          return json({ thread: publicThread(t), replayed: true });
        fail(
          409,
          "This request was already attempted. Reopen the thread before explicitly starting a new attempt; provider usage may already have occurred.",
        );
      }
      if (t.archived || t.version !== v.version || active.has(threadId))
        fail(409, "Thread changed or busy; reopen it");
      if (t.messages.length >= 80)
        fail(413, "Conversation limit reached; start a new thread");
      // Images must have been committed to this exact destination through explicit review/routing.
      for (const c of v.captures) {
        const stored = t.captures.find((x) => x.id === c.id);
        if (!stored || hash(stored) !== hash(c))
          fail(409, "Capture is not attached to this thread");
      }
      t.requests[v.id] = { hash: hash(v), status: "started" };
      store.save(owner, t);
      const abort = new AbortController();
      active.set(threadId, abort);
      res.on("close", () => {
        if (!res.writableEnded) abort.abort();
      });
      const timer = setTimeout(() => abort.abort(), 90000);
      res.writeHead(200, {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      const emit = (e) => {
        if (!res.destroyed) res.write(JSON.stringify(e) + "\n");
      };
      try {
        const a = await answer(t, v, {
          env,
          signal: abort.signal,
          emit,
          fetcher,
        });
        if (abort.signal.aborted) throw Error("Cancelled");
        t = store.get(owner, threadId);
        t.messages.push(
          {
            id: v.id,
            role: "user",
            text: v.text,
            captures: v.captures.map((c) => c.id),
          },
          {
            id: v.id + "-answer",
            role: "assistant",
            text: a.text,
            usage: a.usage,
            simulation: a.simulation,
          },
        );
        t.requests[v.id].status = "done";
        t.version++;
        store.save(owner, t);
        emit({
          type: "done",
          thread: publicThread(t),
          metrics: {
            firstTokenMs: a.firstTokenMs,
            elapsedMs: a.elapsedMs,
            usage: a.usage,
          },
        });
      } catch (error) {
        try {
          t = store.get(owner, threadId);
          t.requests[v.id].status = "uncertain";
          store.save(owner, t);
        } catch {}
        emit({
          type: "error",
          message: abort.signal.aborted
            ? "Response cancelled. Reopen before retrying."
            : "Response failed; reopen before retrying. No automatic retry was made.",
        });
      } finally {
        clearTimeout(timer);
        active.delete(threadId);
        res.end();
      }
    } catch (error) {
      if (!res.headersSent)
        json(
          {
            error:
              error.name === "ZodError"
                ? "Invalid request"
                : error.status
                  ? error.message
                  : "Gateway unavailable",
          },
          error.status || (error.name === "ZodError" ? 400 : 500),
        );
      else res.end();
    }
  });
  server.on("close", () => {
    for (const a of active.values()) a.abort();
    store.close();
  });
  return server;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const server = makeServer();
  server.listen(Number(process.env.CF_DESKTOP_PORT || 4317), "127.0.0.1", () =>
    console.log(
      "CoverageFit gateway listening on loopback; request contents are not logged.",
    ),
  );
}
