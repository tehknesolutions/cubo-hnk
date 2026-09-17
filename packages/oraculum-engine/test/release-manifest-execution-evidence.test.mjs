import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const release=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/RELEASE_MANIFEST.json',import.meta.url),'utf8'));

const LOCK_SHA256='C84D832FE6BB264A041A93077FA0BD6402622508D1B083E695058C93300E72F3';
const LOCK_BLOB='1d5c7cdca5b22ea02ba9b3952fd9ac580fafd428';
const VALIDATED_HEAD='74997fc18b4b4054b4f9a48068547acac8c50764';

test('RC1 release manifest records reconciled frozen validation without inflating authority',()=>{
  assert.equal(release.releaseId,'HOC-V1.0-RC1');
  assert.equal(release.status,'RELEASE_CANDIDATE');
  assert.equal(release.canonPromotion,'NOT_HNK_CANON');
  assert.equal(release.operationalMetadata.entersReleaseFingerprint,false);
  assert.equal(release.operationalMetadata.independentValidationEvidence,'HOC-V1.0-RC1-FROZEN-INSTALL-RECONCILIATION-EVIDENCE/V1');
  assert.equal(release.operationalMetadata.trackedLockfileEvidence,'HOC-V1.0-RC1-TRACKED-LOCKFILE-EVIDENCE/V1');

  const evidence=release.executionEvidence.independentFrozenValidation;
  assert.equal(evidence.status,'PASS');
  assert.equal(evidence.level,'EXECUTED_RECONCILED');
  assert.equal(evidence.sourceConfigHead,VALIDATED_HEAD);
  assert.equal(evidence.executor.pnpm,'10.17.1');
  assert.equal(evidence.lockfile.sha256,LOCK_SHA256);
  assert.equal(evidence.lockfile.gitBlobSha1,LOCK_BLOB);
  assert.equal(evidence.lockfile.trackedByteIdentical,true);
  assert.equal(evidence.install.command,'pnpm install --frozen-lockfile');
  assert.equal(evidence.install.status,'PASS');
  assert.equal(evidence.tests.engine,'108/108 PASS');
  assert.equal(evidence.tests.web,'64/64 PASS');
  assert.equal(evidence.typecheck,'PASS');
  assert.deepEqual(evidence.nextProductionBuild,{version:'16.3.3',status:'PASS',staticPages:'12/12'});
  assert.equal(evidence.replacesGitHubCI,false);
  assert.equal(evidence.freshCurrentLandedHeadExecution,false);
  assert.equal(evidence.promotesStable,false);
  assert.equal(evidence.promotesHnkCanon,false);
});

test('RC1 release manifest keeps tracked-lockfile and fresh-head gates distinct',()=>{
  const lock=release.executionEvidence.trackedLockfile;
  assert.equal(lock.status,'PASS');
  assert.equal(lock.level,'TRACKED_BYTE_IDENTICAL');
  assert.equal(lock.sha256,LOCK_SHA256);
  assert.equal(lock.gitBlobSha1,LOCK_BLOB);
  assert.equal(lock.promotesStable,false);
  assert.equal(lock.promotesHnkCanon,false);

  const fresh=release.executionEvidence.freshTrackedHeadExecution;
  assert.equal(fresh.status,'PENDING');
  assert.match(fresh.reason,/executor is offline/i);
  assert.equal(fresh.promotesStable,false);
  assert.equal(fresh.promotesHnkCanon,false);
});

test('RC1 release fingerprint and frozen release identity remain unchanged',()=>{
  assert.equal(release.semver,'1.0.0-rc.1');
  assert.equal(release.frozenVectors.releaseAttestationFingerprint,'08e003a28185fcd31a806549588547994bcc3075a256bc6cbe6d79d9558f3e90');
  assert.equal(release.hnk40.status,'PREPRODUCTION_NOT_OFFICIAL');
  assert.equal(release.hnk40.candidateOracleSemanticsRemainNonCanonical,true);
});
