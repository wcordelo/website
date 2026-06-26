import type { BetterNpmrc } from "../types.js";

export interface LifecycleDecision {
  allowed: boolean;
  mode: string;
  reason?: string;
}

export function evaluateLifecycleScripts(
  policy: BetterNpmrc,
  packageName?: string,
): LifecycleDecision {
  const mode = policy.lifecycle_scripts ?? "allowlist";

  switch (mode) {
    case "allow":
      return { allowed: true, mode };
    case "block":
      return {
        allowed: false,
        mode,
        reason: "lifecycle_scripts=block in .better-npmrc",
      };
    case "warn":
      return { allowed: true, mode, reason: "lifecycle scripts will run (warn mode)" };
    case "allowlist": {
      if (!packageName) {
        return { allowed: false, mode, reason: "scripts blocked unless package is allowlisted" };
      }
      const allowlist = policy.script_allowlist ?? ["esbuild", "prisma", "@prisma/client"];
      const allowed = allowlist.some(
        (entry) => packageName === entry || packageName.startsWith(`${entry}/`),
      );
      return allowed
        ? { allowed: true, mode }
        : {
            allowed: false,
            mode,
            reason: `package "${packageName}" not in script_allowlist`,
          };
    }
    default:
      return { allowed: true, mode };
  }
}

export function shouldIgnoreScripts(policy: BetterNpmrc, strictCi = false): boolean {
  if (strictCi) return true;
  return policy.lifecycle_scripts === "block";
}
