import { randomBytes } from "node:crypto";

const ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateId(prefix: string, length = 12): string {
  const bytes = randomBytes(length);
  let suffix = "";
  for (let i = 0; i < length; i++) {
    suffix += ID_CHARS[bytes[i]! % ID_CHARS.length];
  }
  return `${prefix}_${suffix}`;
}

export function generateSessionId(): string {
  return generateId("sess");
}

export function generateCheckpointId(): string {
  return generateId("cp");
}
