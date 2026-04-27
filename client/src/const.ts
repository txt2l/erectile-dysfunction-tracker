export { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";

/**
 * Redirect to backend OAuth initiation route.
 * This ensures that the GitHub Client ID and other sensitive configuration
 * are handled exclusively on the server side.
 */
export const getLoginUrl = () => {
  return "/api/oauth/github";
};
