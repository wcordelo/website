import { existsSync, unlinkSync } from "node:fs";
import { createServer, type Server, type Socket } from "node:net";
import type { DevSyncConfig } from "../config.ts";

export type DaemonRequest =
  | { cmd: "ping" }
  | { cmd: "status" }
  | { cmd: "scan"; rootId: string }
  | { cmd: "pause"; rootId: string }
  | { cmd: "resume"; rootId: string };

export type DaemonResponse =
  | { ok: true; data?: unknown }
  | { ok: false; error: string };

/**
 * SYNC-014: devsyncd daemon stub with Unix domain socket IPC.
 */
export class DevSyncDaemon {
  private server: Server | null = null;

  constructor(private config: DevSyncConfig) {}

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (existsSync(this.config.daemonSocket)) {
        try {
          unlinkSync(this.config.daemonSocket);
        } catch {
          // ignore
        }
      }

      this.server = createServer((socket) => this.handleConnection(socket));
      this.server.on("error", reject);
      this.server.listen(this.config.daemonSocket, () => resolve());
    });
  }

  private handleConnection(socket: Socket): void {
    let buffer = "";

    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const req = JSON.parse(line) as DaemonRequest;
          const res = this.handleRequest(req);
          socket.write(JSON.stringify(res) + "\n");
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          socket.write(JSON.stringify({ ok: false, error: message }) + "\n");
        }
      }
    });
  }

  private handleRequest(req: DaemonRequest): DaemonResponse {
    switch (req.cmd) {
      case "ping":
        return { ok: true, data: { deviceId: this.config.deviceId } };
      case "status":
        return {
          ok: true,
          data: {
            roots: this.config.roots.map((r) => ({
              id: r.id,
              path: r.path,
              paused: r.paused,
            })),
            peers: this.config.peers.length,
          },
        };
      case "pause": {
        const root = this.config.roots.find((r) => r.id === req.rootId);
        if (!root) return { ok: false, error: "root not found" };
        root.paused = true;
        return { ok: true };
      }
      case "resume": {
        const root = this.config.roots.find((r) => r.id === req.rootId);
        if (!root) return { ok: false, error: "root not found" };
        root.paused = false;
        return { ok: true };
      }
      case "scan":
        return { ok: true, data: { message: "scan queued", rootId: req.rootId } };
      default:
        return { ok: false, error: "unknown command" };
    }
  }

  stop(): void {
    this.server?.close();
    if (existsSync(this.config.daemonSocket)) {
      try {
        unlinkSync(this.config.daemonSocket);
      } catch {
        // ignore
      }
    }
  }
}

import { createConnection } from "node:net";

export async function daemonClient(
  socketPath: string,
  request: DaemonRequest,
): Promise<DaemonResponse> {
  return new Promise((resolve, reject) => {
    const socket = createConnection(socketPath);
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error("daemon connection timeout"));
    }, 5000);

    let buffer = "";
    socket.on("connect", () => {
      socket.write(JSON.stringify(request) + "\n");
    });
    socket.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      const line = buffer.split("\n")[0];
      if (line) {
        clearTimeout(timeout);
        resolve(JSON.parse(line) as DaemonResponse);
        socket.end();
      }
    });
    socket.on("error", (err: Error) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}
