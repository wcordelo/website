/** Private holdout vault — encrypted storage (BENCH-007). */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { mkdir, readFile, writeFile, appendFile, access } from "node:fs/promises";
import { join } from "node:path";
import type { BenchTask } from "../types.ts";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

export interface VaultConfig {
  vaultDir: string;
  masterKey?: string;
}

export interface VaultAuditEntry {
  timestamp: string;
  action: "store" | "retrieve" | "list" | "delete";
  taskId: string;
  actor: string;
}

export interface EncryptedBlob {
  iv: string;
  tag: string;
  ciphertext: string;
  version: string;
}

function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return scryptSync(masterKey, salt, KEY_LENGTH);
}

export class HoldoutVault {
  readonly vaultDir: string;
  private readonly masterKey: string;
  private readonly saltPath: string;
  private readonly auditPath: string;
  private key: Buffer | null = null;

  constructor(config: VaultConfig) {
    this.vaultDir = config.vaultDir;
    this.masterKey = config.masterKey ?? "benchtrust-dev-key-change-in-prod";
    this.saltPath = join(this.vaultDir, ".salt");
    this.auditPath = join(this.vaultDir, "audit.log");
  }

  async init(): Promise<void> {
    await mkdir(this.vaultDir, { recursive: true });
    let salt: Buffer;
    try {
      await access(this.saltPath);
      salt = Buffer.from(await readFile(this.saltPath));
    } catch {
      salt = randomBytes(16);
      await writeFile(this.saltPath, salt);
    }
    this.key = deriveKey(this.masterKey, salt);
  }

  private ensureKey(): Buffer {
    if (!this.key) throw new Error("Vault not initialized — call init() first");
    return this.key;
  }

  encrypt(plaintext: string): EncryptedBlob {
    const key = this.ensureKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return {
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
      ciphertext: encrypted.toString("hex"),
      version: "vault-v1",
    };
  }

  decrypt(blob: EncryptedBlob): string {
    const key = this.ensureKey();
    const decipher = createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(blob.iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(blob.tag, "hex"));
    return (
      decipher.update(blob.ciphertext, "hex", "utf8") + decipher.final("utf8")
    );
  }

  async storeTask(task: BenchTask, actor = "system"): Promise<void> {
    await this.init();
    const blob = this.encrypt(JSON.stringify(task));
    const path = join(this.vaultDir, `${task.id}.vault`);
    await writeFile(path, JSON.stringify(blob, null, 2));
    await this.audit("store", task.id, actor);
  }

  async retrieveTask(taskId: string, actor = "system"): Promise<BenchTask> {
    await this.init();
    const path = join(this.vaultDir, `${taskId}.vault`);
    const raw = await readFile(path, "utf8");
    const blob = JSON.parse(raw) as EncryptedBlob;
    await this.audit("retrieve", taskId, actor);
    return JSON.parse(this.decrypt(blob)) as BenchTask;
  }

  async listTaskIds(): Promise<string[]> {
    await this.init();
    const { readdir } = await import("node:fs/promises");
    const files = await readdir(this.vaultDir);
    return files
      .filter((f) => f.endsWith(".vault"))
      .map((f) => f.replace(".vault", ""));
  }

  private async audit(
    action: VaultAuditEntry["action"],
    taskId: string,
    actor: string
  ): Promise<void> {
    const entry: VaultAuditEntry = {
      timestamp: new Date().toISOString(),
      action,
      taskId,
      actor,
    };
    await appendFile(this.auditPath, JSON.stringify(entry) + "\n");
  }

  async readAuditLog(): Promise<VaultAuditEntry[]> {
    try {
      const raw = await readFile(this.auditPath, "utf8");
      return raw
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as VaultAuditEntry);
    } catch {
      return [];
    }
  }

  version(): string {
    return "holdout-vault-0.1.0";
  }
}
