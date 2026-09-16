import {createHash} from 'node:crypto';
import {inspectRc1MutationEvidenceVerification} from './rc1-mutation-evidence-verification.mjs';
import {inspectRc1PreMutationGuardDecision,RC1_PRE_MUTATION_GUARD_VERSION} from './rc1-pre-mutation-guard.mjs';
import {
  RC1_COMPLETED_PREFIX_STATE_VERSION,
  RC1_COMPLETED_PREFIX_STATE_FINGERPRINT_VERSION,
  computeRc1CompletedPrefixStateFingerprint,
  inspectRc1CompletedPrefixState,
  buildRc1CompletedPrefixGenesis,
} from './rc1-completed-prefix-state.mjs';

export {
  RC1_COMPLETED_PREFIX_STATE_VERSION,
  RC1_COMPLETED_PREFIX_STATE_FINGERPRINT_VERSION,
  computeRc1CompletedPrefixStateFingerprint,
  inspectRc1CompletedPrefixState,
  buildRc1CompletedPrefixGenesis,
};

export const RC1_COMPLETED_PREFIX_TRANSITION_VERSION='HOC-RC1-COMPLETED-PREFIX-TRANSITION/V2';
export const RC1_COMPLETED_PREFIX_TRANSITION_FINGERPRINT_VERSION='HOC-RC1-COMPLETED-PREFIX-TRANSITION-FINGERPRINT/V2';
export const RC1_RELEASE_ID='HOC-V1.0-RC1';

function assert(condition,message){if(!condition)throw new Error(message);}
function clean(value,max){return typeof value==='string'?value.trim().replace(/[\u0000-\u001f]/gu,' ').slice(0,max):'';}
function stable(value){
  if(Array.isArray(value))return `[${value.map(stable).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function sha256(text){return createHash('sha256').update(text).digest('hex');}
function validTimestamp(value){return typeof value==='string'&&Number.isFinite(Date.parse(value));}

function transitionCore(transition){
  return {
    version:transition.version,
    releaseId:transition.releaseId,
    transitionId:transition.transitionId,
    transitionedAt:transition.transitionedAt,
    sourceState:transition.sourceState,
    sourceGuard:transition.sourceGuard,
    sourceVerification:transition.sourceVerification,
    result:transition.result,
    governance:transition.governance,
  };
}

export function computeRc1CompletedPrefixTransitionFingerprint(transition){
  return sha256(`${RC1_COMPLETED_PREFIX_TRANSITION_FINGERPRINT_VERSION}|${stable(transitionCore(transition))}`);
}

function buildNextState({plan,currentState,verification,receipt,transitionedAt}){
  const completed=[...currentState.completedStepIds,receipt.stepId];
  const lineage=[...currentState.lineage,Object.freeze({
    index:completed.length-1,
    stepId:receipt.stepId,
    receiptId:receipt.receiptId,
    verificationId:verification.verificationId,
    verificationFingerprint:verification.verificationFingerprint,
    transitionedAt,
  })];
  const draft={
    version:RC1_COMPLETED_PREFIX_STATE_VERSION,
    releaseId:RC1_RELEASE_ID,
    planFingerprint:plan.planFingerprint,
    sourceStackPlanVersion:plan.sourceStack.planVersion,
    completedStepIds:Object.freeze(completed),
    lineage:Object.freeze(lineage),
    completedCount:completed.length,
    nextStepId:plan.steps[completed.length]?.id??null,
    governance:Object.freeze({representsLogicalReleaseState:true,executesTechnicalAction:false,automaticPromotion:false,promotesHnkCanon:false,authority:'COMPLETED_PREFIX_STATE_RECORD_NOT_TECHNICAL_EXECUTOR'}),
  };
  return Object.freeze({...draft,stateFingerprint:computeRc1CompletedPrefixStateFingerprint(draft)});
}

function guardMatchesCurrentState(receipt,{plan,authorization,currentState}){
  const guard=receipt?.preMutationGuard;
  const inspection=inspectRc1PreMutationGuardDecision(guard,{plan,authorization,completedPrefixState:currentState});
  return Object.freeze({
    valid:Boolean(
      inspection.valid
      &&guard?.version===RC1_PRE_MUTATION_GUARD_VERSION
      &&guard?.decision==='ALLOW'
      &&guard?.code==='AUTHORIZED_NEXT_STEP'
      &&guard?.completedPrefixStateFingerprint===currentState?.stateFingerprint
      &&guard?.completedCount===currentState?.completedCount
      &&guard?.expectedNextStepId===currentState?.nextStepId
      &&guard?.stepId===currentState?.nextStepId
    ),
    inspection,
  });
}

export function inspectRc1CompletedPrefixTransition(transition,{plan,authorization,receipt,verification,currentState}={}){
  const stateInspection=inspectRc1CompletedPrefixState(currentState,plan);
  const guardBinding=guardMatchesCurrentState(receipt,{plan,authorization,currentState});
  const verificationInspection=inspectRc1MutationEvidenceVerification(verification,{plan,authorization,receipt});
  const nextState=transition?.nextState;
  const nextStateInspection=inspectRc1CompletedPrefixState(nextState,plan);
  const expectedStepId=stateInspection.valid?currentState.nextStepId:null;
  const expectedFingerprint=transition?computeRc1CompletedPrefixTransitionFingerprint(transition):null;
  const fingerprintMatches=Boolean(transition&&transition.transitionFingerprint===expectedFingerprint);
  const guard=receipt?.preMutationGuard;
  const valid=Boolean(
    stateInspection.valid
    &&guardBinding.valid
    &&verificationInspection.valid
    &&verificationInspection.eligibleForCompletedPrefix===true
    &&expectedStepId!==null
    &&receipt?.stepId===expectedStepId
    &&verification?.sourceReceipt?.stepId===expectedStepId
    &&transition
    &&transition.version===RC1_COMPLETED_PREFIX_TRANSITION_VERSION
    &&transition.releaseId===RC1_RELEASE_ID
    &&typeof transition.transitionId==='string'&&transition.transitionId.length>0
    &&validTimestamp(transition.transitionedAt)
    &&Date.parse(transition.transitionedAt)>=Date.parse(verification.verifiedAt)
    &&transition.sourceState?.stateFingerprint===currentState.stateFingerprint
    &&transition.sourceState?.completedCount===currentState.completedCount
    &&transition.sourceState?.nextStepId===currentState.nextStepId
    &&transition.sourceGuard?.version===guard.version
    &&transition.sourceGuard?.guardFingerprint===guard.guardFingerprint
    &&transition.sourceGuard?.completedPrefixStateFingerprint===currentState.stateFingerprint
    &&transition.sourceGuard?.completedCount===currentState.completedCount
    &&transition.sourceGuard?.stepId===expectedStepId
    &&transition.sourceGuard?.authorizationId===authorization.authorizationId
    &&transition.sourceVerification?.verificationId===verification.verificationId
    &&transition.sourceVerification?.verificationFingerprint===verification.verificationFingerprint
    &&transition.sourceVerification?.receiptId===receipt.receiptId
    &&transition.sourceVerification?.stepId===expectedStepId
    &&nextStateInspection.valid
    &&nextState.completedCount===currentState.completedCount+1
    &&nextState.completedStepIds.length===currentState.completedStepIds.length+1
    &&nextState.completedStepIds.slice(0,-1).every((id,index)=>id===currentState.completedStepIds[index])
    &&nextState.completedStepIds.at(-1)===expectedStepId
    &&nextState.lineage.at(-1)?.verificationFingerprint===verification.verificationFingerprint
    &&transition.result?.status==='COMPLETED_PREFIX_ADVANCED'
    &&transition.result?.fromCount===currentState.completedCount
    &&transition.result?.toCount===nextState.completedCount
    &&transition.result?.appendedStepId===expectedStepId
    &&transition.result?.nextStepId===nextState.nextStepId
    &&transition.result?.nextStateFingerprint===nextState.stateFingerprint
    &&transition.governance?.executesTechnicalAction===false
    &&transition.governance?.advancesLogicalCompletedPrefix===true
    &&transition.governance?.persistsExternalState===false
    &&transition.governance?.automaticPromotion===false
    &&transition.governance?.promotesHnkCanon===false
    &&transition.governance?.authority==='COMPLETED_PREFIX_TRANSITION_RECORD_NOT_TECHNICAL_EXECUTOR'
    &&fingerprintMatches
  );
  return Object.freeze({valid,stateValid:stateInspection.valid,guardStateBindingValid:guardBinding.valid,verificationValid:verificationInspection.valid,nextStateValid:nextStateInspection.valid,fingerprintMatches,expectedFingerprint,expectedStepId,fromCount:valid?currentState.completedCount:null,toCount:valid?nextState.completedCount:null,nextStepId:valid?nextState.nextStepId:null});
}

export function buildRc1CompletedPrefixTransition({
  plan,
  authorization,
  receipt,
  verification,
  currentState,
  transitionedAt=new Date().toISOString(),
  transitionId=null,
}){
  const stateInspection=inspectRc1CompletedPrefixState(currentState,plan);
  assert(stateInspection.valid,'Current Completed Prefix State is invalid or fingerprint-mismatched.');
  assert(currentState.nextStepId!==null,'Completed Prefix State already represents a complete promotion plan.');
  const guardBinding=guardMatchesCurrentState(receipt,{plan,authorization,currentState});
  assert(guardBinding.valid,'Receipt Guard V2 was not authorized against this exact Completed Prefix State fingerprint.');
  const verificationInspection=inspectRc1MutationEvidenceVerification(verification,{plan,authorization,receipt});
  assert(verificationInspection.valid&&verificationInspection.eligibleForCompletedPrefix===true,'Mutation evidence verification is invalid or not eligible for completed-prefix advancement.');
  assert(receipt.stepId===currentState.nextStepId,'Verified receipt does not correspond to the exact next runbook step.');
  assert(verification.sourceReceipt?.stepId===currentState.nextStepId,'Verification record belongs to another runbook step.');
  assert(validTimestamp(transitionedAt),'transitionedAt must be a valid timestamp.');
  assert(Date.parse(transitionedAt)>=Date.parse(verification.verifiedAt),'transitionedAt cannot predate evidence verification.');

  const nextState=buildNextState({plan,currentState,verification,receipt,transitionedAt:String(transitionedAt)});
  const guard=receipt.preMutationGuard;
  const id=clean(transitionId,128)||`HOC-PREFIX-TRANSITION-${String(transitionedAt).replace(/[^0-9A-Za-z]/g,'').slice(0,24)}`;
  const draft={
    version:RC1_COMPLETED_PREFIX_TRANSITION_VERSION,
    releaseId:RC1_RELEASE_ID,
    transitionId:id,
    transitionedAt:String(transitionedAt),
    sourceState:Object.freeze({stateFingerprint:currentState.stateFingerprint,completedCount:currentState.completedCount,nextStepId:currentState.nextStepId}),
    sourceGuard:Object.freeze({version:guard.version,guardFingerprint:guard.guardFingerprint,completedPrefixStateFingerprint:guard.completedPrefixStateFingerprint,completedCount:guard.completedCount,stepId:guard.stepId,authorizationId:guard.authorizationId}),
    sourceVerification:Object.freeze({verificationId:verification.verificationId,verificationFingerprint:verification.verificationFingerprint,receiptId:receipt.receiptId,stepId:receipt.stepId}),
    result:Object.freeze({status:'COMPLETED_PREFIX_ADVANCED',fromCount:currentState.completedCount,toCount:nextState.completedCount,appendedStepId:receipt.stepId,nextStepId:nextState.nextStepId,nextStateFingerprint:nextState.stateFingerprint}),
    governance:Object.freeze({executesTechnicalAction:false,advancesLogicalCompletedPrefix:true,persistsExternalState:false,automaticPromotion:false,promotesHnkCanon:false,authority:'COMPLETED_PREFIX_TRANSITION_RECORD_NOT_TECHNICAL_EXECUTOR'}),
    nextState,
  };
  const transition=Object.freeze({...draft,transitionFingerprint:computeRc1CompletedPrefixTransitionFingerprint(draft)});
  assert(inspectRc1CompletedPrefixTransition(transition,{plan,authorization,receipt,verification,currentState}).valid,'Generated completed-prefix transition failed self-validation.');
  return transition;
}
