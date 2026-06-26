/** Reference agent scaffold (BENCH-015). */

import type { BenchTask } from "../types.ts";

export interface AgentAction {
  type: "read" | "write" | "bash";
  path?: string;
  content?: string;
  command?: string;
}

export interface AgentResult {
  success: boolean;
  actions: AgentAction[];
  output: string;
}

export interface ReferenceAgentOptions {
  maxSteps?: number;
  seed?: number;
}

/**
 * Stub reference agent — reads task, writes placeholder fix, runs tests.
 * Production: LLM-driven tool loop in sealed runtime.
 */
export async function runReferenceAgent(
  task: BenchTask,
  options: ReferenceAgentOptions = {}
): Promise<AgentResult> {
  const { maxSteps = 5, seed = 42 } = options;
  const actions: AgentAction[] = [];

  actions.push({ type: "read", path: task.files[0] });
  actions.push({
    type: "write",
    path: task.files[0],
    content: `# fix for ${task.id}\n# seed=${seed}\npass\n`,
  });
  actions.push({ type: "bash", command: task.testCommand });

  const success = actions.length <= maxSteps && task.scope !== "wide";

  return {
    success,
    actions,
    output: success ? "tests passed (stub)" : "tests failed (stub)",
  };
}

export const REFERENCE_AGENT_VERSION = "reference-agent-0.1.0";
