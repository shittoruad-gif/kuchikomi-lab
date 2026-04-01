import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios, { type AxiosInstance } from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

class SDKServer {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {},
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId,
      appId: ENV.appId,
      name: options.name || "",
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null,
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) return null;

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (
        typeof openId !== "string" || !openId ||
        typeof appId !== "string" || !appId ||
        typeof name !== "string" || !name
      ) {
        return null;
      }

      return { openId, appId, name };
    } catch {
      return null;
    }
  }

  async exchangeCodeForToken(code: string, state: string) {
    if (!ENV.oAuthServerUrl) {
      throw new Error("OAUTH_SERVER_URL not configured");
    }
    const redirectUri = atob(state);
    const { data } = await axios.post(`${ENV.oAuthServerUrl}/webdev.v1.WebDevAuthPublicService/ExchangeToken`, {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri,
    }, { timeout: 30000 });
    return data;
  }

  async getUserInfo(accessToken: string) {
    if (!ENV.oAuthServerUrl) {
      throw new Error("OAUTH_SERVER_URL not configured");
    }
    const { data } = await axios.post(`${ENV.oAuthServerUrl}/webdev.v1.WebDevAuthPublicService/GetUserInfo`, {
      accessToken,
    }, { timeout: 30000 });

    const loginMethod = data?.platform ?? data?.loginMethod ?? null;
    return { ...data, loginMethod };
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    let user = await db.getUserByOpenId(session.openId);

    if (!user) {
      throw ForbiddenError("User not found");
    }

    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: new Date(),
    });

    return user;
  }
}

export const sdk = new SDKServer();
