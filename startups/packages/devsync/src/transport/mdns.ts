import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";

/** mDNS service type for DevSync LAN discovery (production). */
export const MDNS_SERVICE_TYPE = "_devsync._udp";
export const MDNS_PORT = 4433;

export interface DiscoveredPeer {
  deviceId: string;
  deviceName: string;
  host: string;
  port: number;
  lastSeenMs: number;
  publicKey?: string;
}

export interface MdnsRegistry {
  register(deviceId: string, deviceName: string, host?: string, port?: number): void;
  unregister(deviceId: string): void;
  discover(timeoutMs?: number): Promise<DiscoveredPeer[]>;
  listPeers(): DiscoveredPeer[];
}

/**
 * SYNC-009: mDNS peer discovery stub.
 * Production uses `_devsync._udp` via mdns-sd; MVP simulates LAN discovery
 * with a shared registry directory (one file per peer).
 */
export class SimulatedMdnsRegistry implements MdnsRegistry {
  private registryDir: string;

  constructor(baseDir: string) {
    this.registryDir = join(baseDir, "mdns");
    if (!existsSync(this.registryDir)) {
      mkdirSync(this.registryDir, { recursive: true });
    }
  }

  register(
    deviceId: string,
    deviceName: string,
    host = "127.0.0.1",
    port = MDNS_PORT,
  ): void {
    const peer: DiscoveredPeer = {
      deviceId,
      deviceName,
      host,
      port,
      lastSeenMs: Date.now(),
    };
    writeFileSync(this.peerPath(deviceId), JSON.stringify(peer), "utf8");
  }

  unregister(deviceId: string): void {
    const path = this.peerPath(deviceId);
    if (existsSync(path)) unlinkSync(path);
  }

  listPeers(): DiscoveredPeer[] {
    if (!existsSync(this.registryDir)) return [];
    return readdirSync(this.registryDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const raw = readFileSync(join(this.registryDir, f), "utf8");
        return JSON.parse(raw) as DiscoveredPeer;
      })
      .filter((p) => p.deviceId);
  }

  async discover(timeoutMs = 500): Promise<DiscoveredPeer[]> {
    await new Promise((resolve) => setTimeout(resolve, timeoutMs));
    return this.listPeers().filter((p) => p.deviceId);
  }

  private peerPath(deviceId: string): string {
    return join(this.registryDir, `${deviceId}.json`);
  }
}

/** Format peer for mDNS TXT record (production). */
export function formatTxtRecord(peer: DiscoveredPeer): Record<string, string> {
  return {
    device_id: peer.deviceId,
    device_name: peer.deviceName,
    version: "0.1",
  };
}
