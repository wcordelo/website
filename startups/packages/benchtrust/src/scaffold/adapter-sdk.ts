/** Scaffold adapter SDK (BENCH-016). */

import type { BenchTask } from "../types.ts";
import type { AgentAction, AgentResult } from "./reference-agent.ts";

export interface AgentAdapter {
  name: string;
  version: string;
  run(task: BenchTask, context: AdapterContext): Promise<AgentResult>;
}

export interface AdapterContext {
  workspaceDir: string;
  timeoutMs: number;
  sealed: boolean;
}

export class AdapterRegistry {
  private adapters = new Map<string, AgentAdapter>();

  register(adapter: AgentAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  get(name: string): AgentAdapter | undefined {
    return this.adapters.get(name);
  }

  list(): string[] {
    return [...this.adapters.keys()];
  }
}

export function createStubAdapter(name: string): AgentAdapter {
  return {
    name,
    version: "0.1.0",
    async run(task: BenchTask, context: AdapterContext): Promise<AgentResult> {
      const actions: AgentAction[] = [
        { type: "read", path: task.files[0] },
        { type: "bash", command: task.testCommand },
      ];
      return {
        success: context.sealed,
        actions,
        output: `[${name}] executed in ${context.workspaceDir}`,
      };
    },
  };
}

export const defaultRegistry = new AdapterRegistry();
