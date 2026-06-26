import type { CliContext, CommandResult } from "../types.js";

export function emitJson(ctx: CliContext, result: CommandResult): void {
  if (!ctx.json) return;
  console.log(JSON.stringify(result, null, 2));
}

export function emitError(ctx: CliContext, result: CommandResult): never {
  emitJson(ctx, result);
  if (!ctx.json) {
    console.error(`bnpm: ${result.message ?? "command failed"}`);
  }
  process.exit(result.exitCode);
}

export function success(
  ctx: CliContext,
  command: string,
  data?: unknown,
  message?: string,
): CommandResult {
  const result: CommandResult = { ok: true, command, exitCode: 0, data, message };
  emitJson(ctx, result);
  if (message && !ctx.json) {
    console.log(message);
  }
  return result;
}
