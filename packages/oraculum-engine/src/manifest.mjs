import { createHash } from 'node:crypto';

export const SESSION_MANIFEST_VERSION = 'HOC-SESSION-MANIFEST/V0.10';
export const SESSION_CANONICAL_JSON_VERSION = 'HOC-CANONICAL-JSON/V1';

function sha256Hex(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter(key => value[key] !== undefined)
        .map(key => [key, canonicalize(value[key])])
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function summarizeLegality(legality) {
  return Object.freeze({
    version: legality.version,
    valid: legality.valid,
    mechanicallyReachable: legality.mechanicallyReachable,
    checks: legality.checks,
    invariants: legality.invariants,
    errors: legality.errors
  });
}

function summarizeRitual(ritualIntegrity) {
  if (!ritualIntegrity) return null;
  return Object.freeze({
    version: ritualIntegrity.version,
    valid: ritualIntegrity.valid,
    integrityConfirmed: ritualIntegrity.integrityConfirmed,
    moveCount: ritualIntegrity.moveCount,
    initialCubeState: ritualIntegrity.initialCubeState,
    expectedFinalState: ritualIntegrity.expectedFinalState,
    reportedFinalState: ritualIntegrity.reportedFinalState,
    mismatches: ritualIntegrity.mismatches,
    errors: ritualIntegrity.errors
  });
}

function buildCore({ scanProfile = 'HOC-FACELET-SCAN-V1', legality, ritualIntegrity = null, raw, interpretation }) {
  if (!raw || raw.protocol !== 'HNK-ORACULUM-CUBE/V0.4') throw new Error('V0.10 manifest requires a RAW V0.4 oracle result');
  if (!legality || legality.valid !== true) throw new Error('V0.10 manifest requires a valid V0.8 legality report');
  if (raw.mode === 'RITUAL_32' && (!ritualIntegrity || ritualIntegrity.valid !== true)) {
    throw new Error('RITUAL_32 manifest requires a valid V0.9 ritual integrity report');
  }
  if (!interpretation || interpretation.rawSeed256 !== raw.raw.seed256) {
    throw new Error('Interpretation/raw seed mismatch');
  }

  return Object.freeze({
    manifestVersion: SESSION_MANIFEST_VERSION,
    scanProfile,
    oracle: Object.freeze({
      protocol: raw.protocol,
      engineVersion: raw.engineVersion,
      mode: raw.mode,
      profileId: raw.profileId,
      intent: raw.canonicalInput.intent,
      finalCubeState: raw.canonicalInput.cubeState,
      moves: raw.canonicalInput.moves,
      commit: raw.commit,
      seed256: raw.raw.seed256
    }),
    physical: Object.freeze({
      legality: summarizeLegality(legality),
      ritualIntegrity: raw.mode === 'RITUAL_32' ? summarizeRitual(ritualIntegrity) : null
    }),
    outputs: Object.freeze({
      iching: raw.iching,
      path32: raw.path32,
      hnk: raw.hnk,
      tarot: raw.tarot,
      astrology: raw.astrology,
      alchemy: raw.alchemy,
      numerology: raw.numerology,
      colors: raw.colors,
      synthesisVector: raw.synthesisVector,
      derivationReservoir: raw.derivationReservoir,
      sigil: raw.sigil,
      provenance: raw.provenance
    }),
    interpretation: Object.freeze({
      version: interpretation.interpretationVersion,
      profileId: interpretation.profileId,
      path: interpretation.path,
      tarot: interpretation.tarot,
      signals: interpretation.signals,
      convergences: interpretation.convergences,
      tensions: interpretation.tensions,
      dominantConvergence: interpretation.dominantConvergence,
      hnkOracleSemantics: interpretation.hnkOracleSemantics,
      malkuth: interpretation.malkuth
    })
  });
}

export function buildSessionManifest(input) {
  const core = buildCore(input);
  const canonicalPayload = canonicalJson(core);
  const checksum = sha256Hex(`${SESSION_MANIFEST_VERSION}|${canonicalPayload}`);
  const sessionId = `HOC-${checksum.slice(0, 24).toUpperCase()}`;
  return Object.freeze({
    ...core,
    audit: Object.freeze({
      canonicalization: SESSION_CANONICAL_JSON_VERSION,
      checksumAlgorithm: 'SHA-256',
      checksum,
      sessionId
    })
  });
}

export function verifySessionManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') return false;
  if (manifest.manifestVersion !== SESSION_MANIFEST_VERSION) return false;
  if (!manifest.audit || manifest.audit.canonicalization !== SESSION_CANONICAL_JSON_VERSION) return false;
  if (manifest.audit.checksumAlgorithm !== 'SHA-256') return false;
  const { audit, ...core } = manifest;
  const expectedChecksum = sha256Hex(`${SESSION_MANIFEST_VERSION}|${canonicalJson(core)}`);
  const expectedSessionId = `HOC-${expectedChecksum.slice(0, 24).toUpperCase()}`;
  return audit.checksum === expectedChecksum && audit.sessionId === expectedSessionId;
}
