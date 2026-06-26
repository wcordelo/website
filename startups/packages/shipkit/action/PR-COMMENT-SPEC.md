# GitHub Action — PR Comment Posting Spec (MOB-020)

## Overview

Extend the ShipKit GitHub Action to post (or update) a PR comment with scan results when triggered on `pull_request` events.

## New Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `post-comment` | No | `true` | Post scan summary as PR comment |
| `comment-tag` | No | `shipkit-scan` | HTML comment marker for idempotent updates |
| `github-token` | No | `${{ github.token }}` | Token with `pull-requests: write` |

## Workflow Example

```yaml
name: ShipKit PR Scan
on:
  pull_request:
    types: [opened, synchronize]

permissions:
  pull-requests: write
  contents: read

jobs:
  shipkit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: ./action  # or shipkit/scan-action@v1
        with:
          path: .
          post-comment: "true"
          fail-on-error: "true"
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Comment Format

Uses `formatGitHubPrComment()` from `src/integrations/github-fix.ts`:

```markdown
## ShipKit Scan Results

**Health score:** 72/100
**Expo SDK:** 51
**16KB issues:** 3
**Preflight errors:** 2

### Critical preflight failures
- [google] Target SDK: targetSdkVersion must be ≥ 34
- [apple] Privacy Manifest: PrivacyInfo.xcprivacy is missing

<sub>Powered by ShipKit</sub>
```

## Idempotent Updates

Comments are wrapped in an HTML marker for find-and-replace:

```html
<!-- shipkit-scan -->
... markdown body ...
<!-- /shipkit-scan -->
```

Implementation steps:
1. `GET /repos/{owner}/{repo}/issues/{pr_number}/comments`
2. Find comment containing `<!-- shipkit-scan -->`
3. If found: `PATCH /repos/{owner}/{repo}/issues/comments/{id}`
4. Else: `POST /repos/{owner}/{repo}/issues/{pr_number}/comments`

## GitHub App (future)

For org-wide installs without workflow token scope:
- GitHub App with `pull_requests: write`, `contents: read`
- Webhook on `pull_request` → cloud scan (MOB-017) → comment via App installation token
- Auto-fix branch creation (MOB-021) triggered on comment `/shipkit fix`

## Security

- Never echo secrets or full dependency trees in comments
- Truncate preflight failures to 5 items with "... and N more"
- Sanitize project paths in output
