# DevSync Windows Alpha Port

**SYNC-031** — Porting notes for Windows support.

## Current MVP Status

The TypeScript/Bun MVP targets Unix-first workflows:

| Component | Linux/macOS | Windows gap |
|-----------|-------------|-------------|
| CLI (`devsync`) | ✅ Bun runs on Windows | Tested minimally |
| Daemon IPC | Unix domain socket | Needs named pipe (`\\.\pipe\devsyncd`) |
| Watcher | `fs.watch` | Works; debounce tuning needed |
| Config path | `~/.devsync/` | `%USERPROFILE%\.devsync\` (works via `homedir()`) |
| Git lock | `.git/index.lock` | Same path semantics |
| FUSE mount | N/A on Windows | Use sync folder directly |

## Priority Porting Tasks

### 1. Named Pipe IPC (SYNC-014)

Replace `devsyncd.sock` with:

```
\\.\pipe\devsync-{deviceId}
```

Use `node:net` `createServer({ path: '\\\\.\\pipe\\devsync' })` on Windows.

### 2. Path Handling

- Normalize `C:\Users\...` vs `/` separators in relative paths
- Watch for case-insensitivity collisions (`File.ts` vs `file.ts`)
- Use `path.win32` in transport manifest safe-name encoding

### 3. File Locking

- Git `index.lock` — same check as SYNC-016
- Add awareness of Windows exclusive locks (`EBUSY` on open)

### 4. Service Installation

```powershell
# Future: run devsyncd as Windows Service
sc create devsyncd binPath= "C:\Program Files\DevSync\devsyncd.exe"
```

### 5. Ignore Profiles

- Add `Thumbs.db`, `desktop.ini`, `$RECYCLE.BIN/` to `default` profile (partially present)
- Exclude `AppData\Local\` junction noise

## QUIC / mDNS on Windows

- mDNS: use Bonjour or embedded responder (production Rust)
- QUIC: `quinn` supports Windows; firewall prompt on first bind

## VS Code Extension

Cross-platform — see `extension/` (SYNC-032). Status bar works on Windows VS Code.

## Testing Matrix

| Test | WSL2 | Native Windows |
|------|------|----------------|
| `bun test` | ✅ Primary CI | Target alpha |
| Multi-root sync | ✅ | Verify drive letters |
| Git lock pause | ✅ | Manual test |

## Recommended Alpha Path

1. Bun CLI + file-based transport on native Windows
2. Named pipe daemon
3. Rust binary with MSI installer (production)

## Status

Documentation and gap analysis. Native Windows alpha follows menubar (SYNC-022) and relay (SYNC-019) stabilization.
