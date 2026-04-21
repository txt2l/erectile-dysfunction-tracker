export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
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
    // Return a safe fallback instead of a route that might not exist
    return "/";
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
