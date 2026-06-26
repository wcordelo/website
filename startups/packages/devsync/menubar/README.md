# DevSync macOS Menubar App

**SYNC-022** — Tauri scaffold specification for the macOS menubar companion.

## Overview

The menubar app provides always-on sync status without a terminal. It wraps `devsyncd` via IPC and surfaces pairing, pause/resume, and conflict counts.

## Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Shell | **Tauri 2** | Native menubar tray, small binary, Rust core reuse |
| UI | **React** or **Svelte** | Fast iteration; menubar panel is small |
| IPC | Unix socket → `devsyncd` | Same protocol as CLI |
| Icons | SF Symbols + template PNG | macOS HIG compliance |

## Project Layout (scaffold)

```
menubar/
├── README.md                 # This file
├── src-tauri/
│   ├── Cargo.toml            # tauri = "2", devsync-daemon dep (future)
│   ├── tauri.conf.json       # tray icon, no main window by default
│   ├── icons/                # 16/32/128/256/512 tray assets
│   └── src/
│       ├── main.rs           # Tauri entry, tray menu
│       └── ipc.rs            # devsyncd socket client
└── src/
    ├── App.tsx               # Popover panel UI
    └── hooks/useSyncStatus.ts
```

## Tauri Configuration (`tauri.conf.json` sketch)

```json
{
  "productName": "DevSync",
  "identifier": "dev.devsync.menubar",
  "app": {
    "trayIcon": {
      "iconPath": "icons/tray.png",
      "iconAsTemplate": true
    },
    "windows": [
      {
        "label": "panel",
        "width": 320,
        "height": 400,
        "visible": false,
        "decorations": false,
        "alwaysOnTop": true
      }
    ]
  }
}
```

## Tray Menu Actions

| Item | Action |
|------|--------|
| Status | Show synced / pending / conflict counts per root |
| Pause All | `devsync pause <root>` for each active root |
| Pair Device | Display 6-word code + QR (future) |
| Open Conflicts | Launch conflict TUI or in-panel resolver |
| Preferences | Open `sync.yaml` location, telemetry opt-in |
| Quit | Stop daemon gracefully |

## IPC Protocol (daemon → menubar)

```json
{ "cmd": "status", "response": { "roots": [...], "peers": 2 } }
{ "cmd": "pair_show" }
{ "cmd": "pause", "root_id": "..." }
```

## Build Commands (when implemented)

```bash
cd menubar
npm install
npm run tauri build
```

## MVP Scope

- Tray icon with green/yellow/red state
- Popover listing sync roots and counts
- No file browser — conflicts link to `devsync conflicts` CLI

## Status

Documentation and scaffold spec only. Implementation blocked on SYNC-014 daemon IPC hardening.
