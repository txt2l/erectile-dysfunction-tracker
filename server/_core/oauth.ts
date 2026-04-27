import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // EXPLICIT ROUTE: /api/oauth/github only
  // Route guard in index.ts prevents any other /api/oauth/* paths
  app.get("/api/oauth/github", (req: Request, res: Response) => {
    // Get the origin from the request header (works for all deployments)
    const origin = req.get('origin') || req.get('referer')?.split('/').slice(0, 3).join('/') || `${req.protocol}://${req.get('host')}`;
    const redirectUri = encodeURIComponent(`${origin}/api/oauth/callback`);
    const state = Buffer.from(redirectUri).toString("base64");
    const url = `https://github.com/login/oauth/authorize?client_id=${ENV.githubClientId}&redirect_uri=${redirectUri}&scope=user:email&state=${state}`;
    
    console.log("[OAuth] Initiating GitHub flow from origin:", origin);
    console.log("[OAuth] Redirecting to:", url);
    return res.redirect(url);
  });

  // EXPLICIT ROUTE: /api/oauth/callback only
  // Route guard in index.ts prevents any other /api/oauth/* paths
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    
    console.log("[OAuth] Callback received with code:", code ? "PRESENT" : "MISSING");

    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    let decodedState: string | null = null;
    if (state) {
      try {
        decodedState = Buffer.from(state, 'base64').toString('utf-8');
        console.log("[OAuth] Decoded state:", decodedState);
      } catch (e) {
        console.warn("[OAuth] Failed to decode state parameter");
      }
    }

    try {
      console.log("[OAuth] Exchanging code for token...");
      const accessToken = await sdk.exchangeCodeForToken(code);
      console.log("[OAuth] Access token obtained successfully");

      console.log("[OAuth] Fetching user info...");
      const userInfo = await sdk.getUserInfo(accessToken);
      console.log("[OAuth] User info fetched:", JSON.stringify({ ...userInfo, email: userInfo.email ? "REDACTED" : null }));

      if (!userInfo.openId) {
        console.error("[OAuth] GitHub ID missing from user info");
        res.status(400).json({ error: "GitHub ID missing from user info" });
        return;
      }

      console.log("[OAuth] Upserting user in database...");
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: "github",
        lastSignedIn: new Date(),
      });

      console.log("[OAuth] Creating session token...");
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      console.log("[OAuth] Setting cookie with options:", JSON.stringify(cookieOptions));
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log("[OAuth] Redirecting...");
      if (decodedState && decodedState.startsWith("http")) {
        // Only redirect to absolute URLs if they match our domain or are safe
        // For now, we trust the state we set in /api/oauth/github
        res.redirect(302, decodedState);
      } else {
        res.redirect(302, "/");
      }
    } catch (error: any) {
      console.error("[OAuth] Callback failed:", error.message || error);
      if (error.response) {
        console.error("[OAuth] Error response data:", JSON.stringify(error.response.data));
      }
      res.status(500).json({ 
        error: "OAuth callback failed", 
        details: error.message || "Unknown error",
        githubError: error.response?.data?.error_description || error.response?.data?.error
      });
    }
  });
}
