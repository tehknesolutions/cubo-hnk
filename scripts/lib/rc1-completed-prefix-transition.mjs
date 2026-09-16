import {createHash} from 'node:crypto';
import {verifyRc1PromotionExecutionPlan} from './rc1-promotion-execution-plan.mjs';
import {inspectRc1MutationEvidenceVerification} from './rc1-mutation-evidence-verification.mjs';

export const RC1_COMPLETED_PREFIX_STATE_VERSION='HOC-RC1-COMPLETED-PREFIX-STATE/V1';
export const RC1_COMPLETED_PREFIX_STATE_FINGERPRINT_VERSION='HOC-RC1-COMPLETED-PREFIX-STATE-FINGERPRINT/V1';
export const RC1_COMPLETED_PREFIX_TRANSITION_VERSION='HOC-RC1-COMPLETED-PREFIX-TRANSITION/V1';
export const RC1_COMPLETED_PREFIX_TRANSITION_FINGERPRINT_VERSION='HOC-RC1-COMPLETED-PREFIX-TRANSITION-FINGERPRINT/V1';
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

function stateCore(state){
  return {
    version:state.version,
    releaseId:state.releaseId,
    planFingerprint:state.planFingerprint,
    sourceStackPlanVersion:state.sourceStackPlanVersion,
    completedStepIds:state.completedStepIds,
    lineage:state.lineage,
    completedCount:state.completedCount,
    nextStepId:state.nextStepId,
    governance:state.governance,
  };
}

function transitionCore(transition){
  return {
    version:transition.version,
    releaseId:transition.releaseId,
    transitionId:transition.transitionId,
    transitionedAt:transition.transitionedAt,
    sourceState:transition.sourceState,
    sourceVerification:transition.sourceVerification,
    result:transition.result,
    governance:transition.governance,
  };
}

export function computeRc1CompletedPrefixStateFingerprint(state){
  return sha256(`${RC1_COMPLETED_PREFIX_STATE_FINGERPRINT_VERSION}|${stable(stateCore(state))}`);
}

export function computeRc1CompletedPrefixTransitionFingerprint(transition){
  return sha256(`${RC1_COMPLETED_PREFIX_TRANSITION_FINGERPRINT_VERSION}|${stable(transitionCore(transition))}`);
}

export function inspectRc1CompletedPrefixState(state,plan){
  const planInspection=verifyRc1PromotionExecutionPlan(plan);
  const planIds=planInspection.valid?plan.steps.map(step=>step.id):[];
  const completed=Array.isArray(state?.completedStepIds)?state.completedStepIds:[];
  const lineage=Array.isArray(state?.lineage)?state.lineage:[];
  const prefixValid=completed.length<=planIds.length&&completed.every((id,index)=>id===planIds[index]);
  const lineageValid=lineage.length===completed.length&&lineage.every((entry,index)=>
    entry?.index===index
    &&entry?.stepId===completed[index]
    &&typeof entry?.receiptId==='string'&&entry.receiptId.length>0
    &&typeof entry?.verificationId==='string'&&entry.verificationId.length>0
    &&/^[0-9a-f]{64}$/u.test(entry?.verificationFingerprint??'')
    &&validTimestamp(entry?.transitionedAt)
  );
  const expectedNextStepId=prefixValid?(planIds[completed.length]??null):null;
  const expectedFingerprint=state?computeRc1CompletedPrefixStateFingerprint(state):null;
  const fingerprintMatches=Boolean(state&&state.stateFingerprint===expectedFingerprint);
  const valid=Boolean(
    planInspection.valid
    &&state
    &&state.version===RC1_COMPLETED_PREFIX_STATE_VERSION
    &&state.releaseId===RC1_RELEASE_ID
    &&state.planFingerprint===plan.planFingerprint
    &&state.sourceStackPlanVersion===plan.sourceStack?.planVersion
    &&prefixValid
    &&lineageValid
    &&state.completedCount===completed.length
    &&state.nextStepId===expectedNextStepId
    &&state.governance?.representsLogicalReleaseState===true
    &&state.governance?.executesTechnicalAction===false
    &&state.governance?.automaticPromotion===false
    &&state.governance?.promotesHnkCanon===false
    &&state.governance?.authority==='COMPLETED_PREFIX_STATE_RECORD_NOT_TECHNICAL_EXECUTOR'
    &&fingerprintMatches
  );
  return Object.freeze({valid,planValid:planInspection.valid,prefixValid,lineageValid,fingerprintMatches,expectedFingerprint,completedCount:valid?completed.length:null,nextStepId:valid?expectedNextStepId:null,isComplete:valid&&completed.length===planIds.length});
}

export function buildRc1CompletedPrefixGenesis({plan}){
  const planInspection=verifyRc1PromotionExecutionPlan(plan);
  assert(planInspection.valid,'Promotion Execution Plan is invalid or fingerprint-mismatched.');
  const draft={
    version:RC1_COMPLETED_PREFIX_STATE_VERSION,
    releaseId:RC1_RELEASE_ID,
    planFingerprint:plan.planFingerprint,
    sourceStackPlanVersion:plan.sourceStack.planVersion,
    completedStepIds:Object.freeze([]),
    lineage:Object.freeze([]),
    completedCount:0,
    nextStepId:plan.steps[0]?.id??null,
    governance:Object.freeze({representsLogicalReleaseState:true,executesTechnicalAction:false,automaticPromotion:false,promotesHnkCanon:false,authority:'COMPLETED_PREFIX_STATE_RECORD_NOT_TECHNICAL_EXECUTOR'}),
  };
  const state=Object.freeze({...draft,stateFingerprint:computeRc1CompletedPrefixStateFingerprint(draft)});
  assert(inspectRc1CompletedPrefixState(state,plan).valid,'Generated completed-prefix genesis state failed self-validation.');
  return state;
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

export function inspectRc1CompletedPrefixTransition(transition,{plan,authorization,receipt,verification,currentState}={}){
  const stateInspection=inspectRc1CompletedPrefixState(currentState,plan);
  const verificationInspection=inspectRc1MutationEvidenceVerification(verification,{plan,authorization,receipt});
  const nextState=transition?.nextState;
  const nextStateInspection=inspectRc1CompletedPrefixState(nextState,plan);
  const expectedStepId=stateInspection.valid?currentState.nextStepId:null;
  const expectedFingerprint=transition?computeRc1CompletedPrefixTransitionFingerprint(transition):null;
  const fingerprintMatches=Boolean(transition&&transition.transitionFingerprint===expectedFingerprint);
  const valid=Boolean(
    stateInspection.valid
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
  return Object.freeze({valid,stateValid:stateInspection.valid,verificationValid:verificationInspection.valid,nextStateValid:nextStateInspection.valid,fingerprintMatches,expectedFingerprint,expectedStepId,fromCount:valid?currentState.completedCount:null,toCount:valid?nextState.completedCount:null,nextStepId:valid?nextState.nextStepId:null});
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
  const verificationInspection=inspectRc1MutationEvidenceVerification(verification,{plan,authorization,receipt});
  assert(verificationInspection.valid&&verificationInspection.eligibleForCompletedPrefix===true,'Mutation evidence verification is invalid or not eligible for completed-prefix advancement.');
  assert(receipt.stepId===currentState.nextStepId,'Verified receipt does not correspond to the exact next runbook step.');
  assert(verification.sourceReceipt?.stepId===currentState.nextStepId,'Verification record belongs to another runbook step.');
  assert(validTimestamp(transitionedAt),'transitionedAt must be a valid timestamp.');
  assert(Date.parse(transitionedAt)>=Date.parse(verification.verifiedAt),'transitionedAt cannot predate evidence verification.');

  const nextState=buildNextState({plan,currentState,verification,receipt,transitionedAt:String(transitionedAt)});
  const id=clean(transitionId,128)||`HOC-PREFIX-TRANSITION-${String(transitionedAt).replace(/[^0-9A-Za-z]/g,'').slice(0,24)}`;
  const draft={
    version:RC1_COMPLETED_PREFIX_TRANSITION_VERSION,
    releaseId:RC1_RELEASE_ID,
    transitionId:id,
    transitionedAt:String(transitionedAt),
    sourceState:Object.freeze({stateFingerprint:currentState.stateFingerprint,completedCount:currentState.completedCount,nextStepId:currentState.nextStepId}),
    sourceVerification:Object.freeze({verificationId:verification.verificationId,verificationFingerprint:verification.verificationFingerprint,receiptId:receipt.receiptId,stepId:receipt.stepId}),
    result:Object.freeze({status:'COMPLETED_PREFIX_ADVANCED',fromCount:currentState.completedCount,toCount:nextState.completedCount,appendedStepId:receipt.stepId,nextStepId:nextState.nextStepId,nextStateFingerprint:nextState.stateFingerprint}),
    governance:Object.freeze({executesTechnicalAction:false,advancesLogicalCompletedPrefix:true,persistsExternalState:false,automaticPromotion:false,promotesHnkCanon:false,authority:'COMPLETED_PREFIX_TRANSITION_RECORD_NOT_TECHNICAL_EXECUTOR'}),
    nextState,
  };
  const transition=Object.freeze({...draft,transitionFingerprint:computeRc1CompletedPrefixTransitionFingerprint(draft)});
  assert(inspectRc1CompletedPrefixTransition(transition,{plan,authorization,receipt,verification,currentState}).valid,'Generated completed-prefix transition failed self-validation.');
  return transition;
}
