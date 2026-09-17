import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const route=readFileSync(new URL('../app/api/oraculum/release/route.ts',import.meta.url),'utf8');
const moduleSource=readFileSync(new URL('../../../packages/oraculum-engine/src/release-attestation.mjs',import.meta.url),'utf8');

test('release endpoint uses official attestation module and fails closed on drift',()=>{
  assert.match(route,/@hnk\/oraculum-engine\/release-attestation/);
  assert.match(route,/buildRc1ReleaseAttestation/);
  assert.match(route,/matchesExpected/);
  assert.match(route,/status:503/);
});

test('release endpoint exposes identity headers through no-store HOC response helper',()=>{
  assert.match(route,/hocJson/);
  assert.match(route,/X-HOC-Release-Id/);
  assert.match(route,/X-HOC-Release-Fingerprint/);
});

test('release attestation freezes governance and fingerprint',()=>{
  assert.match(moduleSource,/HOC-RC1-RELEASE-ATTESTATION\/V1/);
  assert.match(moduleSource,/08e003a28185fcd31a806549588547994bcc3075a256bc6cbe6d79d9558f3e90/);
  assert.match(moduleSource,/promotesStable:false/);
  assert.match(moduleSource,/promotesHnkCanon:false/);
  assert.match(moduleSource,/replacesGitHubCI:false/);
  assert.match(moduleSource,/replacesPhysicalQa:false/);
});
