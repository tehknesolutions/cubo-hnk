import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const runner=readFileSync(new URL('../../../scripts/verify-rc1-deployment.mjs',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../../../package.json',import.meta.url),'utf8'));
const audit=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/AUDIT_STATUS.json',import.meta.url),'utf8'));

function gate(id){
  const found=audit.gates.find(item=>item.id===id);
  assert.ok(found,`missing gate ${id}`);
  return found;
}

test('root package exposes deployment verification runner',()=>{
  assert.equal(pkg.scripts['verify:rc1:deployment'],'node scripts/verify-rc1-deployment.mjs');
});

test('deployment verifier freezes evidence, release fingerprint, build provenance and golden seed identity',()=>{
  assert.match(runner,/HOC-RC1-DEPLOYMENT-VERIFY-EVIDENCE\/V1/);
  assert.match(runner,/HOC-RC1-RELEASE-ATTESTATION\/V1/);
  assert.match(runner,/HOC-RC1-BUILD-PROVENANCE\/V1/);
  assert.match(runner,/08e003a28185fcd31a806549588547994bcc3075a256bc6cbe6d79d9558f3e90/);
  assert.match(runner,/df6bcd1bfd58288fb8f7d7e0f22b69d7e305a24429ba4445c242efc000e3b6fc/);
});

test('deployment verifier supports optional explicit commit pinning',()=>{
  assert.match(runner,/--commit/);
  assert.match(runner,/HOC_EXPECTED_COMMIT/);
  assert.match(runner,/Expected commit must be a 7-64 character hexadecimal Git SHA prefix/);
  assert.match(runner,/build\.expectedCommit/);
  assert.match(runner,/commitMatch/);
});

test('deployment verifier checks release identity and provenance before runtime/oracle checks',()=>{
  const releaseIndex=runner.indexOf("'/api/oraculum/release'");
  const selftestIndex=runner.indexOf("'/api/oraculum/rc1-selftest'");
  assert.ok(releaseIndex>=0);
  assert.ok(selftestIndex>releaseIndex);
  for(const marker of ['x-hoc-release-id','x-hoc-release-fingerprint','x-hoc-build-provenance','x-hoc-build-provider','releaseAttestation','buildProvenance'])assert.match(runner,new RegExp(marker));
});

test('deployment verifier checks actual host headers and runtime APIs',()=>{
  for(const marker of ['/api/oraculum/release','/api/oraculum/rc1-selftest','/oraculum','x-content-type-options','x-frame-options','referrer-policy','cross-origin-opener-policy','permissions-policy','/api/oraculum/manifest/verify','cache-control'])assert.match(runner,new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('deployment verifier never grants promotion or replacement authority',()=>{
  assert.match(runner,/DEPLOYMENT_RUNTIME_EVIDENCE_NOT_PRODUCTION_PROMOTION/);
  assert.match(runner,/promotesStable:false/);
  assert.match(runner,/promotesHnkCanon:false/);
  assert.match(runner,/replacesGitHubCI:false/);
  assert.match(runner,/replacesPhysicalQa:false/);
});

test('deployment verification gate remains pending until executed',()=>{
  assert.equal(gate('deploymentVerification').status,'PENDING');
  assert.equal(gate('productionHardeningRuntime').status,'PENDING');
  assert.equal(gate('ciTypecheckBuild').status,'BLOCKED');
});
