import type { TaskDefinition } from "../types.ts";
import { npmTasks } from "./npm.ts";
import { gitTasks } from "./bgit.ts";
import { syncTasks } from "./devsync.ts";
import { shipkitTasks } from "./shipkit.ts";
import { slackTasks } from "./better-slack.ts";
import { benchTasks } from "./benchtrust.ts";

export const ALL_TASKS: TaskDefinition[] = [
  ...npmTasks,
  ...gitTasks,
  ...syncTasks,
  ...shipkitTasks,
  ...slackTasks,
  ...benchTasks,
];

export const TASK_COUNT = ALL_TASKS.length;

export const TASKS_BY_PACKAGE = ALL_TASKS.reduce<Record<string, TaskDefinition[]>>((acc, task) => {
  (acc[task.package] ??= []).push(task);
  return acc;
}, {});

export {
  npmTasks,
  gitTasks,
  syncTasks,
  shipkitTasks,
  slackTasks,
  benchTasks,
};
