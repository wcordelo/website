import type { EasOAuthConfig, EasToken } from "../types.js";

const EXPO_OAUTH_BASE = "https://expo.dev/oauth/authorize";
const EXPO_TOKEN_URL = "https://expo.dev/oauth/token";

/**
 * EAS OAuth integration stub (MOB-018).
 *
 * OAuth flow:
 * 1. Call `buildAuthorizationUrl(config)` and redirect the user.
 * 2. User approves on expo.dev; Expo redirects to `redirectUri` with `?code=...`.
 * 3. Exchange the code via `exchangeAuthorizationCode(config, code)`.
 * 4. Store the returned `EasToken` and attach to scan requests for EAS build metadata.
 *
 * Required scopes: `build:read`, `project:read` for post-build AAB analysis.
 */
export function buildAuthorizationUrl(config: EasOAuthConfig, state?: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
  });
  if (state) params.set("state", state);
  return `${EXPO_OAUTH_BASE}?${params.toString()}`;
}

export async function exchangeAuthorizationCode(
  _config: EasOAuthConfig,
  code: string,
): Promise<EasToken> {
  // Stub: production would POST to EXPO_TOKEN_URL
  void EXPO_TOKEN_URL;
  if (!code || code.length < 8) {
    throw new Error("Invalid authorization code");
  }
  return {
    accessToken: `eas_stub_${code.slice(0, 8)}`,
    refreshToken: `eas_refresh_${code.slice(0, 8)}`,
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    accountId: "stub-account-id",
  };
}

export async function fetchEasBuilds(
  _token: EasToken,
  projectId: string,
): Promise<Array<{ id: string; platform: string; status: string; artifactUrl?: string }>> {
  return [
    {
      id: `build-${projectId}-001`,
      platform: "android",
      status: "finished",
      artifactUrl: `https://expo.dev/artifacts/eas/${projectId}/app-release.aab`,
    },
  ];
}

export function validateEasToken(token: EasToken): boolean {
  return Boolean(token.accessToken) && new Date(token.expiresAt) > new Date();
}
