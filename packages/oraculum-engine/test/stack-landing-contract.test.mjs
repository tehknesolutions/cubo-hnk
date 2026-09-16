import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const plan=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/STACK_LANDING_PLAN.json',import.meta.url),'utf8'));
const expectedPrOrder=[1,2,3,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30];
const expectedHeadOrder=[
  'feat/bootstrap-hoc-v1','feat/v08-cube-legality','feat/v09-ritual-integrity','feat/v010-session-manifest','release/v1.0-rc1','feat/v1-rc1-runtime-selftest','feat/v1-rc1-physical-qa','feat/v1-rc1-camera-qa','feat/v1-rc1-evidence-ledger','docs/v1-rc1-manual-audit','feat/v1-rc1-production-hardening','docs/v1-rc1-visual-manual','feat/v1-rc1-independent-validation','feat/v1-rc1-independent-ledger','docs/v1-rc1-stack-landing','feat/v1-rc1-deployment-verification','feat/v1-rc1-deployment-ledger','infra/actions-runner-diagnostic','docs/v1-rc1-stack-landing-v2','infra/actions-recovery-controls','feat/v1-rc1-vercel-preview-bootstrap','feat/v1-rc1-release-attestation','feat/v1-rc1-build-provenance','feat/v1-rc1-promotion-readiness','feat/v1-rc1-human-promotion-decision','feat/v1-rc1-promotion-execution-plan','feat/v1-rc1-technical-execution-authorization','feat/v1-rc1-pre-mutation-guard','feat/v1-rc1-mutation-receipt',
];

test('stack landing plan keeps all promotion authorities false',()=>{
  assert.equal(plan.planVersion,'HOC-V1.0-RC1-STACK-LANDING/V12');
  assert.equal(plan.releaseId,'HOC-V1.0-RC1');
  assert.equal(plan.mergeAuthorized,false);
  assert.equal(plan.stablePromotionAuthorized,false);
  assert.equal(plan.hnkCanonPromotionAuthorized,false);
});

test('stack landing order is frozen parent-first through mutation receipt',()=>{
  assert.deepEqual(plan.orderedPullRequests.map(item=>item.pr),expectedPrOrder);
  assert.deepEqual(plan.orderedPullRequests.map(item=>item.head),expectedHeadOrder);
  assert.deepEqual(plan.orderedPullRequests.map(item=>item.order),expectedPrOrder.map((_,index)=>index+1));
  for(let index=1;index<plan.orderedPullRequests.length;index+=1){
    assert.equal(plan.orderedPullRequests[index].base,plan.orderedPullRequests[index-1].head,`PR #${plan.orderedPullRequests[index].pr} must be based on the previous head`);
  }
});

test('Issue #6 remains a blocker rather than a missing PR',()=>{
  assert.equal(plan.blockerIssue,6);
  assert.equal(plan.knownMissingPrNumber.number,6);
  assert.match(plan.knownMissingPrNumber.reason,/Issue #6/);
  assert.equal(expectedPrOrder.includes(6),false);
});

test('execution stays blocked while mutation receipt instrumentation is implemented',()=>{
  const byId=Object.fromEntries(plan.preLandingGates.map(item=>[item.id,item]));
  assert.equal(byId.humanMergeAuthorization.status,'PENDING');
  assert.equal(byId.realAutomatedExecution.status,'BLOCKED');
  assert.equal(byId.deploymentVerificationEvidence.status,'PENDING');
  assert.equal(byId.protocolFreezeIntegrity.status,'PASS');
  assert.equal(byId.releaseAttestationIdentity.status,'PASS');
  assert.equal(byId.buildProvenanceInstrumentation.status,'PASS');
  assert.equal(byId.promotionReadinessInstrumentation.status,'PASS');
  assert.equal(byId.humanDecisionRecorderInstrumentation.status,'PASS');
  assert.equal(byId.promotionExecutionPlanInstrumentation.status,'PASS');
  assert.equal(byId.technicalExecutionAuthorizationInstrumentation.status,'PASS');
  assert.equal(byId.preMutationGuardInstrumentation.status,'PASS');
  assert.equal(byId.mutationReceiptInstrumentation.status,'PASS');
  assert.match(byId.mutationReceiptInstrumentation.reason,/UNVERIFIED_EXTERNAL_RESULT/);
  assert.match(byId.mutationReceiptInstrumentation.reason,/never advances completed-prefix/i);
  assert.equal(byId.vercelPreviewBootstrap.status,'PASS');
});

test('landing rules preserve separation between reported result, verified completion, executor, CI and HNK_CANON',()=>{
  const rules=plan.landingRules.join('\n');
  assert.match(rules,/mergeable=true.*not equivalent to merge authorization/i);
  assert.match(rules,/Independent executor or deployment evidence cannot be used to silently mark GitHub CI as PASS/i);
  assert.match(rules,/Promotion Execution Plan V1 is DRY_RUN_ONLY/i);
  assert.match(rules,/Technical Execution Authorization V1 authorizes only listed step IDs/i);
  assert.match(rules,/Pre-Mutation Guard V1 only ALLOWs the exact next authorized step/i);
  assert.match(rules,/Technical Mutation Receipt V1 records only an externally\/manual reported outcome/i);
  assert.match(rules,/advancesCompletedPrefix=false/i);
  assert.match(rules,/HNK_CANON remains outside this release-operation pipeline/i);
});
