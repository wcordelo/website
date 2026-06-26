import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { scryptSync } from "node:crypto";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import {
  generateDataKey,
  wrapKey,
  unwrapKey,
  encryptString,
  decryptString,
  KEY_LEN,
} from "./aes.js";
import {
  detectKeychainBackend,
  getOrCreateRepoWrappingKey,
  keychainServiceForRepo,
} from "./keychain.js";
import type { EncryptedBlob, SecretMeta } from "../types.js";
import { LAYOUT } from "../store/layout.js";

export function loadOrCreateMasterKey(bgitRoot: string): Buffer {
  const keyPath = join(bgitRoot, LAYOUT.masterKey);
  if (existsSync(keyPath)) {
    const raw = readFileSync(keyPath, "utf8").trim();
    const parsed = JSON.parse(raw) as { wrapped: string };
    const passphrase = resolveMasterPassphrase(bgitRoot);
    const saltHexLen = 32;
    const salt = Buffer.from(parsed.wrapped.slice(0, saltHexLen), "hex");
    const masterKey = deriveMasterFromPassphrase(passphrase, salt);
    return unwrapKey(parsed.wrapped.slice(saltHexLen), masterKey);
  }
  return createMasterKey(bgitRoot);
}

function deriveMasterFromPassphrase(passphrase: string, salt: Buffer): Buffer {
  return scryptSync(passphrase, salt, KEY_LEN);
}

export function createMasterKey(bgitRoot: string): Buffer {
  const dataKey = generateDataKey();
  const salt = randomBytes(16);
  const passphrase = resolveMasterPassphrase(bgitRoot);
  const masterKey = deriveMasterFromPassphrase(passphrase, salt);
  const wrapped = salt.toString("hex") + wrapKey(dataKey, masterKey);
  mkdirSync(bgitRoot, { recursive: true });
  writeFileSync(
    join(bgitRoot, LAYOUT.masterKey),
    JSON.stringify({ wrapped, v: 1, keychain: detectKeychainBackend() }) + "\n",
    { mode: 0o600 },
  );
  return dataKey;
}

function resolveMasterPassphrase(bgitRoot: string): string {
  if (process.env.BGIT_MASTER_KEY) return process.env.BGIT_MASTER_KEY;
  const { service, account } = keychainServiceForRepo(bgitRoot);
  const wrappingKey = getOrCreateRepoWrappingKey(service, account);
  return wrappingKey.toString("base64");
}

export function setSecret(bgitRoot: string, name: string, value: string): SecretMeta {
  const masterKey = loadOrCreateMasterKey(bgitRoot);
  const secretsDir = join(bgitRoot, LAYOUT.secrets);
  mkdirSync(secretsDir, { recursive: true });
  const now = new Date().toISOString();
  const blob = encryptString(value, masterKey);
  const path = join(secretsDir, `${name}.enc.json`);
  const existing = existsSync(path);
  writeFileSync(path, JSON.stringify(blob, null, 2) + "\n", { mode: 0o600 });
  const meta: SecretMeta = {
    name,
    created_at: existing ? readMeta(path)?.created_at ?? now : now,
    updated_at: now,
    algorithm: "aes-256-gcm",
  };
  writeFileSync(join(secretsDir, `${name}.meta.json`), JSON.stringify(meta, null, 2) + "\n");
  return meta;
}

function readMeta(encPath: string): SecretMeta | null {
  const metaPath = encPath.replace(".enc.json", ".meta.json");
  if (!existsSync(metaPath)) return null;
  return JSON.parse(readFileSync(metaPath, "utf8")) as SecretMeta;
}

export function getSecret(bgitRoot: string, name: string): string {
  const masterKey = loadOrCreateMasterKey(bgitRoot);
  const path = join(bgitRoot, LAYOUT.secrets, `${name}.enc.json`);
  if (!existsSync(path)) throw new Error(`secret not found: ${name}`);
  const blob = JSON.parse(readFileSync(path, "utf8")) as EncryptedBlob;
  return decryptString(blob, masterKey);
}

export function listSecrets(bgitRoot: string): string[] {
  const secretsDir = join(bgitRoot, LAYOUT.secrets);
  if (!existsSync(secretsDir)) return [];
  return readdirSync(secretsDir)
    .filter((f: string) => f.endsWith(".enc.json"))
    .map((f: string) => f.replace(".enc.json", ""));
}
