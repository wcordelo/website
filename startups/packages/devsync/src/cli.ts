#!/usr/bin/env bun
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  initConfig,
  loadConfig,
  saveConfig,
  configPath,
  configDir,
  findRoot,
  type SyncRoot,
  type IgnoreProfile,
} from "./config.ts";
import { SyncEngine, ensureTransportDir } from "./sync/index.ts";
import {
  getOrCreateOffer,
  acceptPairingCode,
  formatPairingCode,
} from "./pairing/code.ts";
import { describeProfile } from "./ignore/index.ts";

const HELP = `
devsync v0.1 — Developer-native sync (TypeScript/Bun MVP)

Usage:
  devsync init                     Initialize sync config (~/.devsync/)
  devsync add <path> [--profile]   Add sync root with git-safe defaults
  devsync status                   Show sync state
  devsync pair --show-code         Display 6-word pairing code
  devsync pair <code>              Pair with remote peer using code
  devsync pause <root>             Pause sync for a root
  devsync resume <root>            Resume sync for a root
  devsync watch <root>             Watch root for changes (foreground)
  devsync daemon                   Start devsyncd (Unix socket stub)

Options:
  --profile <name>   Ignore profile: default | minimal | node_regen
  --show-code        Show pairing code (with pair command)

Git safety: .git/ is NEVER synced unless dangerously_sync_git: true (SYNC-007)
`.trim();

function main(): void {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(HELP);
    process.exit(0);
  }

  const cmd = args[0];

  switch (cmd) {
    case "init":
      cmdInit();
      break;
    case "add":
      cmdAdd(args.slice(1));
      break;
    case "status":
      cmdStatus();
      break;
    case "pair":
      cmdPair(args.slice(1));
      break;
    case "pause":
      cmdPauseResume(args.slice(1), true);
      break;
    case "resume":
      cmdPauseResume(args.slice(1), false);
      break;
    case "watch":
      cmdWatch(args.slice(1));
      break;
    case "daemon":
      cmdDaemon();
      break;
    default:
      console.error(`Unknown command: ${cmd}\n`);
      console.log(HELP);
      process.exit(1);
  }
}

function cmdInit(): void {
  const config = initConfig();
  ensureTransportDir(config);
  console.log("DevSync initialized");
  console.log(`  Config:  ${configPath()}`);
  console.log(`  State:   ${configDir()}/state.db`);
  console.log(`  Device:  ${config.deviceName} (${config.deviceId})`);
  console.log(`  Git safety: .git/ hard-excluded (SYNC-007)`);
}

function cmdAdd(args: string[]): void {
  const config = loadConfig() ?? initConfig();
  let profile: IgnoreProfile = "default";
  const filtered: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--profile" && args[i + 1]) {
      profile = args[i + 1] as IgnoreProfile;
      i++;
    } else if (args[i] !== "--profile") {
      filtered.push(args[i]!);
    }
  }

  const pathArg = filtered[0];
  if (!pathArg) {
    console.error("Usage: devsync add <path> [--profile default|minimal|node_regen]");
    process.exit(1);
  }

  const absPath = resolve(pathArg);
  if (!existsSync(absPath)) {
    console.error(`Path does not exist: ${absPath}`);
    process.exit(1);
  }

  if (!statSync(absPath).isDirectory()) {
    console.error(`Path must be a directory: ${absPath}`);
    process.exit(1);
  }

  const existing = findRoot(config, absPath);
  if (existing) {
    console.log(`Root already registered: ${existing.path}`);
    process.exit(0);
  }

  const root: SyncRoot = {
    id: crypto.randomUUID(),
    path: absPath,
    profile,
    paused: false,
    addedAt: new Date().toISOString(),
  };

  config.roots.push(root);
  saveConfig(config);
  ensureTransportDir(config);

  const engine = new SyncEngine(config);
  const result = engine.scanRoot(root);
  engine.close();

  console.log(`Added sync root: ${absPath}`);
  console.log(`  ID:      ${root.id}`);
  console.log(`  Profile: ${profile} — ${describeProfile(profile)}`);
  console.log(`  Scanned: ${result.scanned} files, ${result.ignored} ignored, ${result.queued} queued`);
  console.log(`  Git:     .git/ hard-excluded`);
}

function cmdStatus(): void {
  const config = loadConfig();
  if (!config) {
    console.error("DevSync not initialized. Run: devsync init");
    process.exit(1);
  }

  console.log(`DevSync status — ${config.deviceName}`);
  console.log(`  Device ID: ${config.deviceId}`);
  console.log(`  Config:    ${configPath()}`);
  console.log(`  Git safety: ${config.dangerouslySyncGit ? "DISABLED (danger mode)" : "enabled (.git/ excluded)"}`);
  console.log(`  Peers:     ${config.peers.length}`);

  if (config.roots.length === 0) {
    console.log("\nNo sync roots. Run: devsync add <path>");
    return;
  }

  const engine = new SyncEngine(config);

  console.log("\nSync roots:");
  for (const root of config.roots) {
    const counts = engine.getState().countByState(root.id);
    const status = root.paused ? "PAUSED" : "active";
    console.log(`  [${status}] ${root.path}`);
    console.log(`    profile: ${root.profile} | pending: ${counts.pending ?? 0} | synced: ${counts.synced ?? 0} | conflict: ${counts.conflict ?? 0}`);
  }

  const pending = engine.getState().pendingTransfers();
  if (pending.length > 0) {
    console.log(`\nPending transfers: ${pending.length}`);
  }

  engine.close();
}

function cmdPair(args: string[]): void {
  const config = loadConfig() ?? initConfig();
  const showCode = args.includes("--show-code");
  const codeArg = args.find((a) => !a.startsWith("--"));

  if (showCode || !codeArg) {
    const offer = getOrCreateOffer(config.deviceId, config.deviceName);
    console.log("Pairing code (valid 15 minutes):");
    console.log(`  ${formatPairingCode(offer)}`);
    console.log(`  ${offer.code}`);
    console.log("\nShare this code with your other machine, then run:");
    console.log("  devsync pair <code>");
    return;
  }

  try {
    const peer = acceptPairingCode(codeArg, config.deviceId, config.deviceName);
    config.peers.push({
      id: peer.deviceId,
      name: peer.deviceName,
      pairedAt: peer.pairedAt,
      publicKey: peer.publicKey,
    });
    saveConfig(config);
    console.log(`Paired with: ${peer.deviceName}`);
    console.log(`  Peer ID: ${peer.deviceId}`);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

function cmdPauseResume(args: string[], pause: boolean): void {
  const config = loadConfig();
  if (!config) {
    console.error("DevSync not initialized. Run: devsync init");
    process.exit(1);
  }

  const rootArg = args[0];
  if (!rootArg) {
    console.error(`Usage: devsync ${pause ? "pause" : "resume"} <root>`);
    process.exit(1);
  }

  const root = findRoot(config, rootArg);
  if (!root) {
    console.error(`Root not found: ${rootArg}`);
    process.exit(1);
  }

  root.paused = pause;
  saveConfig(config);
  console.log(`${pause ? "Paused" : "Resumed"} sync for: ${root.path}`);
}

async function cmdWatch(args: string[]): Promise<void> {
  const config = loadConfig();
  if (!config) {
    console.error("DevSync not initialized. Run: devsync init");
    process.exit(1);
  }

  const rootArg = args[0];
  if (!rootArg) {
    console.error("Usage: devsync watch <root>");
    process.exit(1);
  }

  const root = findRoot(config, rootArg);
  if (!root) {
    console.error(`Root not found: ${rootArg}`);
    process.exit(1);
  }

  const { DebouncedWatcher } = await import("./watcher/index.ts");
  const engine = new SyncEngine(config);

  console.log(`Watching ${root.path} (Ctrl+C to stop)...`);

  const watcher = new DebouncedWatcher(root.path, (_event, path) => {
    const rel = path.replace(root.path + "/", "");
    console.log(`  change: ${rel}`);
    engine.scanRoot(root);
  });

  watcher.start();

  process.on("SIGINT", () => {
    watcher.stop();
    engine.close();
    process.exit(0);
  });
}

async function cmdDaemon(): Promise<void> {
  const config = loadConfig() ?? initConfig();
  const { DevSyncDaemon } = await import("./daemon/devsyncd.ts");
  const daemon = new DevSyncDaemon(config);
  await daemon.start();
  console.log(`devsyncd listening on ${config.daemonSocket}`);
  process.on("SIGINT", () => {
    daemon.stop();
    process.exit(0);
  });
}

main();
