import {createHash} from 'node:crypto';
import {verifyRc1PromotionExecutionPlan} from './rc1-promotion-execution-plan.mjs';
import {inspectRc1TechnicalExecutionAuthorization} from './rc1-technical-execution-authorization.mjs';
import {inspectRc1CompletedPrefixState} from './rc1-completed-prefix-state.mjs';

export const RC1_PRE_MUTATION_GUARD_VERSION='HOC-RC1-PRE-MUTATION-GUARD/V2';
export const RC1_PRE_MUTATION_GUARD_FINGERPRINT_VERSION='HOC-RC1-PRE-MUTATION-GUARD-FINGERPRINT/V1';
export const RC1_RELEASE_ID='HOC-V1.0-RC1';

function stable(value){
  if(Array.isArray(value))return `[${value.map(stable).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function sha256(text){return createHash('sha256').update(text).digest('hex');}
function guardCore(record){
  return {
    version:record.version,
    releaseId:record.releaseId,
    decision:record.decision,
    code:record.code,
    stepId:record.stepId,
    expectedNextStepId:record.expectedNextStepId,
    completedCount:record.completedCount,
    completedPrefixStateFingerprint:record.completedPrefixStateFingerprint,
    sourceStackPlanVersion:record.sourceStackPlanVersion,
    planFingerprint:record.planFingerprint,
    authorizationId:record.authorizationId,
    detail:record.detail,
    governance:record.governance,
  };
}
export function computeRc1PreMutationGuardFingerprint(record){
  return sha256(`${RC1_PRE_MUTATION_GUARD_FINGERPRINT_VERSION}|${stable(guardCore(record))}`);
}

function verdict({decision,code,stepId,expectedNextStepId,completedCount,completedPrefixStateFingerprint,sourceStackPlanVersion,planFingerprint,authorizationId,detail}){
  const draft={
    version:RC1_PRE_MUTATION_GUARD_VERSION,
    releaseId:RC1_RELEASE_ID,
    decision,
    code,
    stepId:stepId??null,
    expectedNextStepId:expectedNextStepId??null,
    completedCount,
    completedPrefixStateFingerprint:completedPrefixStateFingerprint??null,
    sourceStackPlanVersion:sourceStackPlanVersion??null,
    planFingerprint:planFingerprint??null,
    authorizationId:authorizationId??null,
    detail,
    governance:Object.freeze({
      executesAction:false,
      automaticExecution:false,
      requiresExecutorRevalidation:true,
      consumesFingerprintBoundCompletedState:true,
      promotesHnkCanon:false,
      authority:'PRE_MUTATION_GUARD_DECISION_NOT_ACTION_EXECUTOR',
    }),
  };
  return Object.freeze({...draft,guardFingerprint:computeRc1PreMutationGuardFingerprint(draft)});
}

export function inspectRc1PreMutationGuardDecision(record,{plan,authorization,completedPrefixState}={}){
  const planInspection=verifyRc1PromotionExecutionPlan(plan);
  const authInspection=inspectRc1TechnicalExecutionAuthorization(authorization,plan);
  const stateInspection=inspectRc1CompletedPrefixState(completedPrefixState,plan);
  const expectedNextStepId=stateInspection.valid?completedPrefixState.nextStepId:null;
  const expectedFingerprint=record?computeRc1PreMutationGuardFingerprint(record):null;
  const fingerprintMatches=Boolean(record&&record.guardFingerprint===expectedFingerprint);
  const allowSemantics=record?.decision!=='ALLOW'||(
    record.code==='AUTHORIZED_NEXT_STEP'
    &&record.stepId===expectedNextStepId
    &&authorization?.authorizedStepIds?.includes(record.stepId)
  );
  const valid=Boolean(
    planInspection.valid
    &&authInspection.valid
    &&stateInspection.valid
    &&record
    &&record.version===RC1_PRE_MUTATION_GUARD_VERSION
    &&record.releaseId===RC1_RELEASE_ID
    &&record.completedCount===completedPrefixState.completedCount
    &&record.completedPrefixStateFingerprint===completedPrefixState.stateFingerprint
    &&record.sourceStackPlanVersion===completedPrefixState.sourceStackPlanVersion
    &&record.planFingerprint===plan.planFingerprint
    &&record.authorizationId===authorization.authorizationId
    &&record.expectedNextStepId===expectedNextStepId
    &&record.governance?.executesAction===false
    &&record.governance?.automaticExecution===false
    &&record.governance?.requiresExecutorRevalidation===true
    &&record.governance?.consumesFingerprintBoundCompletedState===true
    &&record.governance?.promotesHnkCanon===false
    &&record.governance?.authority==='PRE_MUTATION_GUARD_DECISION_NOT_ACTION_EXECUTOR'
    &&allowSemantics
    &&fingerprintMatches
  );
  return Object.freeze({valid,planValid:planInspection.valid,authorizationValid:authInspection.valid,stateValid:stateInspection.valid,fingerprintMatches,expectedFingerprint,decision:valid?record.decision:null,code:valid?record.code:null,expectedNextStepId:valid?expectedNextStepId:null});
}

export function evaluateRc1PreMutationGuard({plan,authorization,stepId,completedPrefixState}){
  const requestedStepId=typeof stepId==='string'?stepId.trim():'';
  const planInspection=verifyRc1PromotionExecutionPlan(plan);
  const planFingerprint=typeof plan?.planFingerprint==='string'?plan.planFingerprint:null;
  const authorizationId=typeof authorization?.authorizationId==='string'?authorization.authorizationId:null;
  const stateFingerprint=typeof completedPrefixState?.stateFingerprint==='string'?completedPrefixState.stateFingerprint:null;
  const sourceStackPlanVersion=typeof completedPrefixState?.sourceStackPlanVersion==='string'?completedPrefixState.sourceStackPlanVersion:null;
  const completedCount=Number.isInteger(completedPrefixState?.completedCount)?completedPrefixState.completedCount:0;

  if(!planInspection.valid){
    return verdict({decision:'DENY',code:'INVALID_PLAN',stepId:requestedStepId,completedCount,completedPrefixStateFingerprint:stateFingerprint,sourceStackPlanVersion,planFingerprint,authorizationId,detail:'Promotion Execution Plan failed structural or fingerprint verification.'});
  }

  const authInspection=inspectRc1TechnicalExecutionAuthorization(authorization,plan);
  if(!authInspection.valid){
    return verdict({decision:'DENY',code:'INVALID_AUTHORIZATION',stepId:requestedStepId,completedCount,completedPrefixStateFingerprint:stateFingerprint,sourceStackPlanVersion,planFingerprint,authorizationId,detail:'Technical Execution Authorization is invalid for this exact plan fingerprint.'});
  }

  const stateInspection=inspectRc1CompletedPrefixState(completedPrefixState,plan);
  if(!stateInspection.valid){
    return verdict({decision:'DENY',code:'INVALID_COMPLETED_PREFIX_STATE',stepId:requestedStepId,completedCount,completedPrefixStateFingerprint:stateFingerprint,sourceStackPlanVersion,planFingerprint,authorizationId,detail:'Completed Prefix State is invalid, fingerprint-mismatched or not bound to this exact plan.'});
  }

  const expectedNextStepId=completedPrefixState.nextStepId;
  if(expectedNextStepId===null){
    return verdict({decision:'DENY',code:'PLAN_ALREADY_COMPLETE',stepId:requestedStepId,completedCount:completedPrefixState.completedCount,completedPrefixStateFingerprint:completedPrefixState.stateFingerprint,sourceStackPlanVersion:completedPrefixState.sourceStackPlanVersion,planFingerprint,authorizationId,detail:'Completed Prefix State already represents the complete promotion plan.'});
  }

  if(!requestedStepId||!plan.steps.some(step=>step.id===requestedStepId)){
    return verdict({decision:'DENY',code:'UNKNOWN_STEP',stepId:requestedStepId,expectedNextStepId,completedCount:completedPrefixState.completedCount,completedPrefixStateFingerprint:completedPrefixState.stateFingerprint,sourceStackPlanVersion:completedPrefixState.sourceStackPlanVersion,planFingerprint,authorizationId,detail:'Requested step does not exist in the verified plan.'});
  }

  if(requestedStepId!==expectedNextStepId){
    return verdict({decision:'DENY',code:'OUT_OF_SEQUENCE',stepId:requestedStepId,expectedNextStepId,completedCount:completedPrefixState.completedCount,completedPrefixStateFingerprint:completedPrefixState.stateFingerprint,sourceStackPlanVersion:completedPrefixState.sourceStackPlanVersion,planFingerprint,authorizationId,detail:'Only the exact next step from the fingerprint-bound Completed Prefix State may proceed.'});
  }

  if(!authorization.authorizedStepIds.includes(requestedStepId)){
    return verdict({decision:'DENY',code:'STEP_NOT_AUTHORIZED',stepId:requestedStepId,expectedNextStepId,completedCount:completedPrefixState.completedCount,completedPrefixStateFingerprint:completedPrefixState.stateFingerprint,sourceStackPlanVersion:completedPrefixState.sourceStackPlanVersion,planFingerprint,authorizationId,detail:'The exact next step is not listed in the authorization record.'});
  }

  return verdict({decision:'ALLOW',code:'AUTHORIZED_NEXT_STEP',stepId:requestedStepId,expectedNextStepId,completedCount:completedPrefixState.completedCount,completedPrefixStateFingerprint:completedPrefixState.stateFingerprint,sourceStackPlanVersion:completedPrefixState.sourceStackPlanVersion,planFingerprint,authorizationId,detail:'The requested step is the next runbook step from a valid fingerprint-bound Completed Prefix State and is explicitly authorized for this exact plan.'});
}
