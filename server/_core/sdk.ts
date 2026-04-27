import { AXIOS_TIMEOUT_MS, COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { ForbiddenError } from "../../shared/_core/errors";
import axios, { type AxiosInstance } from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import qs from 'querystring';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

export type SessionPayload = {
  openId: string;
  name: string;
};

class GitHubOAuthService {
  constructor(private client: AxiosInstance) {}

  async exchangeCodeForToken(code: string): Promise<string> {
    console.log('OAuth Debug:', {
      client_id: ENV.githubClientId,
      has_secret: !!ENV.githubClientSecret,
      code
    });

    const { data } = await this.client.post(
      GITHUB_TOKEN_URL,
      qs.stringify({
        client_id: ENV.githubClientId,
        client_secret: ENV.githubClientSecret,
        code,
      }),
      {
        headers: {
          Accept: "application/json",
          'Content-Type': 'application/x-www-form-urlencoded'
        },
      }
    );

    if (data.error) {
      console.error("[GitHub SDK] Token exchange error:", data.error, data.error_description);
      throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
    }

    return data.access_token;
  }

  async getUserInfo(accessToken: string): Promise<{ openId: string; name: string; email: string | null }> {
    const { data } = await this.client.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Erectile-Dysfunction-Tracker",
      },
    });

    return {
      openId: String(data.id),
      name: data.name || data.login,
      email: data.email || null,
    };
  }
}

class SDKServer {
  private readonly client: AxiosInstance;
  private readonly githubOAuth: GitHubOAuthService;

  constructor() {
    this.client = axios.create({
      timeout: AXIOS_TIMEOUT_MS,
    });
    this.githubOAuth = new GitHubOAuthService(this.client);
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    return this.githubOAuth.exchangeCodeForToken(code);
  }

  async getUserInfo(accessToken: string) {
    return this.githubOAuth.getUserInfo(accessToken);
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    try {
      const parsed = parseCookieHeader(cookieHeader);
      return new Map(Object.entries(parsed));
    } catch {
      return new Map<string, string>();
    }
  }

  private getSessionSecret() {
    return new TextEncoder().encode(ENV.cookieSecret || "default_secret_for_dev");
  }

  async createSessionToken(openId: string, options: { expiresInMs?: number; name?: string } = {}): Promise<string> {
    return this.signSession({ openId, name: options.name || "" }, options);
  }

  async signSession(payload: SessionPayload, options: { expiresInMs?: number } = {}): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    return new SignJWT({ openId: payload.openId, name: payload.name })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(this.getSessionSecret());
  }

  async verifySession(cookieValue: string | undefined | null): Promise<SessionPayload | null> {
    if (!cookieValue) return null;
    try {
      const { payload } = await jwtVerify(cookieValue, this.getSessionSecret(), { algorithms: ["HS256"] });
      const { openId, name } = payload as Record<string, unknown>;
      if (!isNonEmptyString(openId) || !isNonEmptyString(name)) return null;
      return { openId, name } as SessionPayload;
    } catch (error) {
      console.warn("[Auth] Session verification failed:", String(error));
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token: string | undefined;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice("Bearer ".length).trim();
    }

    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = token || cookies.get(COOKIE_NAME);
    
    if (!sessionCookie) {
      console.warn(`[Auth] No session cookie found in request to ${req.url}`);
      throw ForbiddenError("Missing session cookie");
    }

    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    let user = await db.getUserByOpenId(session.openId);
    const signedInAt = new Date();

    if (!user) {
      throw ForbiddenError("User not found");
    }

    await db.upsertUser({ openId: user.openId, lastSignedIn: signedInAt });
    return user;
  }
}

export const sdk = new SDKServer();
