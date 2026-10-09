import { randomBytes } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
const dir = join(homedir(), ".coveragefit-copilot-gateway");
mkdirSync(dir, { recursive: true, mode: 0o700 });
const path = join(dir, "gateway.env");
writeFileSync(
  path,
  `CF_DESKTOP_TOKEN=${randomBytes(32).toString("hex")}\nCF_DESKTOP_STORAGE_KEY=${randomBytes(32).toString("hex")}\nCF_DESKTOP_OWNER=internal-producer\nCF_DESKTOP_DB=${join(dir, "threads.db").replaceAll("\\", "/")}\nCF_DESKTOP_LIVE=0\n`,
  { mode: 0o600, flag: "wx" },
);
console.log(
  "Created protected gateway configuration at " +
    path +
    ". Read the desktop token locally; do not paste it into chat or commit it.",
);
