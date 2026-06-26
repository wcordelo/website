import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

export type IgnoreProfile = "default" | "minimal" | "node_regen";

export interface SyncRoot {
  id: string;
  path: string;
  profile: IgnoreProfile;
  paused: boolean;
  addedAt: string;
}

export interface PeerConfig {
  id: string;
  name: string;
  pairedAt: string;
  publicKey: string;
}

export interface DevSyncConfig {
  version: 1;
  deviceId: string;
  deviceName: string;
  roots: SyncRoot[];
  peers: PeerConfig[];
  dangerouslySyncGit: boolean;
  transportDir: string;
  daemonSocket: string;
}

const CONFIG_DIR = join(homedir(), ".devsync");
const CONFIG_PATH = join(CONFIG_DIR, "sync.yaml");

export function configDir(): string {
  return CONFIG_DIR;
}

export function configPath(): string {
  return CONFIG_PATH;
}

export function stateDbPath(): string {
  return join(CONFIG_DIR, "state.db");
}

export function pairingPath(): string {
  return join(CONFIG_DIR, "pairing.json");
}

export function defaultConfig(): DevSyncConfig {
  return {
    version: 1,
    deviceId: crypto.randomUUID(),
    deviceName: process.env.HOSTNAME ?? "devsync-device",
    roots: [],
    peers: [],
    dangerouslySyncGit: false,
    transportDir: join(CONFIG_DIR, "transport"),
    daemonSocket: join(CONFIG_DIR, "devsyncd.sock"),
  };
}

export function loadConfig(): DevSyncConfig | null {
  if (!existsSync(CONFIG_PATH)) return null;
  const raw = readFileSync(CONFIG_PATH, "utf8");
  return parseYamlConfig(raw);
}

export function saveConfig(config: DevSyncConfig): void {
  ensureConfigDir();
  writeFileSync(CONFIG_PATH, serializeYamlConfig(config), "utf8");
}

export function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function initConfig(): DevSyncConfig {
  ensureConfigDir();
  const existing = loadConfig();
  if (existing) return existing;
  const config = defaultConfig();
  saveConfig(config);
  return config;
}

export function findRoot(config: DevSyncConfig, rootArg: string): SyncRoot | undefined {
  const resolved = resolve(rootArg);
  return config.roots.find(
    (r) => r.path === resolved || r.id === rootArg || r.path.endsWith(rootArg),
  );
}

/** Minimal YAML serializer for sync.yaml (no external deps). */
function serializeYamlConfig(config: DevSyncConfig): string {
  const lines: string[] = [
    `version: ${config.version}`,
    `device_id: ${config.deviceId}`,
    `device_name: ${config.deviceName}`,
    `dangerously_sync_git: ${config.dangerouslySyncGit}`,
    `transport_dir: ${config.transportDir}`,
    `daemon_socket: ${config.daemonSocket}`,
    "",
    "roots:",
  ];

  if (config.roots.length === 0) {
    lines.push("  []");
  } else {
    for (const root of config.roots) {
      lines.push(`  - id: ${root.id}`);
      lines.push(`    path: ${root.path}`);
      lines.push(`    profile: ${root.profile}`);
      lines.push(`    paused: ${root.paused}`);
      lines.push(`    added_at: ${root.addedAt}`);
    }
  }

  lines.push("", "peers:");
  if (config.peers.length === 0) {
    lines.push("  []");
  } else {
    for (const peer of config.peers) {
      lines.push(`  - id: ${peer.id}`);
      lines.push(`    name: ${peer.name}`);
      lines.push(`    paired_at: ${peer.pairedAt}`);
      lines.push(`    public_key: ${peer.publicKey}`);
    }
  }

  return lines.join("\n") + "\n";
}

/** Minimal YAML parser for our sync.yaml format. */
function parseYamlConfig(raw: string): DevSyncConfig {
  const config = defaultConfig();
  let section: "none" | "roots" | "peers" = "none";
  let currentRoot: Partial<SyncRoot> | null = null;
  let currentPeer: Partial<PeerConfig> | null = null;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (trimmed === "roots:") {
      section = "roots";
      config.roots = [];
      continue;
    }
    if (trimmed === "peers:") {
      section = "peers";
      config.peers = [];
      continue;
    }

    const match = /^([a-z_]+):\s*(.*)$/.exec(trimmed);
    if (!match) continue;
    const [, key, value] = match;
    const unquoted = (value ?? "").replace(/^["']|["']$/g, "");

    if (section === "none") {
      switch (key) {
        case "version":
          config.version = Number(unquoted) as 1;
          break;
        case "device_id":
          config.deviceId = unquoted;
          break;
        case "device_name":
          config.deviceName = unquoted;
          break;
        case "dangerously_sync_git":
          config.dangerouslySyncGit = unquoted === "true";
          break;
        case "transport_dir":
          config.transportDir = unquoted;
          break;
        case "daemon_socket":
          config.daemonSocket = unquoted;
          break;
      }
      continue;
    }

    if (section === "roots") {
      if (trimmed.startsWith("- ")) {
        if (currentRoot?.path) config.roots.push(currentRoot as SyncRoot);
        currentRoot = {};
        const inline = /^- ([a-z_]+):\s*(.*)$/.exec(trimmed);
        if (inline) {
          applyRootField(currentRoot, inline[1]!, inline[2]!.replace(/^["']|["']$/g, ""));
        }
      } else if (currentRoot) {
        applyRootField(currentRoot, key!, unquoted);
      }
      continue;
    }

    if (section === "peers") {
      if (trimmed.startsWith("- ")) {
        if (currentPeer?.id) config.peers.push(currentPeer as PeerConfig);
        currentPeer = {};
        const inline = /^- ([a-z_]+):\s*(.*)$/.exec(trimmed);
        if (inline) {
          applyPeerField(currentPeer, inline[1]!, inline[2]!.replace(/^["']|["']$/g, ""));
        }
      } else if (currentPeer) {
        applyPeerField(currentPeer, key!, unquoted);
      }
    }
  }

  if (currentRoot?.path) config.roots.push(currentRoot as SyncRoot);
  if (currentPeer?.id) config.peers.push(currentPeer as PeerConfig);

  return config;
}

function applyRootField(root: Partial<SyncRoot>, key: string, value: string): void {
  switch (key) {
    case "id":
      root.id = value;
      break;
    case "path":
      root.path = value;
      break;
    case "profile":
      root.profile = value as IgnoreProfile;
      break;
    case "paused":
      root.paused = value === "true";
      break;
    case "added_at":
      root.addedAt = value;
      break;
  }
}

function applyPeerField(peer: Partial<PeerConfig>, key: string, value: string): void {
  switch (key) {
    case "id":
      peer.id = value;
      break;
    case "name":
      peer.name = value;
      break;
    case "paired_at":
      peer.pairedAt = value;
      break;
    case "public_key":
      peer.publicKey = value;
      break;
  }
}
