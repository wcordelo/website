/** COMM-029: SAML SSO stub — WorkOS integration docs */

export interface SamlConfig {
  workosApiKey: string;
  workosClientId: string;
  redirectUri: string;
}

export interface SamlLoginUrlResult {
  url: string;
  stub: boolean;
}

export interface SamlProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
}

/**
 * SAML SSO via WorkOS (stub).
 *
 * ## Setup (production)
 *
 * 1. Create a WorkOS account: https://workos.com/docs/sso
 * 2. Configure SAML connection for your IdP (Okta, Google Workspace, Azure AD)
 * 3. Set environment variables:
 *    - `WORKOS_API_KEY` — API key from WorkOS dashboard
 *    - `WORKOS_CLIENT_ID` — Client ID for your environment
 *    - `SAML_REDIRECT_URI` — e.g. `https://app.better-slack.dev/api/auth/saml/callback`
 *
 * ## Flow
 *
 * 1. User clicks "Sign in with SSO" → `getSamlLoginUrl(organizationId)`
 * 2. WorkOS redirects to IdP → user authenticates
 * 3. IdP posts SAML assertion to callback → `handleSamlCallback(code)`
 * 4. Exchange code for profile → create/find user → issue session token
 *
 * ## Enterprise tier
 *
 * SAML SSO is enabled on the `enterprise` billing tier (see `src/billing/stripe.ts`).
 */
export function loadSamlConfig(): SamlConfig | null {
  const workosApiKey = process.env.WORKOS_API_KEY;
  const workosClientId = process.env.WORKOS_CLIENT_ID;
  const redirectUri = process.env.SAML_REDIRECT_URI ?? "http://localhost:3847/api/auth/saml/callback";

  if (!workosApiKey || !workosClientId) return null;

  return { workosApiKey, workosClientId, redirectUri };
}

export function getSamlLoginUrl(organizationId: string): SamlLoginUrlResult {
  const config = loadSamlConfig();
  if (!config) {
    return {
      url: `/api/auth/saml/stub-login?org=${encodeURIComponent(organizationId)}`,
      stub: true,
    };
  }

  const params = new URLSearchParams({
    client_id: config.workosClientId,
    redirect_uri: config.redirectUri,
    organization: organizationId,
    response_type: "code",
  });

  return {
    url: `https://api.workos.com/sso/authorize?${params}`,
    stub: false,
  };
}

export function handleSamlCallback(code: string): SamlProfile | null {
  if (!code || code === "stub") {
    return {
      id: "saml_stub_user",
      email: "sso@better-slack.dev",
      firstName: "SSO",
      lastName: "User",
      organizationId: "org_stub",
    };
  }

  const config = loadSamlConfig();
  if (!config) return null;

  // Production: POST https://api.workos.com/sso/token with code + client_secret
  return {
    id: `saml_${code.slice(0, 8)}`,
    email: "user@enterprise.dev",
    firstName: "Enterprise",
    lastName: "User",
    organizationId: "org_from_workos",
  };
}
