import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const plan=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/STACK_LANDING_PLAN.json',import.meta.url),'utf8'));
const expectedPrOrder=[1,2,3,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33];
const expectedHeadOrder=['feat/bootstrap-hoc-v1','feat/v08-cube-legality','feat/v09-ritual-integrity','feat/v010-session-manifest','release/v1.0-rc1','feat/v1-rc1-runtime-selftest','feat/v1-rc1-physical-qa','feat/v1-rc1-camera-qa','feat/v1-rc1-evidence-ledger','docs/v1-rc1-manual-audit','feat/v1-rc1-production-hardening','docs/v1-rc1-visual-manual','feat/v1-rc1-independent-validation','feat/v1-rc1-independent-ledger','docs/v1-rc1-stack-landing','feat/v1-rc1-deployment-verification','feat/v1-rc1-deployment-ledger','infra/actions-runner-diagnostic','docs/v1-rc1-stack-landing-v2','infra/actions-recovery-controls','feat/v1-rc1-vercel-preview-bootstrap','feat/v1-rc1-release-attestation','feat/v1-rc1-build-provenance','feat/v1-rc1-promotion-readiness','feat/v1-rc1-human-promotion-decision','feat/v1-rc1-promotion-execution-plan','feat/v1-rc1-technical-execution-authorization','feat/v1-rc1-pre-mutation-guard','feat/v1-rc1-mutation-receipt','feat/v1-rc1-mutation-evidence-verification','feat/v1-rc1-completed-prefix-transition','feat/v1-rc1-pre-mutation-guard-v2'];

test('stack landing plan keeps all promotion authorities false',()=>{
  assert.equal(plan.planVersion,'HOC-V1.0-RC1-STACK-LANDING/V15');
  assert.equal(plan.releaseId,'HOC-V1.0-RC1');
  assert.equal(plan.mergeAuthorized,false);
  assert.equal(plan.stablePromotionAuthorized,false);
  assert.equal(plan.hnkCanonPromotionAuthorized,false);
});

test('stack landing order is frozen parent-first through guard v2',()=>{
  assert.deepEqual(plan.orderedPullRequests.map(item=>item.pr),expectedPrOrder);
  assert.deepEqual(plan.orderedPullRequests.map(item=>item.head),expectedHeadOrder);
  assert.deepEqual(plan.orderedPullRequests.map(item=>item.order),expectedPrOrder.map((_,index)=>index+1));
  for(let index=1;index<plan.orderedPullRequests.length;index+=1){assert.equal(plan.orderedPullRequests[index].base,plan.orderedPullRequests[index-1].head);}
});

test('Issue #6 remains a blocker rather than a missing PR',()=>{
  assert.equal(plan.blockerIssue,6);
  assert.equal(plan.knownMissingPrNumber.number,6);
  assert.equal(expectedPrOrder.includes(6),false);
});

test('guard v2 instrumentation passes without authorizing technical mutation',()=>{
  const byId=Object.fromEntries(plan.preLandingGates.map(item=>[item.id,item]));
  assert.equal(byId.humanMergeAuthorization.status,'PENDING');
  assert.equal(byId.realAutomatedExecution.status,'BLOCKED');
  assert.equal(byId.completedPrefixTransitionInstrumentation.status,'PASS');
  assert.equal(byId.preMutationGuardInstrumentation.status,'PASS');
  assert.match(byId.preMutationGuardInstrumentation.reason,/Completed Prefix State/);
  assert.match(byId.preMutationGuardInstrumentation.reason,/free-form completedStepIds/i);
  assert.match(byId.preMutationGuardInstrumentation.reason,/state fingerprint/i);
});

test('landing rules separate fingerprint-bound policy from technical execution and HNK_CANON',()=>{
  const rules=plan.landingRules.join('\n');
  assert.match(rules,/mergeable=true is not merge authorization/i);
  assert.match(rules,/Guard V2.*fingerprint-valid Completed Prefix State/i);
  assert.match(rules,/caller-supplied completedStepIds are not accepted/i);
  assert.match(rules,/Guard V2 ALLOW\/DENY decisions are fingerprinted policy records, not actions/i);
  assert.match(rules,/Technical Mutation Receipt SUCCESS.*preserves Guard V2 state\/decision fingerprints/i);
  assert.match(rules,/HNK_CANON remains outside this release-operation pipeline/i);
});
