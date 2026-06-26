import { createServer, type Server, type Socket } from "node:net";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash, randomBytes } from "node:crypto";

export interface RelayConfig {
  port: number;
  dataDir: string;
  /** Stub: production uses real TLS certs. */
  tlsEnabled: boolean;
}

export interface RelaySession {
  id: string;
  peerA: string | null;
  peerB: string | null;
  createdMs: number;
  bytesRelayed: number;
}

const RELAY_MAGIC = "DEVSYNC_RELAY_V0\n";

/**
 * SYNC-019: Encrypted relay server stub.
 * Production: TLS termination + Noise protocol framing.
 * MVP: TCP relay with session tokens and file-based session log.
 */
export class RelayServer {
  private server: Server | null = null;
  private sessions = new Map<string, RelaySession>();
  private connections = new Map<string, Socket>();

  constructor(private config: RelayConfig) {
    if (!existsSync(config.dataDir)) {
      mkdirSync(config.dataDir, { recursive: true });
    }
    this.loadSessions();
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer((socket) => this.handleConnection(socket));
      this.server.listen(this.config.port, () => resolve());
    });
  }

  stop(): void {
    this.server?.close();
    this.server = null;
    for (const socket of this.connections.values()) {
      socket.destroy();
    }
    this.connections.clear();
  }

  createSession(): RelaySession {
    const session: RelaySession = {
      id: randomBytes(16).toString("hex"),
      peerA: null,
      peerB: null,
      createdMs: Date.now(),
      bytesRelayed: 0,
    };
    this.sessions.set(session.id, session);
    this.persistSessions();
    return session;
  }

  getSession(id: string): RelaySession | undefined {
    return this.sessions.get(id);
  }

  /** Stub TLS fingerprint for relay endpoint advertisement. */
  tlsFingerprint(): string {
    const seed = this.config.dataDir + String(this.config.port);
    return createHash("sha256").update(seed).digest("hex").slice(0, 16);
  }

  private handleConnection(socket: Socket): void {
    let buffer = "";
    const connId = randomBytes(8).toString("hex");
    this.connections.set(connId, socket);

    socket.on("data", (data) => {
      buffer += data.toString("utf8");
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        this.handleLine(socket, line.trim(), connId);
      }
    });

    socket.on("close", () => {
      this.connections.delete(connId);
    });
  }

  private handleLine(socket: Socket, line: string, connId: string): void {
    const [cmd, ...rest] = line.split(" ");
    const arg = rest.join(" ");

    switch (cmd) {
      case "HELLO": {
        socket.write(`${RELAY_MAGIC}OK ${this.tlsFingerprint()}\n`);
        break;
      }
      case "JOIN": {
        const session = this.sessions.get(arg);
        if (!session) {
          socket.write("ERR session_not_found\n");
          return;
        }
        if (!session.peerA) {
          session.peerA = connId;
          socket.write("OK waiting\n");
        } else if (!session.peerB) {
          session.peerB = connId;
          socket.write("OK paired\n");
          const peerA = session.peerA ? this.connections.get(session.peerA) : null;
          peerA?.write("OK peer_joined\n");
        } else {
          socket.write("ERR session_full\n");
        }
        this.persistSessions();
        break;
      }
      case "RELAY": {
        socket.write("OK stub_relay\n");
        break;
      }
      default:
        socket.write("ERR unknown_command\n");
    }
  }

  private sessionsPath(): string {
    return join(this.config.dataDir, "sessions.json");
  }

  private loadSessions(): void {
    const path = this.sessionsPath();
    if (!existsSync(path)) return;
    const raw = JSON.parse(readFileSync(path, "utf8")) as RelaySession[];
    for (const s of raw) {
      this.sessions.set(s.id, s);
    }
  }

  private persistSessions(): void {
    writeFileSync(
      this.sessionsPath(),
      JSON.stringify([...this.sessions.values()], null, 2),
      "utf8",
    );
  }
}

export function createRelayServer(port = 9443, dataDir?: string): RelayServer {
  return new RelayServer({
    port,
    dataDir: dataDir ?? join(process.env.HOME ?? "/tmp", ".devsync", "relay"),
    tlsEnabled: true,
  });
}
