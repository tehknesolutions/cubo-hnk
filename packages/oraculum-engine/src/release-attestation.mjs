import {createHash} from 'node:crypto';
import {ORACULUM_PROTOCOL} from './index.mjs';
import {CUBE_LEGALITY_VERSION} from './legality.mjs';
import {RITUAL_INTEGRITY_VERSION} from './ritual.mjs';
import {SESSION_CANONICAL_JSON_VERSION,SESSION_MANIFEST_VERSION} from './manifest.mjs';
import {HNK40_GLYPH_SET_SHA256,HNK40_STATUS} from './hnk40-runtime.mjs';
import {RC1_QA_VECTORS,RC1_RELEASE_ID,RC1_RUNTIME_SELFTEST_VERSION} from './selftest.mjs';

export const RC1_RELEASE_ATTESTATION_VERSION='HOC-RC1-RELEASE-ATTESTATION/V1';
export const RC1_PACKAGE_VERSION='1.0.0-rc.1';
export const RC1_RELEASE_FINGERPRINT='08e003a28185fcd31a806549588547994bcc3075a256bc6cbe6d79d9558f3e90';

function canonicalize(value){
  if(Array.isArray(value))return `[${value.map(canonicalize).join(',')}]`;
  if(value&&typeof value==='object'){
    return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
function sha256(value){return createHash('sha256').update(value).digest('hex');}

export function buildRc1ReleaseAttestation(){
  const core=Object.freeze({
    releaseId:RC1_RELEASE_ID,
    packageVersion:RC1_PACKAGE_VERSION,
    protocols:Object.freeze({
      raw:ORACULUM_PROTOCOL,
      legality:CUBE_LEGALITY_VERSION,
      ritual:RITUAL_INTEGRITY_VERSION,
      manifest:SESSION_MANIFEST_VERSION,
      canonicalJson:SESSION_CANONICAL_JSON_VERSION,
      runtimeSelfTest:RC1_RUNTIME_SELFTEST_VERSION,
    }),
    vectors:Object.freeze({
      stateSeed256:RC1_QA_VECTORS.stateSolved.seed256,
      ritualFinalState:RC1_QA_VECTORS.ritual32.expectedFinalState,
      manifestChecksum:RC1_QA_VECTORS.manifestSynthetic.checksum,
      manifestSessionId:RC1_QA_VECTORS.manifestSynthetic.sessionId,
      hnk40GlyphSetSha256:HNK40_GLYPH_SET_SHA256,
    }),
    hnk40Status:HNK40_STATUS,
  });
  const canonicalJson=canonicalize(core);
  const fingerprint=sha256(`${RC1_RELEASE_ATTESTATION_VERSION}|${canonicalJson}`);
  return Object.freeze({
    version:RC1_RELEASE_ATTESTATION_VERSION,
    core,
    audit:Object.freeze({
      algorithm:'SHA-256',
      fingerprint,
      expectedFingerprint:RC1_RELEASE_FINGERPRINT,
      matchesExpected:fingerprint===RC1_RELEASE_FINGERPRINT,
    }),
    authority:'RC1_RUNTIME_IDENTITY_ATTESTATION_NOT_STABLE_PROMOTION',
    governance:Object.freeze({
      promotesStable:false,
      promotesHnkCanon:false,
      replacesGitHubCI:false,
      replacesPhysicalQa:false,
    }),
  });
}
