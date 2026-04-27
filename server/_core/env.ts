const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
const isTest = process.env.NODE_ENV === "test";

if (!isTest && (!clientId || !clientSecret)) {
  throw new Error('Missing GitHub OAuth environment variables: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are required.');
}

export const ENV = {
  githubClientId: clientId || "test_client_id",
  githubClientSecret: clientSecret || "test_client_secret",
  cookieSecret: process.env.JWT_SECRET ?? "test_secret",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
