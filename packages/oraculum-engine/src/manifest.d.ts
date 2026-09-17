export const SESSION_MANIFEST_VERSION: string;
export const SESSION_CANONICAL_JSON_VERSION: string;

export interface SessionManifestInput {
  scanProfile?: string;
  legality: Readonly<Record<string, any>>;
  ritualIntegrity?: Readonly<Record<string, any>> | null;
  raw: Readonly<Record<string, any>>;
  interpretation: Readonly<Record<string, any>>;
}

export interface SessionManifest extends Readonly<Record<string, any>> {
  manifestVersion: string;
  scanProfile: string;
  oracle: Readonly<Record<string, any>>;
  physical: Readonly<Record<string, any>>;
  outputs: Readonly<Record<string, any>>;
  interpretation: Readonly<Record<string, any>>;
  audit: Readonly<{
    canonicalization: string;
    checksumAlgorithm: 'SHA-256';
    checksum: string;
    sessionId: string;
  }>;
}

export function canonicalJson(value: unknown): string;
export function buildSessionManifest(input: SessionManifestInput): Readonly<SessionManifest>;
export function verifySessionManifest(manifest: unknown): boolean;
