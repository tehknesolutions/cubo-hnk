import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRc1ReleaseAttestation,RC1_RELEASE_ATTESTATION_VERSION,RC1_RELEASE_FINGERPRINT} from '../src/release-attestation.mjs';

test('RC1 release attestation reproduces frozen identity',()=>{
  const attestation=buildRc1ReleaseAttestation();
  assert.equal(attestation.version,RC1_RELEASE_ATTESTATION_VERSION);
  assert.equal(attestation.core.releaseId,'HOC-V1.0-RC1');
  assert.equal(attestation.core.packageVersion,'1.0.0-rc.1');
  assert.equal(attestation.audit.fingerprint,RC1_RELEASE_FINGERPRINT);
  assert.equal(attestation.audit.matchesExpected,true);
});

test('attestation freezes protocol and vector identities',()=>{
  const {core}=buildRc1ReleaseAttestation();
  assert.equal(core.protocols.raw,'HNK-ORACULUM-CUBE/V0.4');
  assert.equal(core.protocols.legality,'HOC-CUBE-LEGALITY/V0.8');
  assert.equal(core.protocols.ritual,'HOC-RITUAL-INTEGRITY/V0.9');
  assert.equal(core.protocols.manifest,'HOC-SESSION-MANIFEST/V0.10');
  assert.equal(core.protocols.canonicalJson,'HOC-CANONICAL-JSON/V1');
  assert.equal(core.vectors.stateSeed256,'df6bcd1bfd58288fb8f7d7e0f22b69d7e305a24429ba4445c242efc000e3b6fc');
  assert.equal(core.vectors.ritualFinalState,'513004512451013254000425014533433235324540121221251340');
  assert.equal(core.vectors.manifestChecksum,'e8510e6f8eb299ef57ecc2481d7ac5e3e4b0dd754284c2c5728d48febbb60041');
  assert.equal(core.vectors.hnk40GlyphSetSha256,'78668df0f707952b7c280de52526abaa2b7900597fb8ff362a3a08641fd1bce5');
});

test('attestation cannot promote governance gates',()=>{
  const attestation=buildRc1ReleaseAttestation();
  assert.equal(attestation.authority,'RC1_RUNTIME_IDENTITY_ATTESTATION_NOT_STABLE_PROMOTION');
  assert.deepEqual(attestation.governance,{promotesStable:false,promotesHnkCanon:false,replacesGitHubCI:false,replacesPhysicalQa:false});
});
