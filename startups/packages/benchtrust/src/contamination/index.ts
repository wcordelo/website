export { generateCanary, embedCanaryInTask, detectCanaryLeak } from "./canary.ts";
export type { CanaryRecord } from "./canary.ts";
export { computeCRS, jaccardSimilarity } from "./crs.ts";
export { auditContamination, scanContamination } from "./audit-agent.ts";
export { classifyTrajectory } from "./reward-hack.ts";
export type { TrajectoryEvent, TrajectoryClassification } from "./reward-hack.ts";
