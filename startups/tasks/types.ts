export type TaskCheck =
  | { type: "file"; path: string }
  | { type: "fileContains"; path: string; includes: string }
  | { type: "fileMatches"; path: string; pattern: string }
  | { type: "dirMinFiles"; path: string; min: number; glob?: string }
  | { type: "jsonMinLength"; path: string; min: number }
  | { type: "testTagged"; package: string; taskId: string };

export interface TaskDefinition {
  id: string;
  package: string;
  title: string;
  checks: TaskCheck[];
}
