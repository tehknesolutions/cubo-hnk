import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildRc1PromotionExecutionPlan} from '../../../scripts/lib/rc1-promotion-execution-plan.mjs';
import {buildRc1TechnicalExecutionAuthorization} from '../../../scripts/lib/rc1-technical-execution-authorization.mjs';
import {evaluateRc1PreMutationGuard,computeRc1PreMutationGuardFingerprint} from '../../../scripts/lib/rc1-pre-mutation-guard.mjs';
import {buildRc1TechnicalMutationReceipt} from '../../../scripts/lib/rc1-technical-mutation-receipt.mjs';
import {buildRc1MutationEvidenceVerification} from '../../../scripts/lib/rc1-mutation-evidence-verification.mjs';
import {buildRc1CompletedPrefixGenesis,buildRc1CompletedPrefixTransition,inspectRc1CompletedPrefixState,inspectRc1CompletedPrefixTransition,computeRc1CompletedPrefixStateFingerprint,computeRc1CompletedPrefixTransitionFingerprint,RC1_COMPLETED_PREFIX_STATE_VERSION,RC1_COMPLETED_PREFIX_TRANSITION_VERSION,RC1_COMPLETED_PREFIX_TRANSITION_FINGERPRINT_VERSION} from '../../../scripts/lib/rc1-completed-prefix-transition.mjs';

const pkg=JSON.parse(readFileSync(new URL('../../../package.json',import.meta.url),'utf8'));
const cli=readFileSync(new URL('../../../scripts/build-rc1-completed-prefix-transition.mjs',import.meta.url),'utf8');

function approvedDecision(){return {version:'HOC-RC1-HUMAN-PROMOTION-DECISION/V1',releaseId:'HOC-V1.0-RC1',recordId:'TEST-DECISION',recordedAt:'2026-09-16T15:00:00.000Z',decision:'APPROVE_V1_0',reviewerLabel:'Reviewer',rationale:'All mandatory gates passed for test.',sourceReadiness:{evidenceKind:'HOC-RC1-PROMOTION-READINESS/V1',generatedAt:'2026-09-16T14:59:00.000Z',status:'READY_FOR_HUMAN_REVIEW',readyForHumanReview:true,required:{total:9,pass:9,pending:0,blocked:0,missing:0,invalid:0}},acknowledgement:{reviewedPromotionReadiness:true,understandsNoAutomaticMerge:true,understandsNoAutomaticDeployment:true,understandsHnkCanonRemainsSeparate:true},governance:{executesMerge:false,executesDeployment:false,changesPackageVersion:false,promotesHnkCanon:false,automaticPromotion:false,authority:'HUMAN_DECISION_RECORD_NOT_EXECUTION_AUTHORITY'}};}
function stack(){return {planVersion:'HOC-V1.0-RC1-STACK-LANDING/VTEST',releaseId:'HOC-V1.0-RC1',mergeAuthorized:false,stablePromotionAuthorized:false,hnkCanonPromotionAuthorized:false,orderedPullRequests:[{order:1,pr:999,base:'main',head:'test-head',role:'test'}]};}
function fixture(){
  const plan=buildRc1PromotionExecutionPlan({decisionRecord:approvedDecision(),stackPlan:stack(),generatedAt:'2026-09-16T15:01:00.000Z'});
  const stepId=plan.steps[0].id;
  const authorization=buildRc1TechnicalExecutionAuthorization({plan,authorizedStepIds:[stepId],authorizerLabel:'Operator',rationale:'Authorize first synthetic step only.',acknowledged:true,recordedAt:'2026-09-16T15:02:00.000Z',authorizationId:'TEST-AUTH'});
  const currentState=buildRc1CompletedPrefixGenesis({plan});
  const guard=evaluateRc1PreMutationGuard({plan,authorization,stepId,completedPrefixState:currentState});
  const receipt=buildRc1TechnicalMutationReceipt({plan,authorization,guardDecision:guard,result:'SUCCESS',executorLabel:'External Operator',summary:'Synthetic SUCCESS result.',evidenceRefs:[{kind:'execution-log',value:'artifact://synthetic-step-log',sha256:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}],startedAt:'2026-09-16T15:03:00.000Z',completedAt:'2026-09-16T15:04:00.000Z',receiptId:'TEST-RECEIPT'});
  const verification=buildRc1MutationEvidenceVerification({plan,authorization,receipt,observations:[{evidenceIndex:0,kind:'execution-log',value:'artifact://synthetic-step-log',observedSha256:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',observedAt:'2026-09-16T15:05:00.000Z',verified:true}],verifierLabel:'Independent Reviewer',method:'artifact hash and content review',acknowledged:true,verifiedAt:'2026-09-16T15:06:00.000Z',verificationId:'TEST-VERIFY'});
  return {plan,authorization,currentState,receipt,verification,stepId};
}

test('genesis state remains V1, fingerprinted and points to exact first step',()=>{
  const {plan,currentState}=fixture();
  assert.equal(currentState.version,RC1_COMPLETED_PREFIX_STATE_VERSION);
  assert.deepEqual(currentState.completedStepIds,[]);
  assert.equal(currentState.nextStepId,plan.steps[0].id);
  assert.equal(currentState.stateFingerprint,computeRc1CompletedPrefixStateFingerprint(currentState));
  assert.equal(inspectRc1CompletedPrefixState(currentState,plan).valid,true);
});

test('Transition V2 binds current state, Guard V2 and verified evidence into one fingerprinted record',()=>{
  const {plan,authorization,currentState,receipt,verification,stepId}=fixture();
  const transition=buildRc1CompletedPrefixTransition({plan,authorization,receipt,verification,currentState,transitionedAt:'2026-09-16T15:07:00.000Z',transitionId:'TEST-TRANSITION'});
  assert.equal(RC1_COMPLETED_PREFIX_TRANSITION_VERSION,'HOC-RC1-COMPLETED-PREFIX-TRANSITION/V2');
  assert.equal(RC1_COMPLETED_PREFIX_TRANSITION_FINGERPRINT_VERSION,'HOC-RC1-COMPLETED-PREFIX-TRANSITION-FINGERPRINT/V2');
  assert.equal(transition.version,RC1_COMPLETED_PREFIX_TRANSITION_VERSION);
  assert.equal(transition.sourceState.stateFingerprint,currentState.stateFingerprint);
  assert.equal(transition.sourceGuard.completedPrefixStateFingerprint,currentState.stateFingerprint);
  assert.equal(transition.sourceGuard.guardFingerprint,receipt.preMutationGuard.guardFingerprint);
  assert.equal(transition.sourceVerification.verificationFingerprint,verification.verificationFingerprint);
  assert.equal(transition.result.status,'COMPLETED_PREFIX_ADVANCED');
  assert.equal(transition.result.fromCount,0);
  assert.equal(transition.result.toCount,1);
  assert.equal(transition.result.appendedStepId,stepId);
  assert.deepEqual(transition.nextState.completedStepIds,[stepId]);
  assert.equal(transition.nextState.stateFingerprint,computeRc1CompletedPrefixStateFingerprint(transition.nextState));
  assert.equal(transition.transitionFingerprint,computeRc1CompletedPrefixTransitionFingerprint(transition));
  const inspection=inspectRc1CompletedPrefixTransition(transition,{plan,authorization,receipt,verification,currentState});
  assert.equal(inspection.valid,true);
  assert.equal(inspection.guardStateBindingValid,true);
});

test('state swap between Guard V2 ALLOW and Transition V2 is rejected',()=>{
  const {plan,authorization,currentState,receipt,verification}=fixture();
  const forgedReceipt=structuredClone(receipt);
  forgedReceipt.preMutationGuard.completedPrefixStateFingerprint='b'.repeat(64);
  forgedReceipt.preMutationGuard.guardFingerprint=computeRc1PreMutationGuardFingerprint(forgedReceipt.preMutationGuard);
  assert.throws(()=>buildRc1CompletedPrefixTransition({plan,authorization,receipt:forgedReceipt,verification,currentState,transitionedAt:'2026-09-16T15:07:00.000Z'}),/not authorized against this exact Completed Prefix State fingerprint/);
});

test('sourceGuard or transition tampering invalidates Transition V2 fingerprint',()=>{
  const {plan,authorization,currentState,receipt,verification}=fixture();
  const transition=buildRc1CompletedPrefixTransition({plan,authorization,receipt,verification,currentState,transitionedAt:'2026-09-16T15:07:00.000Z'});
  const forgedGuard={...transition,sourceGuard:{...transition.sourceGuard,guardFingerprint:'0'.repeat(64)}};
  assert.equal(inspectRc1CompletedPrefixTransition(forgedGuard,{plan,authorization,receipt,verification,currentState}).valid,false);
  const forgedResult={...transition,result:{...transition.result,toCount:99}};
  assert.equal(inspectRc1CompletedPrefixTransition(forgedResult,{plan,authorization,receipt,verification,currentState}).valid,false);
});

test('state tampering, replay and chronology fail closed',()=>{
  const {plan,authorization,currentState,receipt,verification}=fixture();
  const transition=buildRc1CompletedPrefixTransition({plan,authorization,receipt,verification,currentState,transitionedAt:'2026-09-16T15:07:00.000Z'});
  const forgedState={...transition.nextState,completedCount:99};
  assert.equal(inspectRc1CompletedPrefixState(forgedState,plan).valid,false);
  assert.throws(()=>buildRc1CompletedPrefixTransition({plan,authorization,receipt,verification,currentState:transition.nextState,transitionedAt:'2026-09-16T15:08:00.000Z'}),/exact Completed Prefix State fingerprint|exact next runbook step/);
  assert.throws(()=>buildRc1CompletedPrefixTransition({plan,authorization,receipt,verification,currentState,transitionedAt:'2026-09-16T15:05:30.000Z'}),/cannot predate evidence verification/);
});

test('CLI only writes logical state artifacts and exposes no technical executor or network surface',()=>{
  assert.equal(pkg.scripts['advance:rc1:completed-prefix'],'node scripts/build-rc1-completed-prefix-transition.mjs');
  assert.match(cli,/--verification/);
  assert.match(cli,/--state-out/);
  assert.match(cli,/No technical mutation/);
  assert.doesNotMatch(cli,/node:child_process|\bspawn\s*\(|\bexecFile\s*\(|\bfetch\s*\(|@octokit|api\.github\.com|vercel\.com\/api/i);
});
