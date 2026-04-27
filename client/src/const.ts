export { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";

// Redirect to backend OAuth initiation route
export const getLoginUrl = () => {
  return "/api/oauth/github";
};
