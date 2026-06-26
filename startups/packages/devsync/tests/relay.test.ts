import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRelayServer } from "../src/relay/server.ts";
import { connect } from "node:net";

describe("encrypted relay stub (SYNC-019)", () => {
  let relayDir: string;
  let port: number;

  beforeEach(() => {
    relayDir = join(tmpdir(), `devsync-relay-${Date.now()}`);
    port = 19000 + Math.floor(Math.random() * 1000);
  });

  afterEach(() => {
    rmSync(relayDir, { recursive: true, force: true });
  });

  test("creates session and accepts HELLO", async () => {
    const relay = createRelayServer(port, relayDir);
    await relay.start();

    const session = relay.createSession();
    expect(session.id).toHaveLength(32);

    const fingerprint = relay.tlsFingerprint();
    expect(fingerprint).toMatch(/^[0-9a-f]{16}$/);

    const response = await sendLine(port, "HELLO");
    expect(response).toContain("OK");
    expect(response).toContain(fingerprint);

    relay.stop();
  });

  test("JOIN pairs two peers to session", async () => {
    const relay = createRelayServer(port, relayDir);
    await relay.start();
    const session = relay.createSession();

    const join1 = await sendLine(port, `JOIN ${session.id}`);
    expect(join1).toContain("waiting");

    const join2 = await sendLine(port, `JOIN ${session.id}`);
    expect(join2).toContain("paired");

    const updated = relay.getSession(session.id);
    expect(updated?.peerA).toBeTruthy();
    expect(updated?.peerB).toBeTruthy();

    relay.stop();
  });
});

function sendLine(port: number, line: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = connect(port, "127.0.0.1", () => {
      socket.write(line + "\n");
    });
    let data = "";
    socket.on("data", (chunk) => {
      data += chunk.toString();
      if (data.includes("\n")) {
        socket.destroy();
        resolve(data.trim());
      }
    });
    socket.on("error", reject);
    setTimeout(() => {
      socket.destroy();
      reject(new Error("timeout"));
    }, 3000);
  });
}
