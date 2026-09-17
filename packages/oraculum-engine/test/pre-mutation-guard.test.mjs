import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildRc1PromotionExecutionPlan} from '../../../scripts/lib/rc1-promotion-execution-plan.mjs';
import {buildRc1TechnicalExecutionAuthorization} from '../../../scripts/lib/rc1-technical-execution-authorization.mjs';
import {evaluateRc1PreMutationGuard,inspectRc1PreMutationGuardDecision,computeRc1PreMutationGuardFingerprint,RC1_PRE_MUTATION_GUARD_VERSION} from '../../../scripts/lib/rc1-pre-mutation-guard.mjs';
import {buildRc1CompletedPrefixGenesis,computeRc1CompletedPrefixStateFingerprint} from '../../../scripts/lib/rc1-completed-prefix-state.mjs';

const stack=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/STACK_LANDING_PLAN.json',import.meta.url),'utf8'));
const cli=readFileSync(new URL('../../../scripts/check-rc1-pre-mutation-guard.mjs',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../../../package.json',import.meta.url),'utf8'));

function approvedDecision(){return {version:'HOC-RC1-HUMAN-PROMOTION-DECISION/V1',releaseId:'HOC-V1.0-RC1',recordId:'HOC-DECISION-TEST-APPROVED',recordedAt:'2026-09-16T14:30:00.000Z',decision:'APPROVE_V1_0',reviewerLabel:'Release Reviewer',rationale:'All mandatory readiness gates were reviewed and passed.',sourceReadiness:{evidenceKind:'HOC-RC1-PROMOTION-READINESS/V1',generatedAt:'2026-09-16T14:25:00.000Z',status:'READY_FOR_HUMAN_REVIEW',readyForHumanReview:true,required:{total:9,pass:9,pending:0,blocked:0,missing:0,invalid:0}},acknowledgement:{reviewedPromotionReadiness:true,understandsNoAutomaticMerge:true,understandsNoAutomaticDeployment:true,understandsHnkCanonRemainsSeparate:true},governance:{executesMerge:false,executesDeployment:false,changesPackageVersion:false,promotesHnkCanon:false,automaticPromotion:false,authority:'HUMAN_DECISION_RECORD_NOT_EXECUTION_AUTHORITY'}};}
function buildPlan(){return buildRc1PromotionExecutionPlan({decisionRecord:approvedDecision(),stackPlan:stack,generatedAt:'2026-09-16T15:20:00.000Z'});}
function buildAuthorization(plan,ids,overrides={}){return buildRc1TechnicalExecutionAuthorization({plan,authorizedStepIds:ids,authorizerLabel:'Technical Authorizer',rationale:'Authorize only the selected step IDs.',acknowledged:true,recordedAt:'2026-09-16T15:21:00.000Z',authorizationId:'HOC-EXEC-AUTH-GUARD-TEST',...overrides});}
function stateAfter(plan,count){
  if(count===0)return buildRc1CompletedPrefixGenesis({plan});
  const completed=plan.steps.slice(0,count).map(step=>step.id);
  const lineage=completed.map((stepId,index)=>({index,stepId,receiptId:`R${index}`,verificationId:`V${index}`,verificationFingerprint:String(index+1).padStart(64,'0'),transitionedAt:`2026-09-16T15:${String(index+1).padStart(2,'0')}:00.000Z`}));
  const draft={version:'HOC-RC1-COMPLETED-PREFIX-STATE/V1',releaseId:'HOC-V1.0-RC1',planFingerprint:plan.planFingerprint,sourceStackPlanVersion:plan.sourceStack.planVersion,completedStepIds:completed,lineage,completedCount:count,nextStepId:plan.steps[count]?.id??null,governance:{representsLogicalReleaseState:true,executesTechnicalAction:false,automaticPromotion:false,promotesHnkCanon:false,authority:'COMPLETED_PREFIX_STATE_RECORD_NOT_TECHNICAL_EXECUTOR'}};
  return {...draft,stateFingerprint:computeRc1CompletedPrefixStateFingerprint(draft)};
}

test('first runbook step ALLOW consumes fingerprint-bound genesis state',()=>{
  const plan=buildPlan(); const first=plan.steps[0].id; const authorization=buildAuthorization(plan,[first]); const state=stateAfter(plan,0);
  const result=evaluateRc1PreMutationGuard({plan,authorization,stepId:first,completedPrefixState:state});
  assert.equal(result.version,RC1_PRE_MUTATION_GUARD_VERSION);
  assert.equal(result.decision,'ALLOW');
  assert.equal(result.code,'AUTHORIZED_NEXT_STEP');
  assert.equal(result.expectedNextStepId,first);
  assert.equal(result.completedPrefixStateFingerprint,state.stateFingerprint);
  assert.equal(result.guardFingerprint,computeRc1PreMutationGuardFingerprint(result));
  assert.equal(inspectRc1PreMutationGuardDecision(result,{plan,authorization,completedPrefixState:state}).valid,true);
  assert.equal(result.governance.consumesFingerprintBoundCompletedState,true);
  assert.equal(result.governance.executesAction,false);
});

test('authorized future step is denied until fingerprint-bound state reaches exact prefix',()=>{
  const plan=buildPlan(); const target=plan.steps[2].id; const authorization=buildAuthorization(plan,[target]);
  const tooEarly=evaluateRc1PreMutationGuard({plan,authorization,stepId:target,completedPrefixState:stateAfter(plan,0)});
  assert.equal(tooEarly.code,'OUT_OF_SEQUENCE');
  const allowedState=stateAfter(plan,2);
  const allowed=evaluateRc1PreMutationGuard({plan,authorization,stepId:target,completedPrefixState:allowedState});
  assert.equal(allowed.decision,'ALLOW');
  assert.equal(allowed.completedCount,2);
  assert.equal(allowed.completedPrefixStateFingerprint,allowedState.stateFingerprint);
});

test('next step without authorization is denied even with valid state',()=>{
  const plan=buildPlan(); const first=plan.steps[0].id; const second=plan.steps[1].id; const authorization=buildAuthorization(plan,[first]);
  assert.equal(evaluateRc1PreMutationGuard({plan,authorization,stepId:second,completedPrefixState:stateAfter(plan,1)}).code,'STEP_NOT_AUTHORIZED');
});

test('tampered completed-prefix state is rejected before sequence evaluation',()=>{
  const plan=buildPlan(); const target=plan.steps[1].id; const authorization=buildAuthorization(plan,[target]);
  const tampered=structuredClone(stateAfter(plan,1)); tampered.lineage[0].receiptId='TAMPERED';
  const result=evaluateRc1PreMutationGuard({plan,authorization,stepId:target,completedPrefixState:tampered});
  assert.equal(result.decision,'DENY');
  assert.equal(result.code,'INVALID_COMPLETED_PREFIX_STATE');
});

test('tampered plan, authorization or guard fingerprint fails closed',()=>{
  const plan=buildPlan(); const first=plan.steps[0].id; const authorization=buildAuthorization(plan,[first]); const state=stateAfter(plan,0);
  const tamperedPlan=structuredClone(plan); tamperedPlan.steps[0].instruction='tampered';
  assert.equal(evaluateRc1PreMutationGuard({plan:tamperedPlan,authorization,stepId:first,completedPrefixState:state}).code,'INVALID_PLAN');
  const tamperedAuthorization=structuredClone(authorization); tamperedAuthorization.sourcePlan.planFingerprint='0'.repeat(64);
  assert.equal(evaluateRc1PreMutationGuard({plan,authorization:tamperedAuthorization,stepId:first,completedPrefixState:state}).code,'INVALID_AUTHORIZATION');
  const allow=structuredClone(evaluateRc1PreMutationGuard({plan,authorization,stepId:first,completedPrefixState:state})); allow.detail='tampered';
  assert.equal(inspectRc1PreMutationGuardDecision(allow,{plan,authorization,completedPrefixState:state}).valid,false);
});

test('guard CLI requires state artifact and has no action/network surface',()=>{
  assert.equal(pkg.scripts['guard:rc1:mutation'],'node scripts/check-rc1-pre-mutation-guard.mjs');
  assert.match(cli,/--authorization/);
  assert.match(cli,/--state/);
  assert.doesNotMatch(cli,/--completed/);
  assert.doesNotMatch(cli,/node:child_process|\bspawn\s*\(|\bexecFile\s*\(|\bfetch\s*\(|@octokit|api\.github\.com|vercel\.com\/api/i);
});
