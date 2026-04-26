export { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // Use injected env if available, otherwise fallback to build-time env
  const injectedEnv = (window as any).ENV_INJECTED || {};
  const githubClientId = injectedEnv.GITHUB_CLIENT_ID || import.meta.env.VITE_GITHUB_CLIENT_ID || "Ov23li5jr8IVlFngehZB";
  
  // Use a safe fallback for redirectUri to avoid potential issues with window.location.origin
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const redirectUri = `${origin}/api/oauth/callback`;
  
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", githubClientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "user:email");
  // state can be added for extra security
  url.searchParams.set("state", btoa(redirectUri));
  
  return url.toString();
};
