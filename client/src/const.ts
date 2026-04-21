export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // Use injected env if available, otherwise fallback to build-time env
  const injectedEnv = (window as any).ENV_INJECTED || {};
  const oauthPortalUrl = injectedEnv.VITE_OAUTH_PORTAL_URL || import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = injectedEnv.VITE_APP_ID || import.meta.env.VITE_APP_ID;
  
  // Use a safe fallback for redirectUri to avoid potential issues with window.location.origin
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const redirectUri = `${origin}/api/oauth/callback`;
  
  // Defensive base64 encoding
  let state = "";
  try {
    state = btoa(redirectUri);
  } catch (e) {
    console.error("Failed to encode redirectUri:", e);
  }

  if (!oauthPortalUrl) {
    console.warn("VITE_OAUTH_PORTAL_URL is not defined. Please set it in your environment variables.");
    // Return a specific error path that we can handle in the frontend
    return "/login-error?reason=missing_oauth_url";
  }

  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId || "");
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    return url.toString();
  } catch (e) {
    console.error("Invalid OAuth Portal URL:", oauthPortalUrl, e);
    return "/";
  }
};
