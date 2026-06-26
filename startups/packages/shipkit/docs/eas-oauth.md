# EAS OAuth Integration (MOB-018)

## Flow

1. Register OAuth app at [expo.dev/settings/applications](https://expo.dev/settings/applications)
2. Set redirect URI to your dashboard callback (e.g. `https://app.shipkit.dev/auth/eas/callback`)
3. Use `buildAuthorizationUrl()` to redirect users
4. Exchange code with `exchangeAuthorizationCode()`
5. Store token and call `fetchEasBuilds()` for AAB artifacts

## Required Scopes

- `build:read` — download build artifacts for AAB analysis
- `project:read` — list projects in agency portfolio

## Code

```typescript
import { buildAuthorizationUrl, exchangeAuthorizationCode } from "@theo-startups/shipkit";

const config = {
  clientId: process.env.EAS_CLIENT_ID!,
  redirectUri: "https://app.shipkit.dev/auth/eas/callback",
  scopes: ["build:read", "project:read"],
};

// Step 1: redirect user
const url = buildAuthorizationUrl(config, csrfState);

// Step 2: exchange code on callback
const token = await exchangeAuthorizationCode(config, authorizationCode);
```

## Env Vars

```
EAS_CLIENT_ID=
EAS_CLIENT_SECRET=
EAS_REDIRECT_URI=https://app.shipkit.dev/auth/eas/callback
```
