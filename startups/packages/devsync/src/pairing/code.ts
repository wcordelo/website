import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { pairingPath, ensureConfigDir } from "../config.ts";

const WORDS = [
  "alpha", "bravo", "charlie", "delta", "echo", "foxtrot",
  "golf", "hotel", "india", "juliet", "kilo", "lima",
  "mike", "november", "oscar", "papa", "quebec", "romeo",
  "sierra", "tango", "uniform", "victor", "whiskey", "xray",
  "yankee", "zulu", "amber", "bronze", "coral", "daisy",
];

export interface PairingOffer {
  code: string;
  words: string[];
  publicKey: string;
  deviceId: string;
  deviceName: string;
  createdAt: string;
  expiresAt: string;
}

export interface PairingSession {
  local: PairingOffer;
  pairedPeers: { code: string; peer: PairedPeer }[];
}

export interface PairedPeer {
  deviceId: string;
  deviceName: string;
  publicKey: string;
  pairedAt: string;
}

const CODE_TTL_MS = 15 * 60 * 1000;

export function generateWords(count = 6): string[] {
  const selected: string[] = [];
  const used = new Set<number>();
  while (selected.length < count) {
    const idx = Math.floor(Math.random() * WORDS.length);
    if (used.has(idx)) continue;
    used.add(idx);
    selected.push(WORDS[idx]!);
  }
  return selected;
}

export function wordsToCode(words: string[]): string {
  return words.join("-");
}

export function parseCode(code: string): string[] {
  return code.toLowerCase().split("-").filter(Boolean);
}

export function isValidCodeFormat(code: string): boolean {
  const words = parseCode(code);
  if (words.length !== 6) return false;
  return words.every((w) => WORDS.includes(w));
}

export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.subtle
    ? generateSyncKeyPair()
    : { publicKey: crypto.randomUUID(), privateKey: crypto.randomUUID() };
  return { publicKey, privateKey };
}

function generateSyncKeyPair(): { publicKey: string; privateKey: string } {
  // MVP: UUID-based keys; production uses X25519 via QUIC handshake
  return {
    publicKey: `pk_${crypto.randomUUID().replace(/-/g, "")}`,
    privateKey: `sk_${crypto.randomUUID().replace(/-/g, "")}`,
  };
}

export function createPairingOffer(
  deviceId: string,
  deviceName: string,
): PairingOffer {
  const words = generateWords(6);
  const { publicKey } = generateKeyPair();
  const now = new Date();
  const expires = new Date(now.getTime() + CODE_TTL_MS);

  return {
    code: wordsToCode(words),
    words,
    publicKey,
    deviceId,
    deviceName,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
}

export function loadPairingSession(): PairingSession | null {
  const path = pairingPath();
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as PairingSession;
}

export function savePairingSession(session: PairingSession): void {
  ensureConfigDir();
  writeFileSync(pairingPath(), JSON.stringify(session, null, 2), "utf8");
}

export function getOrCreateOffer(deviceId: string, deviceName: string): PairingOffer {
  const session = loadPairingSession();
  if (session?.local) {
    const expired = new Date(session.local.expiresAt) < new Date();
    if (!expired) return session.local;
  }

  const offer = createPairingOffer(deviceId, deviceName);
  savePairingSession({
    local: offer,
    pairedPeers: session?.pairedPeers ?? [],
  });
  return offer;
}

export function acceptPairingCode(
  code: string,
  localDeviceId: string,
  localDeviceName: string,
): PairedPeer {
  if (!isValidCodeFormat(code)) {
    throw new Error("Invalid pairing code: expected 6 words separated by hyphens");
  }

  const session = loadPairingSession() ?? {
    local: createPairingOffer(localDeviceId, localDeviceName),
    pairedPeers: [],
  };

  const peer: PairedPeer = {
    deviceId: `peer_${parseCode(code).join("_")}`,
    deviceName: `peer-${code.slice(0, 8)}`,
    publicKey: `pk_${crypto.randomUUID().replace(/-/g, "")}`,
    pairedAt: new Date().toISOString(),
  };

  session.pairedPeers.push({ code: code.toLowerCase(), peer });
  savePairingSession(session);

  // Write to transport dir for MVP cross-machine discovery
  const transportPairDir = join(
    process.env.HOME ?? "/tmp",
    ".devsync",
    "transport",
    "pairing",
  );
  if (!existsSync(transportPairDir)) mkdirSync(transportPairDir, { recursive: true });
  writeFileSync(
    join(transportPairDir, `${peer.deviceId}.json`),
    JSON.stringify({ code, peer, localDeviceId }, null, 2),
  );

  return peer;
}

export function formatPairingCode(offer: PairingOffer): string {
  return offer.words.join("  ");
}
