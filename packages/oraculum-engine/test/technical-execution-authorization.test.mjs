import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildRc1PromotionExecutionPlan,computeRc1PromotionPlanFingerprint,verifyRc1PromotionExecutionPlan} from '../../../scripts/lib/rc1-promotion-execution-plan.mjs';
import {buildRc1TechnicalExecutionAuthorization,inspectRc1TechnicalExecutionAuthorization,RC1_TECHNICAL_EXECUTION_AUTHORIZATION_VERSION} from '../../../scripts/lib/rc1-technical-execution-authorization.mjs';

const stack=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/STACK_LANDING_PLAN.json',import.meta.url),'utf8'));
const cli=readFileSync(new URL('../../../scripts/build-rc1-technical-execution-authorization.mjs',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../../../package.json',import.meta.url),'utf8'));

function approvedDecision(){
  return {
    version:'HOC-RC1-HUMAN-PROMOTION-DECISION/V1',
    releaseId:'HOC-V1.0-RC1',
    recordId:'HOC-DECISION-TEST-APPROVED',
    recordedAt:'2026-09-16T14:30:00.000Z',
    decision:'APPROVE_V1_0',
    reviewerLabel:'Release Reviewer',
    rationale:'All mandatory readiness gates were reviewed and passed.',
    sourceReadiness:{
      evidenceKind:'HOC-RC1-PROMOTION-READINESS/V1',
      generatedAt:'2026-09-16T14:25:00.000Z',
      status:'READY_FOR_HUMAN_REVIEW',
      readyForHumanReview:true,
      required:{total:9,pass:9,pending:0,blocked:0,missing:0,invalid:0},
    },
    acknowledgement:{reviewedPromotionReadiness:true,understandsNoAutomaticMerge:true,understandsNoAutomaticDeployment:true,understandsHnkCanonRemainsSeparate:true},
    governance:{executesMerge:false,executesDeployment:false,changesPackageVersion:false,promotesHnkCanon:false,automaticPromotion:false,authority:'HUMAN_DECISION_RECORD_NOT_EXECUTION_AUTHORITY'},
  };
}

function plan(generatedAt='2026-09-16T14:40:00.000Z'){
  return buildRc1PromotionExecutionPlan({decisionRecord:approvedDecision(),stackPlan:stack,generatedAt});
}

function authorize(sourcePlan,authorizedStepIds,overrides={}){
  return buildRc1TechnicalExecutionAuthorization({
    plan:sourcePlan,
    authorizedStepIds,
    authorizerLabel:'Technical Release Authorizer',
    rationale:'Authorize only the explicitly selected technical execution steps.',
    acknowledged:true,
    recordedAt:'2026-09-16T14:45:00.000Z',
    authorizationId:'HOC-EXEC-AUTH-TEST-001',
    ...overrides,
  });
}

test('promotion plan fingerprint ignores generatedAt but binds the operational plan',()=>{
  const a=plan('2026-09-16T14:40:00.000Z');
  const b=plan('2026-09-16T14:41:00.000Z');
  assert.equal(a.planFingerprint,b.planFingerprint);
  assert.equal(a.planFingerprint,computeRc1PromotionPlanFingerprint(a));
  assert.equal(verifyRc1PromotionExecutionPlan(a).valid,true);
  const tampered=structuredClone(a);
  tampered.steps[0].instruction='tampered';
  assert.equal(verifyRc1PromotionExecutionPlan(tampered).valid,false);
});

test('step-scoped authorization does not imply stable or production authority',()=>{
  const sourcePlan=plan();
  const record=authorize(sourcePlan,['LAND_PR_1']);
  const inspection=inspectRc1TechnicalExecutionAuthorization(record,sourcePlan);
  assert.equal(record.version,RC1_TECHNICAL_EXECUTION_AUTHORIZATION_VERSION);
  assert.equal(inspection.valid,true);
  assert.deepEqual(record.authorizedStepIds,['LAND_PR_1']);
  assert.deepEqual(record.authorizedPhases,['STACK_LANDING']);
  assert.equal(record.authorizationScope.allPlanStepsAuthorized,false);
  assert.equal(record.governance.executesActions,false);
  assert.equal(record.governance.automaticExecution,false);
  assert.equal(record.governance.productionNotImpliedByNonProduction,true);
  assert.equal(record.governance.promotesHnkCanon,false);
});

test('stable preparation requires explicit stable-boundary acknowledgement',()=>{
  const sourcePlan=plan();
  assert.throws(()=>authorize(sourcePlan,['PREPARE_STABLE_VERSION']),/stable-boundary acknowledgement/i);
  const record=authorize(sourcePlan,['PREPARE_STABLE_VERSION'],{stableBoundaryAcknowledged:true});
  assert.equal(inspectRc1TechnicalExecutionAuthorization(record,sourcePlan).valid,true);
  assert.equal(record.acknowledgement.understandsStableBoundary,true);
});

test('production steps require explicit production-boundary acknowledgement',()=>{
  const sourcePlan=plan();
  assert.throws(()=>authorize(sourcePlan,['PREPARE_PRODUCTION_DEPLOYMENT']),/production-boundary acknowledgement/i);
  const record=authorize(sourcePlan,['PREPARE_PRODUCTION_DEPLOYMENT','VERIFY_PRODUCTION_IDENTITY'],{productionBoundaryAcknowledged:true});
  assert.equal(inspectRc1TechnicalExecutionAuthorization(record,sourcePlan).valid,true);
  assert.equal(record.acknowledgement.understandsProductionBoundary,true);
});

test('unknown, duplicated or fingerprint-mismatched steps fail closed',()=>{
  const sourcePlan=plan();
  assert.throws(()=>authorize(sourcePlan,['NO_SUCH_STEP']),/does not exist/i);
  assert.throws(()=>authorize(sourcePlan,['LAND_PR_1','LAND_PR_1']),/must be unique/i);
  const record=authorize(sourcePlan,['LAND_PR_1']);
  const tampered=structuredClone(sourcePlan);
  tampered.planFingerprint='0'.repeat(64);
  assert.equal(inspectRc1TechnicalExecutionAuthorization(record,tampered).valid,false);
});

test('even all-step authorization remains a record, not an executor or HNK_CANON authority',()=>{
  const sourcePlan=plan();
  const record=authorize(sourcePlan,sourcePlan.steps.map(step=>step.id),{stableBoundaryAcknowledged:true,productionBoundaryAcknowledged:true});
  assert.equal(record.authorizationScope.allPlanStepsAuthorized,true);
  assert.equal(record.governance.executesActions,false);
  assert.equal(record.governance.automaticExecution,false);
  assert.equal(record.governance.promotesHnkCanon,false);
  assert.equal(record.governance.authority,'TECHNICAL_EXECUTION_AUTHORIZATION_RECORD_NOT_EXECUTOR');
});

test('authorization CLI is local-file only and exposes no mutation/network executor',()=>{
  assert.equal(pkg.scripts['authorize:rc1:technical'],'node scripts/build-rc1-technical-execution-authorization.mjs');
  assert.match(cli,/--steps/);
  assert.match(cli,/--ack-production/);
  assert.doesNotMatch(cli,/node:child_process/);
  assert.doesNotMatch(cli,/\bspawn\s*\(/);
  assert.doesNotMatch(cli,/\bexecFile\s*\(/);
  assert.doesNotMatch(cli,/\bfetch\s*\(/);
  assert.doesNotMatch(cli,/@octokit|api\.github\.com|vercel\.com\/api/i);
});
