#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { initCommand } from "./commands/init.js";
import { sessionStartCommand, sessionEndCommand } from "./commands/session.js";
import { checkpointCommand } from "./commands/checkpoint.js";
import { whyCommand } from "./commands/why.js";
import { traceCommand } from "./commands/trace.js";
import { secretSetCommand, secretGetCommand, secretListCommand } from "./commands/secret.js";
import { runMcpServer } from "./commands/mcp.js";
import { exportCommand } from "./commands/export.js";
import { workspaceAddCommand } from "./commands/workspace.js";
import { filterCommand, parseFilterArgs } from "./commands/filter.js";
import type { OutputOptions } from "./output.js";


async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const json = argv.includes("--json");
  const args = argv.filter((a) => a !== "--json");

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    return;
  }

  const [cmd, sub, ...rest] = args;
  const opts: OutputOptions = { json };

  switch (cmd) {
    case "init":
      await initCommand(opts);
      break;
    case "session":
      if (sub === "start") {
        const { values, positionals } = parseArgs({
          args: rest,
          options: {
            goal: { type: "string", short: "g" },
            agent: { type: "string" },
            user: { type: "string" },
            issue: { type: "string" },
          },
          allowPositionals: true,
        });
        const goal = values.goal ?? positionals.join(" ");
        await sessionStartCommand(goal, { ...opts, agent: values.agent, user: values.user, issue: values.issue });
      } else if (sub === "end") {
        const squash = rest.includes("--squash");
        await sessionEndCommand({ ...opts, squash });
      } else {
        console.error("usage: bgit session start|end");
        process.exit(1);
      }
      break;
    case "checkpoint":
      await checkpointCommand({
        ...opts,
        auto: rest.includes("--auto"),
        bindCommit: rest.includes("--bind-commit"),
        message: rest.find((a) => !a.startsWith("--")),
      });
      break;
    case "why":
      await whyCommand(sub ?? rest[0] ?? "", opts);
      break;
    case "trace":
      await traceCommand(sub ?? rest[0] ?? "", opts);
      break;
    case "secret":
      if (sub === "set") {
        const [name, ...valueParts] = rest.filter((a) => !a.startsWith("--"));
        await secretSetCommand(name ?? "", valueParts.join(" ") || undefined, opts);
      } else if (sub === "get") {
        await secretGetCommand(rest.find((a) => !a.startsWith("--")) ?? "", opts);
      } else if (sub === "list") {
        await secretListCommand(opts);
      } else {
        console.error("usage: bgit secret set|get|list NAME");
        process.exit(1);
      }
      break;
    case "mcp":
      await runMcpServer();
      break;
    case "export":
      await exportCommand(opts);
      break;
    case "workspace":
      if (sub === "add") {
        await workspaceAddCommand(rest.find((a) => !a.startsWith("--")) ?? "", opts);
      } else {
        console.error("usage: bgit workspace add <name>");
        process.exit(1);
      }
      break;
    case "filter": {
      const { mode, repo } = parseFilterArgs([sub ?? "", ...rest]);
      await filterCommand(mode, repo);
      break;
    }
    case "--version":
    case "version":
      console.log("bgit 0.1.0");
      break;
    default:
      console.error(`unknown command: ${cmd}`);
      printHelp();
      process.exit(1);
  }
}

function printHelp(): void {
  console.log(`bgit 0.1.0 — agent-native git overlay

Usage:
  bgit init [--json]
  bgit session start --goal "..." [--agent NAME] [--json]
  bgit session end [--squash] [--json]
  bgit checkpoint [message] [--auto] [--bind-commit] [--json]
  bgit why <file>[:line] [--json]
  bgit trace <session-id> [--json]
  bgit secret set|get|list NAME [--json]
  bgit export [--json]
  bgit workspace add <name> [--json]
  bgit filter clean|smudge [--repo PATH]
  bgit mcp
`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
