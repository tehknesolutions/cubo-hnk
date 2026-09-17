import test from 'node:test';
import assert from 'node:assert/strict';
import { RC1_RELEASE_ID, RC1_RUNTIME_SELFTEST_VERSION, runRc1RuntimeSelfTest } from '../src/selftest.mjs';

test('RC1 runtime self-test passes all frozen invariants',()=>{
  const report=runRc1RuntimeSelfTest();
  assert.equal(report.version,RC1_RUNTIME_SELFTEST_VERSION);
  assert.equal(report.releaseId,RC1_RELEASE_ID);
  assert.equal(report.passed,true);
  assert.equal(report.failedChecks,0);
  assert.equal(report.passedChecks,report.totalChecks);
  assert.ok(report.totalChecks>=30);
});

test('RC1 runtime self-test includes critical release identities',()=>{
  const report=runRc1RuntimeSelfTest();
  const byId=new Map(report.checks.map(check=>[check.id,check]));
  for(const id of [
    'protocol.raw',
    'protocol.legality',
    'protocol.ritual',
    'protocol.manifest',
    'state.seed256',
    'state.hnkGlyphId',
    'interpretation.dominantConvergence',
    'legality.solvedValid',
    'ritual.expectedFinalState',
    'ritual.integrityConfirmed',
    'manifest.syntheticChecksum',
    'manifest.tamperRejected',
    'hnk40.hash',
    'hnk40.status',
  ]){
    assert.ok(byId.has(id),`missing self-test check ${id}`);
    assert.equal(byId.get(id).passed,true,`${id} must PASS`);
  }
});
