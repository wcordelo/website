import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import type { EncryptedBlob } from "../types.js";

const ALG = "aes-256-gcm";
const IV_LEN = 12;
const KEY_LEN = 32;
const TAG_LEN = 16;

export function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return scryptSync(passphrase, salt, KEY_LEN);
}

export function generateDataKey(): Buffer {
  return randomBytes(KEY_LEN);
}

export function encrypt(plaintext: Buffer, key: Buffer): EncryptedBlob {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALG, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: 1,
    alg: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: encrypted.toString("base64"),
  };
}

export function decrypt(blob: EncryptedBlob, key: Buffer): Buffer {
  const iv = Buffer.from(blob.iv, "base64");
  const tag = Buffer.from(blob.tag, "base64");
  const ciphertext = Buffer.from(blob.ciphertext, "base64");
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/** Age-style key wrap: encrypt data key with master key */
export function wrapKey(dataKey: Buffer, masterKey: Buffer): string {
  const wrapped = encrypt(dataKey, masterKey);
  return Buffer.from(JSON.stringify(wrapped)).toString("base64");
}

export function unwrapKey(wrappedB64: string, masterKey: Buffer): Buffer {
  const wrapped = JSON.parse(Buffer.from(wrappedB64, "base64").toString("utf8")) as EncryptedBlob;
  return decrypt(wrapped, masterKey);
}

export function encryptString(value: string, key: Buffer): EncryptedBlob {
  return encrypt(Buffer.from(value, "utf8"), key);
}

export function decryptString(blob: EncryptedBlob, key: Buffer): string {
  return decrypt(blob, key).toString("utf8");
}

export { KEY_LEN, TAG_LEN };
