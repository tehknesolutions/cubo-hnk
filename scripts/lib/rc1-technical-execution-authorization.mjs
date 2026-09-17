import {verifyRc1PromotionExecutionPlan} from './rc1-promotion-execution-plan.mjs';

export const RC1_TECHNICAL_EXECUTION_AUTHORIZATION_VERSION='HOC-RC1-TECHNICAL-EXECUTION-AUTHORIZATION/V1';
export const RC1_RELEASE_ID='HOC-V1.0-RC1';

const STABLE_PHASES=new Set(['STABLE_PREPARATION']);
const PRODUCTION_PHASES=new Set(['DEPLOYMENT','POST_DEPLOYMENT']);

function assert(condition,message){if(!condition)throw new Error(message);}
function clean(value,max){return typeof value==='string'?value.trim().replace(/[\u0000-\u001f]/gu,' ').slice(0,max):'';}

export function inspectRc1TechnicalExecutionAuthorization(record,plan){
  const planInspection=verifyRc1PromotionExecutionPlan(plan);
  const availableSteps=new Map(Array.isArray(plan?.steps)?plan.steps.map(step=>[step.id,step]):[]);
  const authorizedStepIds=Array.isArray(record?.authorizedStepIds)?record.authorizedStepIds:[];
  const uniqueStepIds=[...new Set(authorizedStepIds)];
  const stepsExist=uniqueStepIds.length>0&&uniqueStepIds.length===authorizedStepIds.length&&uniqueStepIds.every(id=>availableSteps.has(id));
  const phases=stepsExist?[...new Set(uniqueStepIds.map(id=>availableSteps.get(id).phase))].sort():[];
  const requiresStableAcknowledgement=phases.some(phase=>STABLE_PHASES.has(phase));
  const requiresProductionAcknowledgement=phases.some(phase=>PRODUCTION_PHASES.has(phase));
  const valid=Boolean(
    planInspection.valid
    &&record
    &&record.version===RC1_TECHNICAL_EXECUTION_AUTHORIZATION_VERSION
    &&record.releaseId===RC1_RELEASE_ID
    &&record.sourcePlan?.version===plan.version
    &&record.sourcePlan?.planFingerprint===plan.planFingerprint
    &&record.sourcePlan?.planFingerprint===planInspection.expectedFingerprint
    &&record.sourcePlan?.sourceDecisionRecordId===plan.sourceDecision?.recordId
    &&stepsExist
    &&Array.isArray(record.authorizedPhases)
    &&record.authorizedPhases.length===phases.length
    &&record.authorizedPhases.every((phase,index)=>phase===phases[index])
    &&record.acknowledgement?.reviewedExactPlanFingerprint===true
    &&record.acknowledgement?.understandsOnlyListedStepsAreAuthorized===true
    &&record.acknowledgement?.understandsNoAutomaticExecution===true
    &&record.acknowledgement?.understandsHnkCanonIsExcluded===true
    &&(!requiresStableAcknowledgement||record.acknowledgement?.understandsStableBoundary===true)
    &&(!requiresProductionAcknowledgement||record.acknowledgement?.understandsProductionBoundary===true)
    &&record.governance?.executesActions===false
    &&record.governance?.automaticExecution===false
    &&record.governance?.authorizesOnlyListedSteps===true
    &&record.governance?.productionNotImpliedByNonProduction===true
    &&record.governance?.promotesHnkCanon===false
    &&record.governance?.authority==='TECHNICAL_EXECUTION_AUTHORIZATION_RECORD_NOT_EXECUTOR'
  );
  return Object.freeze({
    valid,
    planValid:planInspection.valid,
    planFingerprintMatches:Boolean(planInspection.valid&&record?.sourcePlan?.planFingerprint===plan.planFingerprint),
    stepsExist,
    authorizedStepCount:uniqueStepIds.length,
    authorizedPhases:Object.freeze(phases),
    requiresStableAcknowledgement,
    requiresProductionAcknowledgement,
  });
}

export function buildRc1TechnicalExecutionAuthorization({
  plan,
  authorizedStepIds,
  authorizerLabel,
  rationale,
  acknowledged,
  stableBoundaryAcknowledged=false,
  productionBoundaryAcknowledged=false,
  recordedAt=new Date().toISOString(),
  authorizationId=null,
}){
  const planInspection=verifyRc1PromotionExecutionPlan(plan);
  assert(planInspection.valid,'Promotion Execution Plan is invalid or fingerprint-mismatched.');
  const requested=Array.isArray(authorizedStepIds)?authorizedStepIds:[];
  const unique=[...new Set(requested)];
  assert(requested.length>0,'At least one execution-plan step must be selected.');
  assert(unique.length===requested.length,'Authorized step IDs must be unique.');

  const availableSteps=new Map(plan.steps.map(step=>[step.id,step]));
  assert(unique.every(id=>availableSteps.has(id)),'Authorization contains a step ID that does not exist in the exact plan.');
  const selected=unique.map(id=>availableSteps.get(id));
  const phases=[...new Set(selected.map(step=>step.phase))].sort();
  const needsStable=phases.some(phase=>STABLE_PHASES.has(phase));
  const needsProduction=phases.some(phase=>PRODUCTION_PHASES.has(phase));

  assert(acknowledged===true,'Technical execution authorization acknowledgement is required.');
  if(needsStable)assert(stableBoundaryAcknowledged===true,'Stable-preparation steps require explicit stable-boundary acknowledgement.');
  if(needsProduction)assert(productionBoundaryAcknowledged===true,'Production/deployment steps require explicit production-boundary acknowledgement.');

  const authorizer=clean(authorizerLabel,128);
  const reason=clean(rationale,4000);
  assert(authorizer.length>=2,'Authorizer label must contain at least 2 characters.');
  assert(reason.length>=5,'Authorization rationale must contain at least 5 characters.');
  const id=clean(authorizationId,128)||`HOC-EXEC-AUTH-${String(recordedAt).replace(/[^0-9A-Za-z]/g,'').slice(0,24)}`;

  const record=Object.freeze({
    version:RC1_TECHNICAL_EXECUTION_AUTHORIZATION_VERSION,
    releaseId:RC1_RELEASE_ID,
    authorizationId:id,
    recordedAt:String(recordedAt),
    authorizerLabel:authorizer,
    rationale:reason,
    sourcePlan:Object.freeze({
      version:plan.version,
      planFingerprint:plan.planFingerprint,
      generatedAt:plan.generatedAt,
      sourceDecisionRecordId:plan.sourceDecision.recordId,
      sourceStackPlanVersion:plan.sourceStack.planVersion,
    }),
    authorizedStepIds:Object.freeze([...unique]),
    authorizedPhases:Object.freeze(phases),
    authorizationScope:Object.freeze({
      mode:'STEP_SCOPED',
      totalPlanSteps:plan.steps.length,
      authorizedStepCount:unique.length,
      allPlanStepsAuthorized:unique.length===plan.steps.length,
    }),
    acknowledgement:Object.freeze({
      reviewedExactPlanFingerprint:true,
      understandsOnlyListedStepsAreAuthorized:true,
      understandsNoAutomaticExecution:true,
      understandsHnkCanonIsExcluded:true,
      understandsStableBoundary:needsStable?true:Boolean(stableBoundaryAcknowledged),
      understandsProductionBoundary:needsProduction?true:Boolean(productionBoundaryAcknowledged),
    }),
    governance:Object.freeze({
      executesActions:false,
      automaticExecution:false,
      authorizesOnlyListedSteps:true,
      productionNotImpliedByNonProduction:true,
      promotesHnkCanon:false,
      authority:'TECHNICAL_EXECUTION_AUTHORIZATION_RECORD_NOT_EXECUTOR',
    }),
  });

  const inspection=inspectRc1TechnicalExecutionAuthorization(record,plan);
  assert(inspection.valid,'Generated technical execution authorization failed self-validation.');
  return record;
}
