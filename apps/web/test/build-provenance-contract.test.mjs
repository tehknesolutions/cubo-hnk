import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const helper=readFileSync(new URL('../lib/release-provenance.ts',import.meta.url),'utf8');
const route=readFileSync(new URL('../app/api/oraculum/release/route.ts',import.meta.url),'utf8');

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
  for(const marker of [
    'VERCEL_GIT_COMMIT_SHA',
    'VERCEL_GIT_COMMIT_REF',
    'VERCEL_DEPLOYMENT_ID',
    'VERCEL_TARGET_ENV',
    'HOC_BUILD_GIT_SHA',
    'HOC_BUILD_GIT_REF',
  ])assert.match(helper,new RegExp(marker));
  assert.match(helper,/COMMIT_AND_REF/);
  assert.match(helper,/PARTIAL/);
  assert.match(helper,/NONE/);
});

test('release endpoint returns provenance beside attestation and exposes trace headers',()=>{
  assert.match(route,/buildRc1BuildProvenance/);
  assert.match(route,/provenance/);
  assert.match(route,/X-HOC-Build-Provenance/);
  assert.match(route,/X-HOC-Build-Provider/);
  assert.match(route,/X-HOC-Build-Commit/);
  assert.match(route,/X-HOC-Build-Ref/);
  assert.match(route,/X-HOC-Deployment-Id/);
  assert.match(route,/X-HOC-Release-Fingerprint/);
});
