// Windows runner smoke test of the actual Electron executable and screen source.
// Does not stand in for mixed-DPI or RingCentral acceptance.
import { _electron as electron } from "playwright";
import assert from "node:assert/strict";
if (process.platform !== "win32") throw Error("Run this check on Windows");
const app = await electron.launch({ args: ["."], timeout: 30000 });
try {
  const window = await app.firstWindow();
  await window.getByText("Your next question starts here.").waitFor();
  const s = await window.evaluate(() => window.copilot.call("settings"));
  assert.equal(s.version, "0.1.0");
  await window.evaluate(() => window.copilot.call("capture"));
  let overlay;
  for (const w of app.windows())
    if (w.url().includes("overlay=1")) {
      overlay = w;
      break;
    }
  assert.ok(overlay, "An actual display overlay must exist");
  // Completing selection intentionally destroys the overlay sender. The reviewed
  // pixels in the surviving chat below, not the destroyed IPC reply, are the gate.
  await overlay.evaluate(() => {
    void window.copilot.call("select", { x: 10, y: 10, width: 200, height: 100 });
  }).catch(error => {
    if (!/Target page, context or browser has been closed/.test(error.message)) throw error;
  });
  await window.getByText("Keep only what you need.").waitFor();
  const pixels = await window
    .locator("canvas")
    .evaluate((c) => ({ width: c.width, height: c.height }));
  assert.ok(pixels.width >= 200 && pixels.height >= 100);
  await window.getByRole("button", { name: "Remove / cancel" }).click();
  console.log(
    "Windows Electron smoke: launch, display capture, rectangle, review, remove passed. RingCentral not tested.",
  );
} finally {
  await app.close();
}
