import { z } from "zod";
export const id = z.string().uuid();
export const rect = z
  .object({
    x: z.number().finite(),
    y: z.number().finite(),
    width: z.number().positive().max(16384),
    height: z.number().positive().max(16384),
  })
  .strict();
export const capture = z
  .object({
    id,
    label: z.string().max(100),
    data: z
      .string()
      .max(8_000_000)
      .regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/),
    width: z.number().int().min(1).max(8192),
    height: z.number().int().min(1).max(8192),
    reviewed: z.literal(true),
  })
  .strict();
export const createThread = z
  .object({
    id,
    title: z.string().trim().min(1).max(120),
    temporary: z.boolean(),
  })
  .strict();
export const editThread = z
  .object({
    version: z.number().int().nonnegative(),
    title: z.string().trim().min(1).max(120).optional(),
    pinned: z.boolean().optional(),
    archived: z.boolean().optional(),
    promote: z.literal(true).optional(),
    removeCaptures: z.array(id).max(24).optional(),
  })
  .strict();
export const turn = z
  .object({
    id,
    version: z.number().int().nonnegative(),
    text: z.string().trim().min(1).max(12000),
    captures: z.array(capture).max(6),
    mode: z.enum(["general", "insurance"]),
    approved: z.literal(true),
    dataClass: z.enum(["synthetic", "sanitized"]),
  })
  .strict();
export const attach = z
  .object({
    id,
    version: z.number().int().nonnegative(),
    captures: z.array(capture).min(1).max(6),
    approved: z.literal(true),
    destinationConfirmed: z.literal(true),
  })
  .strict();
export const settings = z
  .object({
    shortcut: z.string().min(3).max(80),
    login: z.boolean(),
    pin: z.boolean(),
    route: z.enum(["ask", "quick", "current"]),
    gateway: z.string().url(),
    token: z.string().max(500).optional(),
  })
  .strict();
export function pixelRect(r, display, image) {
  rect.parse(r);
  const sx = image.width / display.width,
    sy = image.height / display.height;
  const x = Math.max(0, Math.floor(r.x * sx)),
    y = Math.max(0, Math.floor(r.y * sy));
  const right = Math.min(image.width, Math.ceil((r.x + r.width) * sx)),
    bottom = Math.min(image.height, Math.ceil((r.y + r.height) * sy));
  if (right <= x || bottom <= y) throw Error("Empty region");
  return { x, y, width: right - x, height: bottom - y };
}
export function gatewayURL(value) {
  const u = new URL(value);
  if (u.username || u.password || u.search || u.hash || u.pathname !== "/")
    throw Error("Use a gateway origin only");
  if (
    u.protocol !== "https:" &&
    !(u.protocol === "http:" && u.hostname === "127.0.0.1")
  )
    throw Error("HTTPS required except 127.0.0.1");
  return u.origin;
}
