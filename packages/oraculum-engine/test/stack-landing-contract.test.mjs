import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const plan=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/STACK_LANDING_PLAN.json',import.meta.url),'utf8'));

const expectedPrOrder=[1,2,3,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
const expectedHeadOrder=[
  'feat/bootstrap-hoc-v1',
  'feat/v08-cube-legality',
  'feat/v09-ritual-integrity',
  'feat/v010-session-manifest',
  'release/v1.0-rc1',
  'feat/v1-rc1-runtime-selftest',
  'feat/v1-rc1-physical-qa',
  'feat/v1-rc1-camera-qa',
  'feat/v1-rc1-evidence-ledger',
  'docs/v1-rc1-manual-audit',
  'feat/v1-rc1-production-hardening',
  'docs/v1-rc1-visual-manual',
  'feat/v1-rc1-independent-validation',
  'feat/v1-rc1-independent-ledger',
  'docs/v1-rc1-stack-landing',
  'feat/v1-rc1-deployment-verification',
  'feat/v1-rc1-deployment-ledger',
  'infra/actions-runner-diagnostic',
  'docs/v1-rc1-stack-landing-v2',
  'infra/actions-recovery-controls',
  'feat/v1-rc1-vercel-preview-bootstrap',
  'feat/v1-rc1-release-attestation',
];

test('stack landing plan keeps all promotion authorities false',()=>{
  assert.equal(plan.planVersion,'HOC-V1.0-RC1-STACK-LANDING/V5');
  assert.equal(plan.releaseId,'HOC-V1.0-RC1');
  assert.equal(plan.mergeAuthorized,false);
  assert.equal(plan.stablePromotionAuthorized,false);
  assert.equal(plan.hnkCanonPromotionAuthorized,false);
});

test('stack landing order is frozen parent-first through RC1 release attestation',()=>{
  assert.deepEqual(plan.orderedPullRequests.map(item=>item.pr),expectedPrOrder);
  assert.deepEqual(plan.orderedPullRequests.map(item=>item.head),expectedHeadOrder);
  assert.deepEqual(plan.orderedPullRequests.map(item=>item.order),expectedPrOrder.map((_,index)=>index+1));

  for(let index=1;index<plan.orderedPullRequests.length;index+=1){
    assert.equal(
      plan.orderedPullRequests[index].base,
      plan.orderedPullRequests[index-1].head,
      `PR #${plan.orderedPullRequests[index].pr} must be based on the previous head`,
    );
  }
});

test('Issue #6 remains identified as blocker rather than a missing PR',()=>{
  assert.equal(plan.blockerIssue,6);
  assert.equal(plan.knownMissingPrNumber.number,6);
  assert.match(plan.knownMissingPrNumber.reason,/Issue #6/);
  assert.equal(expectedPrOrder.includes(6),false);
});

test('execution remains blocked while release identity and recovery controls are implemented',()=>{
  const byId=Object.fromEntries(plan.preLandingGates.map(item=>[item.id,item]));
  assert.equal(byId.humanMergeAuthorization.required,true);
  assert.equal(byId.humanMergeAuthorization.status,'PENDING');
  assert.equal(byId.realAutomatedExecution.required,true);
  assert.equal(byId.realAutomatedExecution.status,'BLOCKED');
  assert.equal(byId.independentExecutorEvidence.status,'PENDING');
  assert.equal(byId.deploymentVerificationEvidence.status,'PENDING');
  assert.equal(byId.protocolFreezeIntegrity.status,'PASS');
  assert.equal(byId.releaseAttestationIdentity.status,'PASS');
  assert.match(byId.releaseAttestationIdentity.reason,/08e003a28185fcd31a806549588547994bcc3075a256bc6cbe6d79d9558f3e90/);
  assert.equal(byId.visualManualArtifacts.status,'PASS');
  assert.equal(byId.actionsRootCauseLocatedToPreStepLayer.status,'PASS');
  assert.equal(byId.actionsRecoveryControls.status,'PASS');
  assert.equal(byId.vercelPreviewBootstrap.status,'PASS');
});

test('landing rules preserve separation between attestation, preview, recovery, CI and promotion',()=>{
  const rules=plan.landingRules.join('\n');
  assert.match(rules,/mergeable=true.*not equivalent to merge authorization/i);
  assert.match(rules,/Independent executor or deployment evidence cannot be used to silently mark GitHub CI as PASS/i);
  assert.match(rules,/diagnostic localizes the current blocker but does not itself satisfy the CI gate/i);
  assert.match(rules,/diagnostic workflow remains manual-only/i);
  assert.match(rules,/Vercel bootstrap is preview-only/i);
  assert.match(rules,/Release Attestation V1 fingerprint proves frozen RC1 runtime identity only/i);
  assert.match(rules,/does not by itself authorize V1.0 stable or HNK_CANON promotion/i);
});
