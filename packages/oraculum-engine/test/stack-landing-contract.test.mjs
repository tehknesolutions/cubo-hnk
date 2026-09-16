import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const plan=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/STACK_LANDING_PLAN.json',import.meta.url),'utf8'));

const expectedPrOrder=[1,2,3,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29];
const expectedHeadOrder=[
  'feat/bootstrap-hoc-v1','feat/v08-cube-legality','feat/v09-ritual-integrity','feat/v010-session-manifest','release/v1.0-rc1','feat/v1-rc1-runtime-selftest','feat/v1-rc1-physical-qa','feat/v1-rc1-camera-qa','feat/v1-rc1-evidence-ledger','docs/v1-rc1-manual-audit','feat/v1-rc1-production-hardening','docs/v1-rc1-visual-manual','feat/v1-rc1-independent-validation','feat/v1-rc1-independent-ledger','docs/v1-rc1-stack-landing','feat/v1-rc1-deployment-verification','feat/v1-rc1-deployment-ledger','infra/actions-runner-diagnostic','docs/v1-rc1-stack-landing-v2','infra/actions-recovery-controls','feat/v1-rc1-vercel-preview-bootstrap','feat/v1-rc1-release-attestation','feat/v1-rc1-build-provenance','feat/v1-rc1-promotion-readiness','feat/v1-rc1-human-promotion-decision','feat/v1-rc1-promotion-execution-plan','feat/v1-rc1-technical-execution-authorization','feat/v1-rc1-pre-mutation-guard',
];

test('stack landing plan keeps all promotion authorities false',()=>{
  assert.equal(plan.planVersion,'HOC-V1.0-RC1-STACK-LANDING/V11');
  assert.equal(plan.releaseId,'HOC-V1.0-RC1');
  assert.equal(plan.mergeAuthorized,false);
  assert.equal(plan.stablePromotionAuthorized,false);
  assert.equal(plan.hnkCanonPromotionAuthorized,false);
});

test('stack landing order is frozen parent-first through pre-mutation guard',()=>{
  assert.deepEqual(plan.orderedPullRequests.map(item=>item.pr),expectedPrOrder);
  assert.deepEqual(plan.orderedPullRequests.map(item=>item.head),expectedHeadOrder);
  assert.deepEqual(plan.orderedPullRequests.map(item=>item.order),expectedPrOrder.map((_,index)=>index+1));
  for(let index=1;index<plan.orderedPullRequests.length;index+=1){
    assert.equal(plan.orderedPullRequests[index].base,plan.orderedPullRequests[index-1].head,`PR #${plan.orderedPullRequests[index].pr} must be based on the previous head`);
  }
});

test('Issue #6 remains identified as blocker rather than a missing PR',()=>{
  assert.equal(plan.blockerIssue,6);
  assert.equal(plan.knownMissingPrNumber.number,6);
  assert.match(plan.knownMissingPrNumber.reason,/Issue #6/);
  assert.equal(expectedPrOrder.includes(6),false);
});

test('execution remains blocked while pre-mutation guard instrumentation is implemented',()=>{
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
  assert.match(byId.preMutationGuardInstrumentation.reason,/ALLOW\/DENY/);
  assert.match(byId.preMutationGuardInstrumentation.reason,/executes nothing/i);
  assert.equal(byId.vercelPreviewBootstrap.status,'PASS');
});

test('landing rules preserve separation between guard decision, authorization, executor, CI and HNK_CANON',()=>{
  const rules=plan.landingRules.join('\n');
  assert.match(rules,/mergeable=true.*not equivalent to merge authorization/i);
  assert.match(rules,/Independent executor or deployment evidence cannot be used to silently mark GitHub CI as PASS/i);
  assert.match(rules,/Release Attestation V1 fingerprint proves frozen RC1 runtime identity only/i);
  assert.match(rules,/Build Provenance V1 is unhashed operational metadata/i);
  assert.match(rules,/Promotion Readiness V1 may return READY_FOR_HUMAN_REVIEW only after mandatory pre-human gates PASS/i);
  assert.match(rules,/Human Promotion Decision V1 records APPROVE\/DEFER\/REJECT only/i);
  assert.match(rules,/Promotion Execution Plan V1 is DRY_RUN_ONLY/i);
  assert.match(rules,/Technical Execution Authorization V1 authorizes only listed step IDs/i);
  assert.match(rules,/Pre-Mutation Guard V1 requires completedStepIds to be an exact prefix/i);
  assert.match(rules,/Any future executor must rerun the Pre-Mutation Guard immediately before mutation/i);
  assert.match(rules,/HNK_CANON remains outside Technical Execution Authorization and Pre-Mutation Guard contracts/i);
  assert.match(rules,/Landing RC1 code does not by itself authorize V1.0 stable or HNK_CANON promotion/i);
});
