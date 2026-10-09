import { DatabaseSync } from "node:sqlite";
import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
export class ThreadStore {
  constructor(path, key) {
    if (!/^[a-f0-9]{64}$/i.test(key || ""))
      throw Error("A 32-byte storage key is required");
    this.key = Buffer.from(key, "hex");
    this.db = new DatabaseSync(path);
    this.db.exec(
      "PRAGMA secure_delete=ON; CREATE TABLE IF NOT EXISTS threads(owner TEXT NOT NULL,id TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(owner,id))",
    );
    this.quick = new Map();
  }
  seal(value) {
    const iv = randomBytes(12),
      c = createCipheriv("aes-256-gcm", this.key, iv),
      b = Buffer.concat([c.update(JSON.stringify(value), "utf8"), c.final()]);
    return Buffer.concat([iv, c.getAuthTag(), b]).toString("base64");
  }
  open(value) {
    const b = Buffer.from(value, "base64"),
      d = createDecipheriv("aes-256-gcm", this.key, b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return JSON.parse(
      Buffer.concat([d.update(b.subarray(28)), d.final()]).toString(),
    );
  }
  get(owner, id) {
    this.expire();
    const t =
      this.quick.get(owner + ":" + id) ||
      (() => {
        const row = this.db
          .prepare("SELECT payload FROM threads WHERE owner=? AND id=?")
          .get(owner, id);
        return row ? this.open(row.payload) : null;
      })();
    if (!t) throw Object.assign(Error("Thread unavailable"), { status: 404 });
    return structuredClone(t);
  }
  list(owner) {
    this.expire();
    return [
      ...this.db
        .prepare("SELECT payload FROM threads WHERE owner=?")
        .all(owner)
        .map((r) => this.open(r.payload)),
      ...[...this.quick.entries()]
        .filter(([k]) => k.startsWith(owner + ":"))
        .map(([, v]) => v),
    ].sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || b.updated - a.updated,
    );
  }
  save(owner, t) {
    t.updated = Date.now();
    if (t.temporary) this.quick.set(owner + ":" + t.id, structuredClone(t));
    else {
      this.db
        .prepare(
          "INSERT INTO threads VALUES(?,?,?) ON CONFLICT(owner,id) DO UPDATE SET payload=excluded.payload",
        )
        .run(owner, t.id, this.seal(t));
      this.quick.delete(owner + ":" + t.id);
    }
    return structuredClone(t);
  }
  delete(owner, id) {
    this.quick.delete(owner + ":" + id);
    this.db
      .prepare("DELETE FROM threads WHERE owner=? AND id=?")
      .run(owner, id);
  }
  expire() {
    for (const [key, t] of this.quick)
      if (Date.now() - t.updated > 30 * 60 * 1000) this.quick.delete(key);
  }
  close() {
    this.quick.clear();
    this.db.close();
  }
}
