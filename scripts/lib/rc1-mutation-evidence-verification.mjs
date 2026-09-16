import {createHash} from 'node:crypto';
import {inspectRc1TechnicalMutationReceipt} from './rc1-technical-mutation-receipt.mjs';

export const RC1_MUTATION_EVIDENCE_VERIFICATION_VERSION='HOC-RC1-TECHNICAL-MUTATION-EVIDENCE-VERIFICATION/V1';
export const RC1_RELEASE_ID='HOC-V1.0-RC1';
export const RC1_MUTATION_EVIDENCE_VERIFICATION_FINGERPRINT_VERSION='HOC-RC1-MUTATION-EVIDENCE-VERIFICATION-FINGERPRINT/V1';

function assert(condition,message){if(!condition)throw new Error(message);}
function clean(value,max){return typeof value==='string'?value.trim().replace(/[\u0000-\u001f]/gu,' ').slice(0,max):'';}
function stable(value){
  if(Array.isArray(value))return `[${value.map(stable).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function sha256(text){return createHash('sha256').update(text).digest('hex');}
function validTimestamp(value){return typeof value==='string'&&Number.isFinite(Date.parse(value));}

function verificationCore(record){
  return {
    version:record.version,
    releaseId:record.releaseId,
    verificationId:record.verificationId,
    verifiedAt:record.verifiedAt,
    verifierLabel:record.verifierLabel,
    method:record.method,
    sourceReceipt:record.sourceReceipt,
    observations:record.observations,
    result:record.result,
    acknowledgement:record.acknowledgement,
    governance:record.governance,
  };
}

export function computeRc1MutationEvidenceVerificationFingerprint(record){
  return sha256(`${RC1_MUTATION_EVIDENCE_VERIFICATION_FINGERPRINT_VERSION}|${stable(verificationCore(record))}`);
}

function normalizeObservation(item,index,receipt){
  assert(Number.isInteger(item?.evidenceIndex),'Observation evidenceIndex must be an integer.');
  const ref=receipt.evidenceRefs[item.evidenceIndex];
  assert(ref,`Observation ${index} references unknown evidence index.`);
  const kind=clean(item.kind,64);
  const value=clean(item.value,2048);
  const observedSha256=clean(item.observedSha256,64).toLowerCase();
  const observedAt=String(item.observedAt??'');
  assert(kind===ref.kind,`Observation ${index} kind does not match receipt evidence.`);
  assert(value===ref.value,`Observation ${index} value does not match receipt evidence.`);
  assert(/^[0-9a-f]{64}$/u.test(observedSha256),`Observation ${index} observedSha256 must be 64 lowercase hex characters.`);
  assert(validTimestamp(observedAt),`Observation ${index} observedAt must be a valid timestamp.`);
  assert(Date.parse(observedAt)>=Date.parse(receipt.completedAt),`Observation ${index} cannot predate receipt completion.`);
  if(ref.sha256)assert(observedSha256===ref.sha256,`Observation ${index} hash does not match receipt evidence sha256.`);
  assert(item.verified===true,`Observation ${index} must be explicitly verified.`);
  return Object.freeze({evidenceIndex:item.evidenceIndex,kind,value,expectedSha256:ref.sha256??null,observedSha256,observedAt,verified:true});
}

export function inspectRc1MutationEvidenceVerification(record,{plan,authorization,receipt}={}){
  const receiptInspection=inspectRc1TechnicalMutationReceipt(receipt,{plan,authorization});
  const observations=Array.isArray(record?.observations)?record.observations:[];
  const expectedCount=Array.isArray(receipt?.evidenceRefs)?receipt.evidenceRefs.length:0;
  const indexes=observations.map(item=>item?.evidenceIndex);
  const completeIndexes=expectedCount>0&&indexes.length===expectedCount&&new Set(indexes).size===expectedCount&&indexes.every((value,index)=>value===index);
  const observationsValid=completeIndexes&&observations.every((item,index)=>{
    const ref=receipt.evidenceRefs[index];
    return item?.evidenceIndex===index
      &&item?.kind===ref.kind
      &&item?.value===ref.value
      &&item?.verified===true
      &&/^[0-9a-f]{64}$/u.test(item?.observedSha256??'')
      &&validTimestamp(item?.observedAt)
      &&Date.parse(item.observedAt)>=Date.parse(receipt.completedAt)
      &&(!ref.sha256||item.observedSha256===ref.sha256);
  });
  const expectedFingerprint=record?computeRc1MutationEvidenceVerificationFingerprint(record):null;
  const fingerprintMatches=Boolean(record&&record.verificationFingerprint===expectedFingerprint);
  const valid=Boolean(
    receiptInspection.valid
    &&receipt?.result==='SUCCESS'
    &&record
    &&record.version===RC1_MUTATION_EVIDENCE_VERIFICATION_VERSION
    &&record.releaseId===RC1_RELEASE_ID
    &&typeof record.verificationId==='string'&&record.verificationId.length>0
    &&validTimestamp(record.verifiedAt)
    &&typeof record.verifierLabel==='string'&&record.verifierLabel.trim().length>=2
    &&typeof record.method==='string'&&record.method.trim().length>=3
    &&record.sourceReceipt?.receiptId===receipt.receiptId
    &&record.sourceReceipt?.stepId===receipt.stepId
    &&record.sourceReceipt?.planFingerprint===plan.planFingerprint
    &&record.sourceReceipt?.authorizationId===authorization.authorizationId
    &&observationsValid
    &&record.result?.status==='VERIFIED_EXTERNAL_EVIDENCE'
    &&record.result?.evidenceCount===expectedCount
    &&record.result?.eligibleForCompletedPrefix===true
    &&record.acknowledgement?.reviewedAllReceiptEvidence===true
    &&record.acknowledgement?.understandsNoActionExecution===true
    &&record.acknowledgement?.understandsPrefixMutationIsSeparate===true
    &&record.acknowledgement?.understandsHnkCanonIsSeparate===true
    &&record.governance?.executesAction===false
    &&record.governance?.mutatesCompletedPrefix===false
    &&record.governance?.automaticPromotion===false
    &&record.governance?.promotesHnkCanon===false
    &&record.governance?.authority==='MUTATION_EVIDENCE_VERIFICATION_RECORD_NOT_STATE_MUTATOR'
    &&fingerprintMatches
  );
  return Object.freeze({valid,receiptValid:receiptInspection.valid,observationsValid,fingerprintMatches,expectedFingerprint,status:valid?'VERIFIED_EXTERNAL_EVIDENCE':'INVALID',eligibleForCompletedPrefix:valid});
}

export function buildRc1MutationEvidenceVerification({
  plan,
  authorization,
  receipt,
  observations,
  verifierLabel,
  method,
  acknowledged,
  verifiedAt=new Date().toISOString(),
  verificationId=null,
}){
  const receiptInspection=inspectRc1TechnicalMutationReceipt(receipt,{plan,authorization});
  assert(receiptInspection.valid,'Technical Mutation Receipt is invalid for this plan/authorization.');
  assert(receipt.result==='SUCCESS','Only SUCCESS receipts can become eligible for completed-prefix advancement.');
  assert(Array.isArray(receipt.evidenceRefs)&&receipt.evidenceRefs.length>0,'SUCCESS receipt has no evidence references.');
  assert(Array.isArray(observations)&&observations.length===receipt.evidenceRefs.length,'Exactly one verification observation is required for each receipt evidence reference.');
  assert(acknowledged===true,'Evidence verification acknowledgement is required.');
  assert(validTimestamp(verifiedAt),'verifiedAt must be a valid timestamp.');
  assert(Date.parse(verifiedAt)>=Date.parse(receipt.completedAt),'verifiedAt cannot predate receipt completion.');

  const verifier=clean(verifierLabel,128);
  const verificationMethod=clean(method,256);
  assert(verifier.length>=2,'Verifier label must contain at least 2 characters.');
  assert(verificationMethod.length>=3,'Verification method must contain at least 3 characters.');

  const normalized=[...observations].sort((a,b)=>a.evidenceIndex-b.evidenceIndex).map((item,index)=>normalizeObservation(item,index,receipt));
  assert(normalized.every((item,index)=>item.evidenceIndex===index),'Evidence observations must cover every receipt evidence index exactly once.');

  const id=clean(verificationId,128)||`HOC-MUTATION-EVIDENCE-VERIFY-${String(verifiedAt).replace(/[^0-9A-Za-z]/g,'').slice(0,24)}`;
  const draft={
    version:RC1_MUTATION_EVIDENCE_VERIFICATION_VERSION,
    releaseId:RC1_RELEASE_ID,
    verificationId:id,
    verifiedAt:String(verifiedAt),
    verifierLabel:verifier,
    method:verificationMethod,
    sourceReceipt:Object.freeze({receiptId:receipt.receiptId,stepId:receipt.stepId,planFingerprint:plan.planFingerprint,authorizationId:authorization.authorizationId}),
    observations:Object.freeze(normalized),
    result:Object.freeze({status:'VERIFIED_EXTERNAL_EVIDENCE',evidenceCount:normalized.length,eligibleForCompletedPrefix:true}),
    acknowledgement:Object.freeze({reviewedAllReceiptEvidence:true,understandsNoActionExecution:true,understandsPrefixMutationIsSeparate:true,understandsHnkCanonIsSeparate:true}),
    governance:Object.freeze({executesAction:false,mutatesCompletedPrefix:false,automaticPromotion:false,promotesHnkCanon:false,authority:'MUTATION_EVIDENCE_VERIFICATION_RECORD_NOT_STATE_MUTATOR'}),
  };
  const verificationFingerprint=computeRc1MutationEvidenceVerificationFingerprint(draft);
  const record=Object.freeze({...draft,verificationFingerprint});
  const inspection=inspectRc1MutationEvidenceVerification(record,{plan,authorization,receipt});
  assert(inspection.valid,'Generated mutation evidence verification failed self-validation.');
  return record;
}
