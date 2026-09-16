import {verifyRc1PromotionExecutionPlan} from './rc1-promotion-execution-plan.mjs';
import {inspectRc1TechnicalExecutionAuthorization} from './rc1-technical-execution-authorization.mjs';

export const RC1_TECHNICAL_MUTATION_RECEIPT_VERSION='HOC-RC1-TECHNICAL-MUTATION-RECEIPT/V1';
export const RC1_RELEASE_ID='HOC-V1.0-RC1';
export const RECEIPT_RESULTS=Object.freeze(['SUCCESS','FAILED','CANCELLED']);

function assert(condition,message){if(!condition)throw new Error(message);}
function clean(value,max){return typeof value==='string'?value.trim().replace(/[\u0000-\u001f]/gu,' ').slice(0,max):'';}
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

export function inspectRc1TechnicalMutationReceipt(receipt,{plan,authorization}={}){
  const planInspection=verifyRc1PromotionExecutionPlan(plan);
  const authorizationInspection=inspectRc1TechnicalExecutionAuthorization(authorization,plan);
  const planStepIds=planInspection.valid?new Set(plan.steps.map(step=>step.id)):new Set();
  const evidence=Array.isArray(receipt?.evidenceRefs)?receipt.evidenceRefs:[];
  const resultKnown=RECEIPT_RESULTS.includes(receipt?.result);
  const valid=Boolean(
    planInspection.valid
    &&authorizationInspection.valid
    &&receipt
    &&receipt.version===RC1_TECHNICAL_MUTATION_RECEIPT_VERSION
    &&receipt.releaseId===RC1_RELEASE_ID
    &&typeof receipt.receiptId==='string'&&receipt.receiptId.length>0
    &&typeof receipt.startedAt==='string'&&receipt.startedAt.length>0
    &&typeof receipt.completedAt==='string'&&receipt.completedAt.length>0
    &&typeof receipt.executorLabel==='string'&&receipt.executorLabel.trim().length>=2
    &&typeof receipt.summary==='string'&&receipt.summary.trim().length>=5
    &&resultKnown
    &&planStepIds.has(receipt.stepId)
    &&authorization.authorizedStepIds.includes(receipt.stepId)
    &&receipt.sourcePlan?.planFingerprint===plan.planFingerprint
    &&receipt.sourceAuthorization?.authorizationId===authorization.authorizationId
    &&receipt.sourceAuthorization?.planFingerprint===plan.planFingerprint
    &&receipt.preMutationGuard?.version==='HOC-RC1-PRE-MUTATION-GUARD/V1'
    &&receipt.preMutationGuard?.decision==='ALLOW'
    &&receipt.preMutationGuard?.code==='AUTHORIZED_NEXT_STEP'
    &&receipt.preMutationGuard?.stepId===receipt.stepId
    &&receipt.preMutationGuard?.planFingerprint===plan.planFingerprint
    &&receipt.preMutationGuard?.authorizationId===authorization.authorizationId
    &&receipt.verification?.externalEvidenceVerified===false
    &&receipt.verification?.status==='UNVERIFIED_EXTERNAL_RESULT'
    &&receipt.governance?.executesAction===false
    &&receipt.governance?.advancesCompletedPrefix===false
    &&receipt.governance?.automaticPromotion===false
    &&receipt.governance?.promotesHnkCanon===false
    &&receipt.governance?.authority==='MUTATION_RECEIPT_RECORD_NOT_EXECUTION_PROOF'
  );
  const successEvidencePresent=receipt?.result!=='SUCCESS'||evidence.length>0;
  return Object.freeze({
    valid:valid&&successEvidencePresent,
    structuralValid:valid,
    successEvidencePresent,
    result:resultKnown?receipt.result:null,
    stepId:valid?receipt.stepId:null,
    externallyVerified:false,
    advancesCompletedPrefix:false,
  });
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
  assert(guardDecision?.version==='HOC-RC1-PRE-MUTATION-GUARD/V1','Pre-Mutation Guard decision version is invalid.');
  assert(guardDecision?.decision==='ALLOW'&&guardDecision?.code==='AUTHORIZED_NEXT_STEP','Mutation receipt requires an ALLOW / AUTHORIZED_NEXT_STEP guard decision.');
  assert(guardDecision?.planFingerprint===plan.planFingerprint,'Guard decision belongs to another promotion plan fingerprint.');
  assert(guardDecision?.authorizationId===authorization.authorizationId,'Guard decision belongs to another technical authorization record.');
  assert(typeof guardDecision?.stepId==='string'&&guardDecision.stepId.length>0,'Guard decision must identify the authorized step.');
  assert(authorization.authorizedStepIds.includes(guardDecision.stepId),'Guard step is not listed in the technical authorization record.');
  assert(RECEIPT_RESULTS.includes(result),'Unsupported mutation result.');

  const executor=clean(executorLabel,128);
  const note=clean(summary,4000);
  assert(executor.length>=2,'Executor label must contain at least 2 characters.');
  assert(note.length>=5,'Receipt summary must contain at least 5 characters.');
  assert(typeof startedAt==='string'&&startedAt.length>0,'startedAt is required from the external/manual execution context.');
  assert(typeof completedAt==='string'&&completedAt.length>0,'completedAt is required.');
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
      decision:guardDecision.decision,
      code:guardDecision.code,
      stepId:guardDecision.stepId,
      completedCount:guardDecision.completedCount,
      planFingerprint:guardDecision.planFingerprint,
      authorizationId:guardDecision.authorizationId,
    }),
    evidenceRefs:Object.freeze(evidence),
    verification:Object.freeze({
      status:'UNVERIFIED_EXTERNAL_RESULT',
      externalEvidenceVerified:false,
      note:'This receipt records an externally/manual reported outcome. Evidence references have not been independently verified by this recorder.',
    }),
    governance:Object.freeze({
      executesAction:false,
      advancesCompletedPrefix:false,
      automaticPromotion:false,
      promotesHnkCanon:false,
      authority:'MUTATION_RECEIPT_RECORD_NOT_EXECUTION_PROOF',
    }),
  });
  const inspection=inspectRc1TechnicalMutationReceipt(receipt,{plan,authorization});
  assert(inspection.valid,'Generated mutation receipt failed self-validation.');
  return receipt;
}
