export { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  
  if (!githubClientId) {
    console.error("Missing VITE_GITHUB_CLIENT_ID environment variable");
  }
  
  // Use a safe fallback for redirectUri to avoid potential issues with window.location.origin
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const redirectUri = "https://chatroomlm.liphe.org/api/oauth/callback";
  
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", githubClientId || "");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "user:email");
  // state can be added for extra security
  url.searchParams.set("state", btoa(redirectUri));
  
  return url.toString();
};
