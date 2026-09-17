import {createHash} from 'node:crypto';
import {inspectRc1HumanPromotionDecisionRecord} from '../../apps/web/app/oraculum/qa/readiness/human-decision.mjs';

export const RC1_PROMOTION_EXECUTION_PLAN_VERSION='HOC-RC1-PROMOTION-EXECUTION-PLAN/V1';
export const RC1_PROMOTION_PLAN_FINGERPRINT_VERSION='HOC-RC1-PROMOTION-PLAN-FINGERPRINT/V1';
export const RC1_RELEASE_ID='HOC-V1.0-RC1';

function assert(condition,message){if(!condition)throw new Error(message);}
function freezeStep(step){return Object.freeze({...step,executable:false,requiresSeparateExecutionAuthorization:true});}
function canonicalize(value){
  if(Array.isArray(value))return value.map(canonicalize);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonicalize(value[key])]));
  return value;
}
function canonicalJson(value){return JSON.stringify(canonicalize(value));}

export function inspectRc1StackLandingPlan(stackPlan){
  const entries=Array.isArray(stackPlan?.orderedPullRequests)?stackPlan.orderedPullRequests:[];
  let parentFirst=true;
  for(let index=0;index<entries.length;index+=1){
    if(entries[index]?.order!==index+1){parentFirst=false;break;}
    if(index>0&&entries[index]?.base!==entries[index-1]?.head){parentFirst=false;break;}
  }
  const valid=Boolean(
    stackPlan
    &&stackPlan.releaseId===RC1_RELEASE_ID
    &&typeof stackPlan.planVersion==='string'
    &&stackPlan.planVersion.startsWith('HOC-V1.0-RC1-STACK-LANDING/')
    &&stackPlan.mergeAuthorized===false
    &&stackPlan.stablePromotionAuthorized===false
    &&stackPlan.hnkCanonPromotionAuthorized===false
    &&entries.length>0
    &&parentFirst,
  );
  return Object.freeze({valid,parentFirst,prCount:entries.length,planVersion:valid?stackPlan.planVersion:null,lastPr:valid?entries.at(-1)?.pr??null:null});
}

export function rc1PromotionPlanFingerprintCore(plan){
  return Object.freeze({
    fingerprintVersion:RC1_PROMOTION_PLAN_FINGERPRINT_VERSION,
    version:plan.version,
    releaseId:plan.releaseId,
    mode:plan.mode,
    sourceDecision:plan.sourceDecision,
    sourceStack:plan.sourceStack,
    target:plan.target,
    steps:plan.steps,
    summary:plan.summary,
    governance:plan.governance,
  });
}

export function computeRc1PromotionPlanFingerprint(plan){
  return createHash('sha256').update(`${RC1_PROMOTION_PLAN_FINGERPRINT_VERSION}|${canonicalJson(rc1PromotionPlanFingerprintCore(plan))}`,'utf8').digest('hex');
}

export function verifyRc1PromotionExecutionPlan(plan){
  const structurallyValid=Boolean(
    plan
    &&plan.version===RC1_PROMOTION_EXECUTION_PLAN_VERSION
    &&plan.releaseId===RC1_RELEASE_ID
    &&plan.mode==='DRY_RUN_ONLY'
    &&Array.isArray(plan.steps)&&plan.steps.length>0
    &&plan.steps.every(step=>step?.executable===false&&step?.requiresSeparateExecutionAuthorization===true)
    &&plan.summary?.allExecutable===false
    &&plan.governance?.executionAuthorized===false
    &&plan.governance?.executesMerge===false
    &&plan.governance?.executesVersionChange===false
    &&plan.governance?.createsTagOrRelease===false
    &&plan.governance?.executesDeployment===false
    &&plan.governance?.promotesHnkCanon===false
    &&plan.governance?.authority==='PROMOTION_EXECUTION_PLAN_NOT_EXECUTION_AUTHORITY'
    &&typeof plan.planFingerprint==='string'
    &&/^[0-9a-f]{64}$/u.test(plan.planFingerprint)
  );
  const expectedFingerprint=structurallyValid?computeRc1PromotionPlanFingerprint(plan):null;
  return Object.freeze({
    valid:structurallyValid&&expectedFingerprint===plan.planFingerprint,
    structurallyValid,
    fingerprintMatches:structurallyValid&&expectedFingerprint===plan.planFingerprint,
    expectedFingerprint,
    observedFingerprint:typeof plan?.planFingerprint==='string'?plan.planFingerprint:null,
  });
}

export function buildRc1PromotionExecutionPlan({decisionRecord,stackPlan,generatedAt=new Date().toISOString()}){
  const decision=inspectRc1HumanPromotionDecisionRecord(decisionRecord);
  const stack=inspectRc1StackLandingPlan(stackPlan);
  assert(decision.valid,'Human promotion decision record is invalid.');
  assert(decision.approvalReady,'Promotion execution plan requires an APPROVE_V1_0 record backed by complete readiness.');
  assert(stack.valid,'Stack landing plan is invalid or not safely parent-first.');

  const prSteps=stackPlan.orderedPullRequests.map(item=>freezeStep({
    id:`LAND_PR_${item.pr}`,
    phase:'STACK_LANDING',
    pr:item.pr,
    base:item.base,
    head:item.head,
    instruction:`Review the incremental diff for PR #${item.pr}, confirm its parent has landed or the base has been correctly retargeted, then obtain separate execution authorization before merge.`,
  }));

  const steps=[
    freezeStep({id:'FREEZE_APPROVED_EVIDENCE',phase:'PRE_EXECUTION',instruction:'Archive the approved readiness artifact, human decision record, release manifest, audit status and evidence ledger before any technical mutation.'}),
    freezeStep({id:'RECONFIRM_CI_AND_RUNTIME',phase:'PRE_EXECUTION',instruction:'Reconfirm mandatory CI/build/runtime/physical/deployment evidence is still valid and no gate regressed after the human decision.'}),
    ...prSteps,
    freezeStep({id:'VERIFY_MAIN_AFTER_STACK',phase:'POST_LANDING',instruction:'After the full stack lands, rerun clean install, tests, typecheck, Next.js build, runtime self-test and frozen vector checks on main before any stable version change.'}),
    freezeStep({id:'PREPARE_STABLE_VERSION',phase:'STABLE_PREPARATION',instruction:'Prepare the 1.0.0 version change and final release notes as a separate reviewed change; do not alter frozen protocol IDs or HNK40 canon status.'}),
    freezeStep({id:'PREPARE_V1_TAG_RELEASE',phase:'STABLE_PREPARATION',instruction:'Prepare the v1.0.0 tag/release only after the stable version change has independent review and explicit execution authorization.'}),
    freezeStep({id:'PREPARE_PRODUCTION_DEPLOYMENT',phase:'DEPLOYMENT',instruction:'Prepare production deployment from the approved stable commit; production execution remains a separate authorized action.'}),
    freezeStep({id:'VERIFY_PRODUCTION_IDENTITY',phase:'POST_DEPLOYMENT',instruction:'Verify production Release Attestation, Build Provenance, golden RAW seed, Manifest V0.10, security headers and deployment evidence against the exact stable commit.'}),
    freezeStep({id:'ARCHIVE_V1_RELEASE_EVIDENCE',phase:'ARCHIVE',instruction:'Archive final evidence, hashes, decision record, release metadata and production verification. HNK_CANON remains a separate governance domain.'}),
  ];

  const plan={
    version:RC1_PROMOTION_EXECUTION_PLAN_VERSION,
    releaseId:RC1_RELEASE_ID,
    generatedAt:String(generatedAt),
    mode:'DRY_RUN_ONLY',
    sourceDecision:Object.freeze({recordId:decisionRecord.recordId,decision:decisionRecord.decision,reviewerLabel:decisionRecord.reviewerLabel,recordedAt:decisionRecord.recordedAt}),
    sourceStack:Object.freeze({planVersion:stack.planVersion,prCount:stack.prCount,lastPr:stack.lastPr}),
    target:Object.freeze({stableVersion:'1.0.0',tag:'v1.0.0'}),
    steps:Object.freeze(steps),
    summary:Object.freeze({totalSteps:steps.length,stackLandingSteps:prSteps.length,allExecutable:false}),
    governance:Object.freeze({
      executionAuthorized:false,
      executesMerge:false,
      executesVersionChange:false,
      createsTagOrRelease:false,
      executesDeployment:false,
      promotesHnkCanon:false,
      authority:'PROMOTION_EXECUTION_PLAN_NOT_EXECUTION_AUTHORITY',
    }),
  };
  const planFingerprint=computeRc1PromotionPlanFingerprint(plan);
  return Object.freeze({...plan,planFingerprint});
}
