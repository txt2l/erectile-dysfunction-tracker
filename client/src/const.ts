export { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";

/**
 * Redirect to backend OAuth initiation route.
 * This ensures that the GitHub Client ID and other sensitive configuration
 * are handled exclusively on the server side.
 * 
 * ALL frontend login triggers MUST use this function.
 */
export const getLoginUrl = () => {
  return "/api/oauth/github";
};
