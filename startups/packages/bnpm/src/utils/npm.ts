import { spawnSync } from "node:child_process";

export interface NpmRunOptions {
  cwd?: string;
  extraArgs?: string[];
  env?: NodeJS.ProcessEnv;
}

export function runNpm(
  npmArgs: string[],
  options: NpmRunOptions = {},
): { exitCode: number; stdout: string; stderr: string } {
  const args = ["npm", ...npmArgs, ...(options.extraArgs ?? [])];
  const result = spawnSync(args[0]!, args.slice(1), {
    cwd: options.cwd ?? process.cwd(),
    env: { ...process.env, ...options.env },
    encoding: "utf-8",
    stdio: ["inherit", "pipe", "pipe"],
  });

  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout?.toString() ?? "",
    stderr: result.stderr?.toString() ?? "",
  };
}

export function passthroughNpm(npmArgs: string[], cwd?: string): number {
  const result = spawnSync("npm", npmArgs, {
    cwd: cwd ?? process.cwd(),
    stdio: "inherit",
    env: process.env,
  });
  return result.status ?? 1;
}
