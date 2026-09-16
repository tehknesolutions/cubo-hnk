import {verifyRc1PromotionExecutionPlan} from './rc1-promotion-execution-plan.mjs';
import {inspectRc1TechnicalExecutionAuthorization} from './rc1-technical-execution-authorization.mjs';

export const RC1_PRE_MUTATION_GUARD_VERSION='HOC-RC1-PRE-MUTATION-GUARD/V1';
export const RC1_RELEASE_ID='HOC-V1.0-RC1';

function verdict({decision,code,stepId,expectedNextStepId,completedCount,planFingerprint,authorizationId,detail}){
  return Object.freeze({
    version:RC1_PRE_MUTATION_GUARD_VERSION,
    releaseId:RC1_RELEASE_ID,
    decision,
    code,
    stepId:stepId??null,
    expectedNextStepId:expectedNextStepId??null,
    completedCount,
    planFingerprint:planFingerprint??null,
    authorizationId:authorizationId??null,
    detail,
    governance:Object.freeze({
      executesAction:false,
      automaticExecution:false,
      requiresExecutorRevalidation:true,
      promotesHnkCanon:false,
      authority:'PRE_MUTATION_GUARD_DECISION_NOT_ACTION_EXECUTOR',
    }),
  });
}

export function evaluateRc1PreMutationGuard({plan,authorization,stepId,completedStepIds=[]}){
  const requestedStepId=typeof stepId==='string'?stepId.trim():'';
  const completed=Array.isArray(completedStepIds)?completedStepIds:[];
  const planInspection=verifyRc1PromotionExecutionPlan(plan);
  const planFingerprint=typeof plan?.planFingerprint==='string'?plan.planFingerprint:null;
  const authorizationId=typeof authorization?.authorizationId==='string'?authorization.authorizationId:null;

  if(!planInspection.valid){
    return verdict({decision:'DENY',code:'INVALID_PLAN',stepId:requestedStepId,completedCount:completed.length,planFingerprint,authorizationId,detail:'Promotion Execution Plan failed structural or fingerprint verification.'});
  }

  const authInspection=inspectRc1TechnicalExecutionAuthorization(authorization,plan);
  if(!authInspection.valid){
    return verdict({decision:'DENY',code:'INVALID_AUTHORIZATION',stepId:requestedStepId,completedCount:completed.length,planFingerprint,authorizationId,detail:'Technical Execution Authorization is invalid for this exact plan fingerprint.'});
  }

  const planIds=plan.steps.map(step=>step.id);
  const uniqueCompleted=[...new Set(completed)];
  if(uniqueCompleted.length!==completed.length){
    return verdict({decision:'DENY',code:'INVALID_COMPLETION_PREFIX',stepId:requestedStepId,completedCount:completed.length,planFingerprint,authorizationId,detail:'Completed step IDs contain duplicates and cannot represent an ordered plan prefix.'});
  }

  for(let index=0;index<completed.length;index+=1){
    if(completed[index]!==planIds[index]){
      return verdict({decision:'DENY',code:'INVALID_COMPLETION_PREFIX',stepId:requestedStepId,expectedNextStepId:planIds[index]??null,completedCount:completed.length,planFingerprint,authorizationId,detail:`Completed steps diverge from the runbook at index ${index}.`});
    }
  }

  if(!requestedStepId||!planIds.includes(requestedStepId)){
    return verdict({decision:'DENY',code:'UNKNOWN_STEP',stepId:requestedStepId,expectedNextStepId:planIds[completed.length]??null,completedCount:completed.length,planFingerprint,authorizationId,detail:'Requested step does not exist in the verified plan.'});
  }

  if(completed.includes(requestedStepId)){
    return verdict({decision:'DENY',code:'STEP_ALREADY_COMPLETED',stepId:requestedStepId,expectedNextStepId:planIds[completed.length]??null,completedCount:completed.length,planFingerprint,authorizationId,detail:'Requested step is already inside the completed prefix.'});
  }

  const expectedNextStepId=planIds[completed.length]??null;
  if(expectedNextStepId===null){
    return verdict({decision:'DENY',code:'PLAN_ALREADY_COMPLETE',stepId:requestedStepId,completedCount:completed.length,planFingerprint,authorizationId,detail:'All plan steps are already recorded as complete.'});
  }

  if(requestedStepId!==expectedNextStepId){
    return verdict({decision:'DENY',code:'OUT_OF_SEQUENCE',stepId:requestedStepId,expectedNextStepId,completedCount:completed.length,planFingerprint,authorizationId,detail:'Only the next exact runbook step may proceed.'});
  }

  if(!authorization.authorizedStepIds.includes(requestedStepId)){
    return verdict({decision:'DENY',code:'STEP_NOT_AUTHORIZED',stepId:requestedStepId,expectedNextStepId,completedCount:completed.length,planFingerprint,authorizationId,detail:'The exact next step is not listed in the authorization record.'});
  }

  return verdict({decision:'ALLOW',code:'AUTHORIZED_NEXT_STEP',stepId:requestedStepId,expectedNextStepId,completedCount:completed.length,planFingerprint,authorizationId,detail:'The requested step is the next runbook step and is explicitly authorized for this exact plan fingerprint.'});
}
