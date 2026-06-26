# Better npm GitHub Action (NPM-015)

Runs blocklist pre-check and pipeline audit on pull requests.

## Usage

```yaml
name: Security
on: [pull_request]

jobs:
  bnpm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./startups/packages/bnpm/action
        with:
          policy: .better-npmrc
          fail-on: block
```

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `policy` | `.better-npmrc` | Policy file path |
| `fail-on` | `block` | Failure threshold |
| `working-directory` | `.` | Project root |

## Outputs

Uploads SARIF to GitHub Security tab from `bnpm audit-pipeline`.

## Requirements

- Bun or Node 18+
- Lockfile recommended for accurate block checks
