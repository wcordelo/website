import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { randomBytes, scryptSync } from "node:crypto";
import { wrapKey, unwrapKey } from "./aes.js";

/** Placeholder token stored in ~/.bgit/keys/ when OS keychain is unavailable. */
export const FILE_KEYCHAIN_DIR = join(homedir(), ".bgit", "keys");

export type KeychainBackend = "macos-keychain" | "file-fallback";

export interface WrappedKeyRecord {
  v: 1;
  backend: KeychainBackend;
  service: string;
  account: string;
  wrapped: string;
  created_at: string;
}

/**
 * Production path: macOS Keychain via the `security` CLI.
 * Linux secret-service and Windows DPAPI are planned; v0.1 uses file fallback.
 */
export function detectKeychainBackend(): KeychainBackend {
  if (process.platform === "darwin" && commandExists("security")) {
    return "macos-keychain";
  }
  return "file-fallback";
}

function commandExists(cmd: string): boolean {
  const r = spawnSync("which", [cmd], { encoding: "utf8" });
  return r.status === 0 && Boolean(r.stdout?.trim());
}

function keyFilePath(service: string, account: string): string {
  const safe = `${service}--${account}`.replace(/[^a-zA-Z0-9._-]/g, "_");
  return join(FILE_KEYCHAIN_DIR, `${safe}.json`);
}

function storeFileFallback(service: string, account: string, payload: string): void {
  mkdirSync(FILE_KEYCHAIN_DIR, { recursive: true, mode: 0o700 });
  const record: WrappedKeyRecord = {
    v: 1,
    backend: "file-fallback",
    service,
    account,
    wrapped: payload,
    created_at: new Date().toISOString(),
  };
  const path = keyFilePath(service, account);
  writeFileSync(path, JSON.stringify(record, null, 2) + "\n", { mode: 0o600 });
  chmodSync(path, 0o600);
}

function retrieveFileFallback(service: string, account: string): string | null {
  const path = keyFilePath(service, account);
  if (!existsSync(path)) return null;
  const record = JSON.parse(readFileSync(path, "utf8")) as WrappedKeyRecord;
  if (record.service !== service || record.account !== account) return null;
  return record.wrapped;
}

function storeMacosKeychain(service: string, account: string, payload: string): boolean {
  const deleteResult = spawnSync(
    "security",
    ["delete-generic-password", "-s", service, "-a", account],
    { encoding: "utf8" },
  );
  if (deleteResult.status !== 0 && !deleteResult.stderr?.includes("could not be found")) {
    return false;
  }
  const add = spawnSync(
    "security",
    ["add-generic-password", "-s", service, "-a", account, "-w", payload, "-U"],
    { encoding: "utf8" },
  );
  return add.status === 0;
}

function retrieveMacosKeychain(service: string, account: string): string | null {
  const result = spawnSync(
    "security",
    ["find-generic-password", "-s", service, "-a", account, "-w"],
    { encoding: "utf8" },
  );
  if (result.status !== 0) return null;
  return (result.stdout ?? "").trim() || null;
}

/** Store a wrapped key blob in the OS keychain (or ~/.bgit/keys/ fallback). */
export function storeWrappedKey(service: string, account: string, wrappedPayload: string): KeychainBackend {
  const backend = detectKeychainBackend();
  if (backend === "macos-keychain" && storeMacosKeychain(service, account, wrappedPayload)) {
    return "macos-keychain";
  }
  storeFileFallback(service, account, wrappedPayload);
  return "file-fallback";
}

/** Retrieve a wrapped key blob from keychain or file fallback. */
export function retrieveWrappedKey(service: string, account: string): string | null {
  const backend = detectKeychainBackend();
  if (backend === "macos-keychain") {
    const fromKeychain = retrieveMacosKeychain(service, account);
    if (fromKeychain) return fromKeychain;
  }
  return retrieveFileFallback(service, account);
}

/** Generate and persist a repo-specific wrapping key via keychain + file fallback. */
export function getOrCreateRepoWrappingKey(service: string, account: string): Buffer {
  const existing = retrieveWrappedKey(service, account);
  if (existing) {
    const envelopeKey = deriveEnvelopeKey(service, account);
    return unwrapKey(existing, envelopeKey);
  }
  const wrappingKey = randomBytes(32);
  const envelopeKey = deriveEnvelopeKey(service, account);
  const wrapped = wrapKey(wrappingKey, envelopeKey);
  storeWrappedKey(service, account, wrapped);
  return wrappingKey;
}

function deriveEnvelopeKey(service: string, account: string): Buffer {
  const salt = Buffer.from(`bgit-keychain:${service}:${account}`, "utf8");
  return scryptSync(`${homedir()}:${service}:${account}`, salt, 32);
}

export function keychainServiceForRepo(bgitRoot: string): { service: string; account: string } {
  return {
    service: "bgit",
    account: `master-key:${bgitRoot}`,
  };
}
