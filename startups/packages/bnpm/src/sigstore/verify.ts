export interface ProvenanceCheck {
  packageName: string;
  version: string;
  registry: string;
}

export interface ProvenanceResult {
  verified: boolean;
  status: "verified" | "missing" | "stub" | "error";
  message: string;
  attestations?: unknown[];
}

/**
 * Sigstore provenance verification stub (NPM-032).
 * v0.1 returns structured not-implemented; v1 will call sigstore-js.
 */
export async function verifyProvenance(
  check: ProvenanceCheck,
): Promise<ProvenanceResult> {
  void check;
  return {
    verified: false,
    status: "stub",
    message:
      "Sigstore provenance verification is not yet enabled in bnpm v0.1. " +
      "Set require_provenance in .better-npmrc to prepare for v1 enforcement.",
    attestations: [],
  };
}

export function formatProvenanceWarning(result: ProvenanceResult): string {
  return `[bnpm] provenance: ${result.status} — ${result.message}`;
}
