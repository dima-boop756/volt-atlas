import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "volt_atlas_demo";
const sessionSeconds = 60 * 60 * 4;
const digest = (value: string) => createHash("sha256").update(value).digest();

function secret() {
  const value = process.env.DEMO_ACCESS_CODE?.trim();
  return value && value.length >= 12 ? value : null;
}

function signature(expires: string, code: string) {
  return createHmac("sha256", code).update(`volt-atlas-demo-v1:${expires}`).digest("base64url");
}

export async function hasDemoSession() {
  const code = secret();
  const value = (await cookies()).get(cookieName)?.value;
  if (!code || !value) return false;
  const [expires, provided, extra] = value.split(".");
  if (extra || !provided || !/^\d{10}$/.test(expires) || Number(expires) <= Date.now() / 1000) return false;
  return timingSafeEqual(digest(signature(expires, code)), digest(provided));
}

export async function grantDemoSession(input: unknown) {
  const code = secret();
  if (!code) return "Режим редактирования пока не настроен.";
  if (typeof input !== "string" || input.length > 256 ||
    !timingSafeEqual(digest(code), digest(input.trim()))) return "Неверный код доступа.";

  const expires = String(Math.floor(Date.now() / 1000) + sessionSeconds);
  (await cookies()).set(cookieName, `${expires}.${signature(expires, code)}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: sessionSeconds,
  });
  return null;
}

export async function endDemoSession() {
  (await cookies()).delete(cookieName);
}
