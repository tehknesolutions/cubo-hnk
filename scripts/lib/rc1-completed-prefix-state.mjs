import {createHash} from 'node:crypto';
import {verifyRc1PromotionExecutionPlan} from './rc1-promotion-execution-plan.mjs';

export const RC1_COMPLETED_PREFIX_STATE_VERSION='HOC-RC1-COMPLETED-PREFIX-STATE/V1';
export const RC1_COMPLETED_PREFIX_STATE_FINGERPRINT_VERSION='HOC-RC1-COMPLETED-PREFIX-STATE-FINGERPRINT/V1';
export const RC1_RELEASE_ID='HOC-V1.0-RC1';

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

export function computeRc1CompletedPrefixStateFingerprint(state){
  return sha256(`${RC1_COMPLETED_PREFIX_STATE_FINGERPRINT_VERSION}|${stable(stateCore(state))}`);
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
  if(!planInspection.valid)throw new Error('Promotion Execution Plan is invalid or fingerprint-mismatched.');
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
  if(!inspectRc1CompletedPrefixState(state,plan).valid)throw new Error('Generated completed-prefix genesis state failed self-validation.');
  return state;
}
