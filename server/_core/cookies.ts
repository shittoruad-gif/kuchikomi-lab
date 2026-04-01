import type { Request } from "express";
import type { SerializeOptions as CookieSerializeOptions } from "cookie";
import { ENV } from "./env";

export function getSessionCookieOptions(req: Request): CookieSerializeOptions {
  const isSecure = ENV.isProduction || req.headers["x-forwarded-proto"] === "https";

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
  };
}
