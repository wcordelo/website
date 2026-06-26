/** Sealed Docker runtime spec generator (BENCH-009). */

export interface RuntimeSpec {
  image: string;
  networkMode: "none";
  readOnlyRootfs: boolean;
  memoryMb: number;
  cpuQuota: number;
  timeoutSeconds: number;
  volumes: Array<{ host: string; container: string; mode: "ro" | "rw" }>;
  env: Record<string, string>;
  graderSidecar: GraderSidecarSpec;
}

export interface GraderSidecarSpec {
  image: string;
  networkMode: "none";
  readOnlyRootfs: true;
  mounts: string[];
}

export interface RuntimeOptions {
  taskId: string;
  workspaceDir: string;
  timeoutSeconds?: number;
  memoryMb?: number;
}

const DEFAULT_IMAGE = "benchtrust/runtime:0.1-sealed";

export function generateSealedRuntimeSpec(
  options: RuntimeOptions
): RuntimeSpec {
  const {
    taskId,
    workspaceDir,
    timeoutSeconds = 600,
    memoryMb = 4096,
  } = options;

  return {
    image: DEFAULT_IMAGE,
    networkMode: "none",
    readOnlyRootfs: true,
    memoryMb,
    cpuQuota: 100000,
    timeoutSeconds,
    volumes: [
      { host: workspaceDir, container: "/workspace", mode: "rw" },
      { host: `/tmp/benchtrust-grader-${taskId}`, container: "/grader", mode: "ro" },
    ],
    env: {
      BENCHTRUST_TASK_ID: taskId,
      BENCHTRUST_SEALED: "1",
      NO_NETWORK: "1",
    },
    graderSidecar: {
      image: "benchtrust/grader:0.1",
      networkMode: "none",
      readOnlyRootfs: true,
      mounts: ["/tests:ro", "/expected:ro"],
    },
  };
}

export function specToDockerCompose(spec: RuntimeSpec, serviceName = "agent"): object {
  return {
    version: "3.8",
    services: {
      [serviceName]: {
        image: spec.image,
        network_mode: spec.networkMode,
        read_only: spec.readOnlyRootfs,
        mem_limit: `${spec.memoryMb}m`,
        cpu_quota: spec.cpuQuota,
        environment: spec.env,
        volumes: spec.volumes.map(
          (v) => `${v.host}:${v.container}:${v.mode}`
        ),
      },
      grader: {
        image: spec.graderSidecar.image,
        network_mode: spec.graderSidecar.networkMode,
        read_only: spec.graderSidecar.readOnlyRootfs,
        volumes: spec.graderSidecar.mounts.map((m) => `${m}`),
      },
    },
  };
}

export function specToDockerRunArgs(spec: RuntimeSpec): string[] {
  const args = [
    "run",
    "--rm",
    "--network", spec.networkMode,
    "--read-only",
    "--memory", `${spec.memoryMb}m`,
    "--env", `BENCHTRUST_SEALED=1`,
  ];
  for (const v of spec.volumes) {
    args.push("-v", `${v.host}:${v.container}:${v.mode}`);
  }
  for (const [k, val] of Object.entries(spec.env)) {
    args.push("-e", `${k}=${val}`);
  }
  args.push(spec.image);
  return args;
}
