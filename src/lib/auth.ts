import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { adminPassword, adminSessionSecret } from "./env";

const COOKIE = "yana_admin";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function verifyAdminPassword(password: string) {
  const expected = Buffer.from(adminPassword());
  const received = Buffer.from(password.trim());
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export function createAdminToken() {
  const expires = Date.now() + WEEK_MS;
  return `${expires}.${sign(String(expires))}`;
}

export async function isAdmin() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  return Boolean(token && readAdminToken(token));
}

export function readAdminToken(token: string) {
  const [expiresRaw, signature] = token.split(".");
  const expires = Number(expiresRaw);
  if (!expiresRaw || !signature || Number.isNaN(expires) || expires < Date.now()) {
    return false;
  }
  const expected = sign(expiresRaw);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function setAdminCookie() {
  const store = await cookies();
  store.set(COOKIE, createAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WEEK_MS / 1000,
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}

function sign(value: string) {
  return createHmac("sha256", adminSessionSecret()).update(value).digest("hex");
}
