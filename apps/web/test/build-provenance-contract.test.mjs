import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const helper=readFileSync(new URL('../lib/release-provenance.ts',import.meta.url),'utf8');
const route=readFileSync(new URL('../app/api/oraculum/release/route.ts',import.meta.url),'utf8');
const audit=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/AUDIT_STATUS.json',import.meta.url),'utf8'));
const release=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/RELEASE_MANIFEST.json',import.meta.url),'utf8'));

function gate(id){return audit.gates.find(item=>item.id===id);}

test('Build Provenance V1 is metadata-only and never enters release fingerprint',()=>{
  assert.match(helper,/HOC-RC1-BUILD-PROVENANCE\/V1/);
  assert.match(helper,/RUNTIME_ENV_METADATA_UNHASHED/);
  assert.match(helper,/BUILD_PROVENANCE_METADATA_NOT_RELEASE_IDENTITY/);
  assert.match(helper,/entersReleaseFingerprint:false/);
  assert.match(helper,/promotesStable:false/);
  assert.match(helper,/promotesHnkCanon:false/);
  assert.match(helper,/replacesGitHubCI:false/);
});

test('Build Provenance reads Vercel Git/deployment metadata with explicit local fallbacks',()=>{
  for(const marker of ['VERCEL_GIT_COMMIT_SHA','VERCEL_GIT_COMMIT_REF','VERCEL_DEPLOYMENT_ID','VERCEL_TARGET_ENV','HOC_BUILD_GIT_SHA','HOC_BUILD_GIT_REF'])assert.match(helper,new RegExp(marker));
  assert.match(helper,/COMMIT_AND_REF/);
  assert.match(helper,/PARTIAL/);
  assert.match(helper,/NONE/);
});

test('release endpoint returns provenance beside attestation and exposes trace headers',()=>{
  for(const marker of ['buildRc1BuildProvenance','provenance','X-HOC-Build-Provenance','X-HOC-Build-Provider','X-HOC-Build-Commit','X-HOC-Build-Ref','X-HOC-Deployment-Id','X-HOC-Release-Fingerprint'])assert.match(route,new RegExp(marker));
});

test('release governance records provenance separately from frozen identity',()=>{
  assert.equal(audit.protocols.buildProvenance,'HOC-RC1-BUILD-PROVENANCE/V1');
  assert.equal(gate('buildProvenance').status,'PASS');
  assert.equal(gate('deploymentVerification').status,'PENDING');
  assert.equal(release.operationalMetadata.buildProvenance,'HOC-RC1-BUILD-PROVENANCE/V1');
  assert.equal(release.operationalMetadata.entersReleaseFingerprint,false);
  assert.equal(release.operationalMetadata.authority,'BUILD_PROVENANCE_METADATA_NOT_RELEASE_IDENTITY');
  assert.equal(release.status,'RELEASE_CANDIDATE');
  assert.equal(release.canonPromotion,'NOT_HNK_CANON');
});
