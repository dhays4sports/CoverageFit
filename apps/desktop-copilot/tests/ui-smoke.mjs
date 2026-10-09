// Synthetic renderer + real gateway check; not native Windows certification.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import { PNG } from "pngjs";
import { makeServer } from "../gateway/server.mjs";
import { ThreadStore } from "../gateway/store.mjs";
const { chromium } = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? await import(
      pathToFileURL(
        join(
          process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,
          "playwright/index.mjs",
        ),
      ).href
    )
  : await import("playwright");
const token = "synthetic-ui-token-".repeat(3),
  store = new ThreadStore(":memory:", "a".repeat(64));
const gateway = makeServer({
  env: { CF_DESKTOP_TOKEN: token, CF_DESKTOP_OWNER: "synthetic" },
  store,
});
await new Promise((r) => gateway.listen(0, "127.0.0.1", r));
const root = resolve("dist");
const web = createServer((req, res) => {
  const path = resolve(
    root,
    "." + (req.url === "/" ? "/index.html" : req.url.split("?")[0]),
  );
  if (!path.startsWith(root + "/")) {
    res.writeHead(403).end();
    return;
  }
  try {
    res.setHeader(
      "Content-Type",
      path.endsWith(".js")
        ? "text/javascript"
        : path.endsWith(".css")
          ? "text/css"
          : "text/html",
    );
    res.end(readFileSync(path));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => web.listen(0, "127.0.0.1", r));
let browser;
try {
  const launch = process.env.CF_TEST_CHROMIUM
    ? {
        headless: true,
        executablePath: process.env.CF_TEST_CHROMIUM,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      }
    : { headless: true };
  browser = await chromium.launch(launch);
  const page = await browser.newPage({ viewport: { width: 580, height: 850 } });
  const failures = [];
  page.on("pageerror", (e) => failures.push(e.message));
  const png = new PNG({ width: 400, height: 140 });
  png.data.fill(255);
  const raw = "data:image/png;base64," + PNG.sync.write(png).toString("base64");
  let lastAttachments;
  let captureCount = 0;
  await page.exposeFunction("bridge", async (action, value) => {
    if (action === "settings")
      return {
        shortcut: "Control+Shift+Space",
        login: false,
        pin: false,
        route: "ask",
        gateway: "http://127.0.0.1:4317",
        hasToken: true,
        shortcutOK: true,
        version: "0.1.0",
      };
    if (action === "capture") {
      captureCount++;
      await page.evaluate((v) => window.emit({ type: "capture", capture: v }), {
        id: crypto.randomUUID(),
        data: raw,
        width: 400,
        height: 140,
        label: "Synthetic conversation " + captureCount,
      });
      return;
    }
    if (action === "copy") return;
    if (action === "request") {
      if (value.path.endsWith("/attachments"))
        lastAttachments = value.body.captures;
      const r = await fetch(
        "http://127.0.0.1:" + gateway.address().port + value.path,
        {
          method: value.method,
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
          body: value.body ? JSON.stringify(value.body) : undefined,
        },
      );
      if (!r.ok) throw Error((await r.json()).error);
      if (r.headers.get("content-type").includes("ndjson")) {
        for (const line of (await r.text()).split("\n").filter(Boolean)) {
          await page.evaluate((v) => window.emit(v), {
            type: "stream",
            requestId: value.requestId,
            event: JSON.parse(line),
          });
        }
        return { streamed: true };
      }
      return r.json();
    }
  });
  await page.addInitScript(() => {
    let cb = () => {};
    window.emit = (v) => cb(v);
    window.copilot = {
      call: (a, v) => window.bridge(a, v),
      on: (fn) => {
        cb = fn;
        return () => {};
      },
    };
  });
  await page.goto("http://127.0.0.1:" + web.address().port);
  await page.getByText("Your next question starts here.").waitFor();
  await page.getByRole("button", { name: "＋ Capture", exact: true }).click();
  await page.locator("canvas").waitFor();
  const box = await page.locator("canvas").boundingBox();
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + 90, box.y + 60);
  await page.mouse.up();
  await page.getByRole("button", { name: "Reviewed — choose thread" }).click();
  assert.equal(
    lastAttachments,
    undefined,
    "No attachment before destination confirmation",
  );
  await page.getByLabel("Destination").selectOption("new");
  await page.getByPlaceholder("Editable thread title").fill("Renewal test");
  await page.getByRole("button", { name: "Confirm destination" }).click();
  await page
    .getByRole("heading", { name: "Renewal test", exact: true })
    .waitFor();
  assert.notEqual(lastAttachments[0].data, raw);
  const altered = PNG.sync.read(
    Buffer.from(lastAttachments[0].data.split(",")[1], "base64"),
  );
  assert.equal(
    altered.data[(20 * 400 + 20) * 4],
    0,
    "Redaction reaches actual transmitted bytes",
  );
  await page
    .getByPlaceholder("What should I say next?")
    .fill("What is visible?");
  await page
    .getByRole("checkbox", {
      name: "I reviewed this content and authorize this submission.",
    })
    .check();
  await page.getByRole("button", { name: "Run local simulation" }).click();
  await page
    .getByText("[LOCAL SIMULATION — no image analysis performed]", {
      exact: false,
    })
    .waitFor();
  await page.reload();
  await page.getByRole("button", { name: "Refresh library" }).click();
  await page.getByRole("button", { name: "Renewal test", exact: true }).click();
  await page.getByText("What is visible?", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Add screenshot", exact: true })
    .click();
  await page.getByRole("button", { name: "Reviewed — choose thread" }).click();
  await page.getByLabel("Destination").selectOption({ label: "Renewal test" });
  await page.getByRole("button", { name: "Confirm destination" }).click();
  await page.getByText("Synthetic conversation 2 · ready to send").waitFor();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await page
    .getByText("Synthetic conversation 2 · ready to send")
    .waitFor({ state: "detached" });
  await page.getByRole("button", { name: "Rename", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Rename thread" })
    .fill("Renamed renewal");
  await page.getByRole("button", { name: "Save name" }).click();
  await page
    .getByRole("heading", { name: "Renamed renewal", exact: true })
    .waitFor();
  await page.screenshot({
    path: "/tmp/coveragefit-desktop-ui.png",
    fullPage: true,
  });
  assert.deepEqual(failures, []);
  console.log(
    "UI acceptance: 8 checks passed (review gate, pixel redaction, saved routing, simulated chat, renderer restart, existing routing, removal, rename).",
  );
} finally {
  await browser?.close();
  await new Promise((r) => {
    gateway.close(r);
    gateway.closeAllConnections();
  });
  await new Promise((r) => web.close(r));
}
