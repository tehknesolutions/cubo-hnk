import {verifyRc1PromotionExecutionPlan} from './rc1-promotion-execution-plan.mjs';
import {inspectRc1TechnicalExecutionAuthorization} from './rc1-technical-execution-authorization.mjs';
import {computeRc1PreMutationGuardFingerprint,RC1_PRE_MUTATION_GUARD_VERSION} from './rc1-pre-mutation-guard.mjs';

export const RC1_TECHNICAL_MUTATION_RECEIPT_VERSION='HOC-RC1-TECHNICAL-MUTATION-RECEIPT/V1';
export const RC1_RELEASE_ID='HOC-V1.0-RC1';
export const RECEIPT_RESULTS=Object.freeze(['SUCCESS','FAILED','CANCELLED']);

function assert(condition,message){if(!condition)throw new Error(message);}
function clean(value,max){return typeof value==='string'?value.trim().replace(/[\u0000-\u001f]/gu,' ').slice(0,max):'';}
function timestampMs(value){const parsed=typeof value==='string'?Date.parse(value):NaN;return Number.isFinite(parsed)?parsed:null;}
function evidenceItemValid(item){
  return Boolean(item&&typeof item.kind==='string'&&item.kind.trim().length>=2&&typeof item.value==='string'&&item.value.trim().length>=2&&(item.sha256===null||item.sha256===undefined||/^[0-9a-f]{64}$/u.test(item.sha256)));
}
function normalizeEvidence(items){
  assert(Array.isArray(items),'Evidence references must be an array.');
  return items.map((item,index)=>{
    const kind=clean(item?.kind,64);
    const value=clean(item?.value,2048);
    const sha256=clean(item?.sha256,64).toLowerCase();
    assert(kind.length>=2,`Evidence item ${index} requires a kind.`);
    assert(value.length>=2,`Evidence item ${index} requires a value.`);
    if(sha256)assert(/^[0-9a-f]{64}$/u.test(sha256),`Evidence item ${index} sha256 must be 64 lowercase hex characters.`);
    return Object.freeze({kind,value,sha256:sha256||null});
  });
}
function guardSnapshotValid(guard,plan,authorization,stepId){
  if(!guard||guard.version!==RC1_PRE_MUTATION_GUARD_VERSION)return false;
  const expectedFingerprint=computeRc1PreMutationGuardFingerprint(guard);
  return Boolean(
    guard.guardFingerprint===expectedFingerprint
    &&guard.decision==='ALLOW'
    &&guard.code==='AUTHORIZED_NEXT_STEP'
    &&guard.stepId===stepId
    &&guard.expectedNextStepId===stepId
    &&Number.isInteger(guard.completedCount)&&guard.completedCount>=0
    &&/^[0-9a-f]{64}$/u.test(guard.completedPrefixStateFingerprint??'')
    &&guard.sourceStackPlanVersion===plan.sourceStack?.planVersion
    &&guard.planFingerprint===plan.planFingerprint
    &&guard.authorizationId===authorization.authorizationId
    &&guard.governance?.executesAction===false
    &&guard.governance?.automaticExecution===false
    &&guard.governance?.requiresExecutorRevalidation===true
    &&guard.governance?.consumesFingerprintBoundCompletedState===true
    &&guard.governance?.promotesHnkCanon===false
    &&guard.governance?.authority==='PRE_MUTATION_GUARD_DECISION_NOT_ACTION_EXECUTOR'
  );
}

export function inspectRc1TechnicalMutationReceipt(receipt,{plan,authorization}={}){
  const planInspection=verifyRc1PromotionExecutionPlan(plan);
  const authorizationInspection=inspectRc1TechnicalExecutionAuthorization(authorization,plan);
  const planStepIds=planInspection.valid?new Set(plan.steps.map(step=>step.id)):new Set();
  const evidence=Array.isArray(receipt?.evidenceRefs)?receipt.evidenceRefs:[];
  const evidenceValid=evidence.every(evidenceItemValid);
  const resultKnown=RECEIPT_RESULTS.includes(receipt?.result);
  const startedMs=timestampMs(receipt?.startedAt);
  const completedMs=timestampMs(receipt?.completedAt);
  const chronologyValid=startedMs!==null&&completedMs!==null&&completedMs>=startedMs;
  const guardValid=Boolean(planInspection.valid&&authorizationInspection.valid&&receipt&&guardSnapshotValid(receipt.preMutationGuard,plan,authorization,receipt.stepId));
  const valid=Boolean(
    planInspection.valid
    &&authorizationInspection.valid
    &&receipt
    &&receipt.version===RC1_TECHNICAL_MUTATION_RECEIPT_VERSION
    &&receipt.releaseId===RC1_RELEASE_ID
    &&typeof receipt.receiptId==='string'&&receipt.receiptId.length>0
    &&chronologyValid
    &&typeof receipt.executorLabel==='string'&&receipt.executorLabel.trim().length>=2
    &&typeof receipt.summary==='string'&&receipt.summary.trim().length>=5
    &&resultKnown
    &&evidenceValid
    &&planStepIds.has(receipt.stepId)
    &&authorization.authorizedStepIds.includes(receipt.stepId)
    &&receipt.sourcePlan?.planFingerprint===plan.planFingerprint
    &&receipt.sourceAuthorization?.authorizationId===authorization.authorizationId
    &&receipt.sourceAuthorization?.planFingerprint===plan.planFingerprint
    &&guardValid
    &&receipt.verification?.externalEvidenceVerified===false
    &&receipt.verification?.status==='UNVERIFIED_EXTERNAL_RESULT'
    &&receipt.governance?.executesAction===false
    &&receipt.governance?.advancesCompletedPrefix===false
    &&receipt.governance?.automaticPromotion===false
    &&receipt.governance?.promotesHnkCanon===false
    &&receipt.governance?.authority==='MUTATION_RECEIPT_RECORD_NOT_EXECUTION_PROOF'
  );
  const successEvidencePresent=receipt?.result!=='SUCCESS'||evidence.length>0;
  return Object.freeze({valid:valid&&successEvidencePresent,structuralValid:valid,chronologyValid,evidenceValid,guardValid,successEvidencePresent,result:resultKnown?receipt.result:null,stepId:valid?receipt.stepId:null,completedPrefixStateFingerprint:guardValid?receipt.preMutationGuard.completedPrefixStateFingerprint:null,externallyVerified:false,advancesCompletedPrefix:false});
}

export function buildRc1TechnicalMutationReceipt({
  plan,
  authorization,
  guardDecision,
  result,
  executorLabel,
  summary,
  evidenceRefs=[],
  startedAt,
  completedAt=new Date().toISOString(),
  receiptId=null,
}){
  const planInspection=verifyRc1PromotionExecutionPlan(plan);
  const authorizationInspection=inspectRc1TechnicalExecutionAuthorization(authorization,plan);
  assert(planInspection.valid,'Promotion Execution Plan is invalid or fingerprint-mismatched.');
  assert(authorizationInspection.valid,'Technical Execution Authorization is invalid for this plan.');
  assert(guardDecision?.version===RC1_PRE_MUTATION_GUARD_VERSION,'Pre-Mutation Guard decision version is invalid; Guard V2 is required.');
  assert(guardDecision?.guardFingerprint===computeRc1PreMutationGuardFingerprint(guardDecision),'Pre-Mutation Guard fingerprint is invalid.');
  assert(guardDecision?.decision==='ALLOW'&&guardDecision?.code==='AUTHORIZED_NEXT_STEP','Mutation receipt requires an ALLOW / AUTHORIZED_NEXT_STEP guard decision.');
  assert(guardDecision?.planFingerprint===plan.planFingerprint,'Guard decision belongs to another promotion plan fingerprint.');
  assert(guardDecision?.authorizationId===authorization.authorizationId,'Guard decision belongs to another technical authorization record.');
  assert(typeof guardDecision?.stepId==='string'&&guardDecision.stepId.length>0,'Guard decision must identify the authorized step.');
  assert(guardDecision.expectedNextStepId===guardDecision.stepId,'Guard decision is not bound to the exact next state step.');
  assert(/^[0-9a-f]{64}$/u.test(guardDecision.completedPrefixStateFingerprint??''),'Guard decision must bind a valid Completed Prefix State fingerprint.');
  assert(guardDecision.sourceStackPlanVersion===plan.sourceStack?.planVersion,'Guard decision Completed Prefix State belongs to another Stack Landing version.');
  assert(authorization.authorizedStepIds.includes(guardDecision.stepId),'Guard step is not listed in the technical authorization record.');
  assert(RECEIPT_RESULTS.includes(result),'Unsupported mutation result.');

  const executor=clean(executorLabel,128);
  const note=clean(summary,4000);
  assert(executor.length>=2,'Executor label must contain at least 2 characters.');
  assert(note.length>=5,'Receipt summary must contain at least 5 characters.');
  const startedMs=timestampMs(startedAt);
  const completedMs=timestampMs(completedAt);
  assert(startedMs!==null,'startedAt must be a valid timestamp from the external/manual execution context.');
  assert(completedMs!==null,'completedAt must be a valid timestamp.');
  assert(completedMs>=startedMs,'completedAt cannot be earlier than startedAt.');
  const evidence=normalizeEvidence(evidenceRefs);
  if(result==='SUCCESS')assert(evidence.length>0,'SUCCESS receipt requires at least one external evidence reference.');

  const id=clean(receiptId,128)||`HOC-MUTATION-RECEIPT-${String(completedAt).replace(/[^0-9A-Za-z]/g,'').slice(0,24)}`;
  const receipt=Object.freeze({
    version:RC1_TECHNICAL_MUTATION_RECEIPT_VERSION,
    releaseId:RC1_RELEASE_ID,
    receiptId:id,
    stepId:guardDecision.stepId,
    result,
    startedAt:String(startedAt),
    completedAt:String(completedAt),
    executorLabel:executor,
    summary:note,
    sourcePlan:Object.freeze({version:plan.version,planFingerprint:plan.planFingerprint,sourceStackPlanVersion:plan.sourceStack.planVersion}),
    sourceAuthorization:Object.freeze({version:authorization.version,authorizationId:authorization.authorizationId,planFingerprint:authorization.sourcePlan.planFingerprint}),
    preMutationGuard:Object.freeze({
      version:guardDecision.version,
      releaseId:guardDecision.releaseId,
      decision:guardDecision.decision,
      code:guardDecision.code,
      stepId:guardDecision.stepId,
      expectedNextStepId:guardDecision.expectedNextStepId,
      completedCount:guardDecision.completedCount,
      completedPrefixStateFingerprint:guardDecision.completedPrefixStateFingerprint,
      sourceStackPlanVersion:guardDecision.sourceStackPlanVersion,
      planFingerprint:guardDecision.planFingerprint,
      authorizationId:guardDecision.authorizationId,
      detail:guardDecision.detail,
      governance:Object.freeze({...guardDecision.governance}),
      guardFingerprint:guardDecision.guardFingerprint,
    }),
    evidenceRefs:Object.freeze(evidence),
    verification:Object.freeze({status:'UNVERIFIED_EXTERNAL_RESULT',externalEvidenceVerified:false,note:'This receipt records an externally/manual reported outcome. Evidence references have not been independently verified by this recorder.'}),
    governance:Object.freeze({executesAction:false,advancesCompletedPrefix:false,automaticPromotion:false,promotesHnkCanon:false,authority:'MUTATION_RECEIPT_RECORD_NOT_EXECUTION_PROOF'}),
  });
  const inspection=inspectRc1TechnicalMutationReceipt(receipt,{plan,authorization});
  assert(inspection.valid,'Generated mutation receipt failed self-validation.');
  return receipt;
}
