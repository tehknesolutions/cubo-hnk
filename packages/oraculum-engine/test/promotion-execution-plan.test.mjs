import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildRc1PromotionExecutionPlan,inspectRc1StackLandingPlan,RC1_PROMOTION_EXECUTION_PLAN_VERSION} from '../../../scripts/lib/rc1-promotion-execution-plan.mjs';

const stack=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/STACK_LANDING_PLAN.json',import.meta.url),'utf8'));
const cli=readFileSync(new URL('../../../scripts/build-rc1-promotion-execution-plan.mjs',import.meta.url),'utf8');
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
    acknowledgement:{
      reviewedPromotionReadiness:true,
      understandsNoAutomaticMerge:true,
      understandsNoAutomaticDeployment:true,
      understandsHnkCanonRemainsSeparate:true,
    },
    governance:{
      executesMerge:false,
      executesDeployment:false,
      changesPackageVersion:false,
      promotesHnkCanon:false,
      automaticPromotion:false,
      authority:'HUMAN_DECISION_RECORD_NOT_EXECUTION_AUTHORITY',
    },
  };
}

test('V8 stack is valid parent-first input for promotion planning',()=>{
  const inspection=inspectRc1StackLandingPlan(stack);
  assert.equal(inspection.valid,true);
  assert.equal(inspection.parentFirst,true);
  assert.equal(inspection.planVersion,'HOC-V1.0-RC1-STACK-LANDING/V8');
  assert.equal(inspection.prCount,25);
  assert.equal(inspection.lastPr,26);
});

test('promotion execution plan is dry-run only and every step is non-executable',()=>{
  const plan=buildRc1PromotionExecutionPlan({decisionRecord:approvedDecision(),stackPlan:stack,generatedAt:'2026-09-16T14:31:00.000Z'});
  assert.equal(plan.version,RC1_PROMOTION_EXECUTION_PLAN_VERSION);
  assert.equal(plan.releaseId,'HOC-V1.0-RC1');
  assert.equal(plan.mode,'DRY_RUN_ONLY');
  assert.equal(plan.sourceDecision.decision,'APPROVE_V1_0');
  assert.equal(plan.sourceStack.prCount,25);
  assert.equal(plan.sourceStack.lastPr,26);
  assert.equal(plan.target.stableVersion,'1.0.0');
  assert.equal(plan.target.tag,'v1.0.0');
  assert.equal(plan.summary.stackLandingSteps,25);
  assert.equal(plan.summary.totalSteps,33);
  assert.equal(plan.summary.allExecutable,false);
  assert.equal(plan.steps.every(step=>step.executable===false),true);
  assert.equal(plan.steps.every(step=>step.requiresSeparateExecutionAuthorization===true),true);
  assert.equal(plan.governance.executionAuthorized,false);
  assert.equal(plan.governance.executesMerge,false);
  assert.equal(plan.governance.executesVersionChange,false);
  assert.equal(plan.governance.createsTagOrRelease,false);
  assert.equal(plan.governance.executesDeployment,false);
  assert.equal(plan.governance.promotesHnkCanon,false);
});

test('non-approved or incoherent human decision cannot generate an execution plan',()=>{
  assert.throws(()=>buildRc1PromotionExecutionPlan({decisionRecord:{...approvedDecision(),decision:'DEFER'},stackPlan:stack}),/APPROVE_V1_0/);
  const forged=approvedDecision();
  forged.sourceReadiness.required={total:9,pass:8,pending:1,blocked:0,missing:0,invalid:0};
  assert.throws(()=>buildRc1PromotionExecutionPlan({decisionRecord:forged,stackPlan:stack}),/APPROVE_V1_0/);
});

test('unsafe or reordered stack cannot generate an execution plan',()=>{
  assert.throws(()=>buildRc1PromotionExecutionPlan({decisionRecord:approvedDecision(),stackPlan:{...stack,mergeAuthorized:true}}),/Stack landing plan/);
  const broken=structuredClone(stack);
  broken.orderedPullRequests[1].base='wrong-parent';
  assert.throws(()=>buildRc1PromotionExecutionPlan({decisionRecord:approvedDecision(),stackPlan:broken}),/Stack landing plan/);
});

test('CLI is local-file dry-run only and contains no mutation/network executor',()=>{
  assert.equal(pkg.scripts['plan:rc1:promotion'],'node scripts/build-rc1-promotion-execution-plan.mjs');
  assert.match(cli,/DRY-RUN ONLY/);
  assert.match(cli,/--decision/);
  assert.doesNotMatch(cli,/node:child_process/);
  assert.doesNotMatch(cli,/\bspawn\s*\(/);
  assert.doesNotMatch(cli,/\bexecFile\s*\(/);
  assert.doesNotMatch(cli,/\bfetch\s*\(/);
  assert.doesNotMatch(cli,/@octokit|api\.github\.com|vercel\.com\/api/i);
});
