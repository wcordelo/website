import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SimulatedMdnsRegistry, MDNS_SERVICE_TYPE } from "../src/transport/mdns.ts";

describe("mDNS discovery stub (SYNC-009)", () => {
  let registryDir: string;
  let registry: SimulatedMdnsRegistry;

  beforeEach(() => {
    registryDir = join(tmpdir(), `devsync-mdns-${Date.now()}`);
    registry = new SimulatedMdnsRegistry(registryDir);
  });

  afterEach(() => {
    rmSync(registryDir, { recursive: true, force: true });
  });

  test("registers and discovers peers", async () => {
    registry.register("peer-1", "MacBook-Pro", "192.168.1.10", 4433);
    registry.register("peer-2", "Linux-Dev", "192.168.1.11", 4433);

    const peers = await registry.discover(10);
    expect(peers).toHaveLength(2);
    expect(peers.map((p) => p.deviceName).sort()).toEqual(["Linux-Dev", "MacBook-Pro"]);
  });

  test("unregisters peer", () => {
    registry.register("peer-1", "MacBook-Pro");
    expect(registry.listPeers()).toHaveLength(1);
    registry.unregister("peer-1");
    expect(registry.listPeers()).toHaveLength(0);
  });

  test("service type constant matches RFC", () => {
    expect(MDNS_SERVICE_TYPE).toBe("_devsync._udp");
  });
});
