import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildRc1PromotionExecutionPlan} from '../../../scripts/lib/rc1-promotion-execution-plan.mjs';
import {buildRc1TechnicalExecutionAuthorization} from '../../../scripts/lib/rc1-technical-execution-authorization.mjs';
import {evaluateRc1PreMutationGuard,RC1_PRE_MUTATION_GUARD_VERSION} from '../../../scripts/lib/rc1-pre-mutation-guard.mjs';

const stack=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/STACK_LANDING_PLAN.json',import.meta.url),'utf8'));
const cli=readFileSync(new URL('../../../scripts/check-rc1-pre-mutation-guard.mjs',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../../../package.json',import.meta.url),'utf8'));

function approvedDecision(){
  return {
    version:'HOC-RC1-HUMAN-PROMOTION-DECISION/V1',releaseId:'HOC-V1.0-RC1',recordId:'HOC-DECISION-TEST-APPROVED',recordedAt:'2026-09-16T14:30:00.000Z',decision:'APPROVE_V1_0',reviewerLabel:'Release Reviewer',rationale:'All mandatory readiness gates were reviewed and passed.',
    sourceReadiness:{evidenceKind:'HOC-RC1-PROMOTION-READINESS/V1',generatedAt:'2026-09-16T14:25:00.000Z',status:'READY_FOR_HUMAN_REVIEW',readyForHumanReview:true,required:{total:9,pass:9,pending:0,blocked:0,missing:0,invalid:0}},
    acknowledgement:{reviewedPromotionReadiness:true,understandsNoAutomaticMerge:true,understandsNoAutomaticDeployment:true,understandsHnkCanonRemainsSeparate:true},
    governance:{executesMerge:false,executesDeployment:false,changesPackageVersion:false,promotesHnkCanon:false,automaticPromotion:false,authority:'HUMAN_DECISION_RECORD_NOT_EXECUTION_AUTHORITY'},
  };
}

function buildPlan(){return buildRc1PromotionExecutionPlan({decisionRecord:approvedDecision(),stackPlan:stack,generatedAt:'2026-09-16T15:20:00.000Z'});}
function buildAuthorization(plan,ids,overrides={}){
  return buildRc1TechnicalExecutionAuthorization({plan,authorizedStepIds:ids,authorizerLabel:'Technical Authorizer',rationale:'Authorize only the selected step IDs.',acknowledged:true,recordedAt:'2026-09-16T15:21:00.000Z',authorizationId:'HOC-EXEC-AUTH-GUARD-TEST',...overrides});
}

test('first runbook step can ALLOW only when explicitly authorized',()=>{
  const plan=buildPlan();
  const first=plan.steps[0].id;
  const authorization=buildAuthorization(plan,[first]);
  const result=evaluateRc1PreMutationGuard({plan,authorization,stepId:first,completedStepIds:[]});
  assert.equal(result.version,RC1_PRE_MUTATION_GUARD_VERSION);
  assert.equal(result.decision,'ALLOW');
  assert.equal(result.code,'AUTHORIZED_NEXT_STEP');
  assert.equal(result.expectedNextStepId,first);
  assert.equal(result.governance.executesAction,false);
  assert.equal(result.governance.automaticExecution,false);
  assert.equal(result.governance.requiresExecutorRevalidation,true);
  assert.equal(result.governance.promotesHnkCanon,false);
});

test('authorized future step is denied until every prior step is a valid completed prefix',()=>{
  const plan=buildPlan();
  const land1=plan.steps.find(step=>step.id==='LAND_PR_1').id;
  const authorization=buildAuthorization(plan,[land1]);
  const tooEarly=evaluateRc1PreMutationGuard({plan,authorization,stepId:land1,completedStepIds:[]});
  assert.equal(tooEarly.decision,'DENY');
  assert.equal(tooEarly.code,'OUT_OF_SEQUENCE');
  assert.equal(tooEarly.expectedNextStepId,'FREEZE_APPROVED_EVIDENCE');

  const completed=plan.steps.slice(0,2).map(step=>step.id);
  const allowed=evaluateRc1PreMutationGuard({plan,authorization,stepId:land1,completedStepIds:completed});
  assert.equal(allowed.decision,'ALLOW');
  assert.equal(allowed.code,'AUTHORIZED_NEXT_STEP');
});

test('next step without authorization is denied even when sequence is correct',()=>{
  const plan=buildPlan();
  const first=plan.steps[0].id;
  const second=plan.steps[1].id;
  const authorization=buildAuthorization(plan,[first]);
  const result=evaluateRc1PreMutationGuard({plan,authorization,stepId:second,completedStepIds:[first]});
  assert.equal(result.decision,'DENY');
  assert.equal(result.code,'STEP_NOT_AUTHORIZED');
});

test('malformed completed history cannot be used to skip sequence',()=>{
  const plan=buildPlan();
  const target=plan.steps[2].id;
  const authorization=buildAuthorization(plan,[target]);
  const wrongPrefix=evaluateRc1PreMutationGuard({plan,authorization,stepId:target,completedStepIds:[plan.steps[1].id,plan.steps[0].id]});
  assert.equal(wrongPrefix.decision,'DENY');
  assert.equal(wrongPrefix.code,'INVALID_COMPLETION_PREFIX');

  const duplicatePrefix=evaluateRc1PreMutationGuard({plan,authorization,stepId:target,completedStepIds:[plan.steps[0].id,plan.steps[0].id]});
  assert.equal(duplicatePrefix.decision,'DENY');
  assert.equal(duplicatePrefix.code,'INVALID_COMPLETION_PREFIX');
});

test('tampered plan or authorization is denied before sequence evaluation',()=>{
  const plan=buildPlan();
  const first=plan.steps[0].id;
  const authorization=buildAuthorization(plan,[first]);
  const tamperedPlan=structuredClone(plan);
  tamperedPlan.steps[0].instruction='tampered';
  assert.equal(evaluateRc1PreMutationGuard({plan:tamperedPlan,authorization,stepId:first,completedStepIds:[]}).code,'INVALID_PLAN');

  const tamperedAuthorization=structuredClone(authorization);
  tamperedAuthorization.sourcePlan.planFingerprint='0'.repeat(64);
  assert.equal(evaluateRc1PreMutationGuard({plan,authorization:tamperedAuthorization,stepId:first,completedStepIds:[]}).code,'INVALID_AUTHORIZATION');
});

test('guard CLI has no action-execution or network surface',()=>{
  assert.equal(pkg.scripts['guard:rc1:mutation'],'node scripts/check-rc1-pre-mutation-guard.mjs');
  assert.match(cli,/--authorization/);
  assert.match(cli,/--completed/);
  assert.doesNotMatch(cli,/node:child_process/);
  assert.doesNotMatch(cli,/\bspawn\s*\(/);
  assert.doesNotMatch(cli,/\bexecFile\s*\(/);
  assert.doesNotMatch(cli,/\bfetch\s*\(/);
  assert.doesNotMatch(cli,/@octokit|api\.github\.com|vercel\.com\/api/i);
});
