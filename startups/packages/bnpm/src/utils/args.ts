export interface ParsedArgs {
  json: boolean;
  command: string | null;
  subcommand: string | null;
  passthrough: string[];
  flags: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const flags: Record<string, string | boolean> = {};
  const args = argv.filter((arg) => {
    if (arg === "--json") return false;
    if (arg === "-v" || arg === "--version") {
      flags.version = true;
      return false;
    }
    if (arg === "-h" || arg === "--help") {
      flags.help = true;
      return false;
    }
    if (arg.startsWith("--") && arg !== "--") {
      const eq = arg.indexOf("=");
      if (eq !== -1) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      } else if (!arg.slice(2).includes("/")) {
        flags[arg.slice(2)] = true;
      }
    }
    return true;
  });

  const json = argv.includes("--json");
  const command = args[0] ?? null;
  const subcommand = args[1] ?? null;
  const passthrough = command ? args.slice(1) : [];

  return { json, command, subcommand, passthrough, flags };
}

export function hasFlag(flags: Record<string, string | boolean>, name: string): boolean {
  return flags[name] === true || typeof flags[name] === "string";
}

export function stripBnpmFlags(passthrough: string[]): string[] {
  return passthrough.filter(
    (a) => a !== "--json" && a !== "--no-fail" && !a.startsWith("--sarif"),
  );
}
