import { describe, expect, test } from "bun:test";
import { ALL_TASKS, TASK_COUNT } from "../tasks/registry/index.ts";
import { validateTask } from "../tasks/validator.ts";

describe("task registry", () => {
  test("contains exactly 198 tasks", () => {
    expect(TASK_COUNT).toBe(198);
    expect(ALL_TASKS).toHaveLength(198);
  });

  test("task IDs are unique", () => {
    const ids = ALL_TASKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

for (const task of ALL_TASKS) {
  test(`${task.id}: ${task.title}`, () => {
    const errors = validateTask(task);
    if (errors.length > 0) {
      throw new Error(
        [`Task ${task.id} (${task.package}) failed validation:`, ...errors.map((e) => `  - ${e}`)].join(
          "\n",
        ),
      );
    }
    expect(errors).toEqual([]);
  });
}
