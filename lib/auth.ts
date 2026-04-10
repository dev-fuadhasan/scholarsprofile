import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "admin_session";

function getSecret() {
  return process.env.ADMIN_SECRET || "";
}

export function signSession(email: string) {
  const secret = getSecret();
  const payload = `${email}:${Date.now()}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}:${sig}`;
}

export function verifySession(token: string | undefined) {
  if (!token) return false;
  const secret = getSecret();
  const parts = token.split(":");
  if (parts.length < 3) return false;
  const sig = parts.pop();
  const payload = parts.join(":");
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(sig || ""), Buffer.from(expected));
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  };
}

export function requireAdmin() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySession(token)) {
    return false;
  }
  return true;
}
