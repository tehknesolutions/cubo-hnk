export const RC1_HUMAN_DECISION_VERSION='HOC-RC1-HUMAN-PROMOTION-DECISION/V1';
export const RC1_READINESS_VERSION='HOC-RC1-PROMOTION-READINESS/V1';
export const RC1_RELEASE_ID='HOC-V1.0-RC1';
export const HUMAN_DECISIONS=Object.freeze(['APPROVE_V1_0','DEFER','REJECT']);

function assert(condition,message){if(!condition)throw new Error(message);}
function clean(value,max){return typeof value==='string'?value.trim().replace(/[\u0000-\u001f]/gu,' ').slice(0,max):'';}

export function inspectRc1ReadinessArtifact(artifact){
  const valid=Boolean(
    artifact
    &&artifact.evidenceKind===RC1_READINESS_VERSION
    &&artifact.releaseId===RC1_RELEASE_ID
    &&artifact.assessment?.version===RC1_READINESS_VERSION
    &&artifact.assessment?.releaseId===RC1_RELEASE_ID
    &&artifact.assessment?.sourceLedgerValid===true
    &&artifact.assessment?.governance?.automaticPromotion===false
    &&artifact.assessment?.governance?.mergeAuthorized===false
    &&artifact.assessment?.governance?.stablePromotionAuthorized===false
    &&artifact.assessment?.governance?.hnkCanonPromotionAuthorized===false
    &&artifact.governance?.automaticPromotion===false
    &&artifact.governance?.mergeAuthorized===false
    &&artifact.governance?.stablePromotionAuthorized===false
    &&artifact.governance?.hnkCanonPromotionAuthorized===false,
  );
  const status=valid?artifact.assessment.status:null;
  const required=valid?artifact.assessment.required:null;
  const requiredMatrixReady=Boolean(
    required
    &&required.total===9
    &&required.pass===9
    &&required.pending===0
    &&required.blocked===0
    &&required.missing===0
    &&required.invalid===0,
  );
  return Object.freeze({
    valid,
    status,
    requiredMatrixReady,
    approveAllowed:valid&&status==='READY_FOR_HUMAN_REVIEW'&&artifact.assessment.readyForHumanReview===true&&requiredMatrixReady,
    releaseId:valid?artifact.releaseId:null,
    readinessVersion:valid?artifact.assessment.version:null,
  });
}

export function buildRc1HumanPromotionDecision({artifact,decision,reviewerLabel,reason,acknowledged,recordedAt=new Date().toISOString(),recordId=null}){
  const inspection=inspectRc1ReadinessArtifact(artifact);
  assert(inspection.valid,'Promotion Readiness artifact is invalid or belongs to another release.');
  assert(HUMAN_DECISIONS.includes(decision),'Unsupported human decision.');
  assert(acknowledged===true,'Human acknowledgement is required.');
  if(decision==='APPROVE_V1_0')assert(inspection.approveAllowed,'APPROVE_V1_0 requires READY_FOR_HUMAN_REVIEW with a complete 9/9 mandatory gate matrix.');

  const reviewer=clean(reviewerLabel,128);
  const rationale=clean(reason,4000);
  assert(reviewer.length>=2,'Reviewer label must contain at least 2 characters.');
  assert(rationale.length>=5,'Decision rationale must contain at least 5 characters.');

  const id=clean(recordId,128)||`HOC-DECISION-${String(recordedAt).replace(/[^0-9A-Za-z]/g,'').slice(0,24)}`;

  return Object.freeze({
    version:RC1_HUMAN_DECISION_VERSION,
    releaseId:RC1_RELEASE_ID,
    recordId:id,
    recordedAt:String(recordedAt),
    decision,
    reviewerLabel:reviewer,
    rationale,
    sourceReadiness:Object.freeze({
      evidenceKind:artifact.evidenceKind,
      generatedAt:artifact.generatedAt??null,
      status:artifact.assessment.status,
      readyForHumanReview:artifact.assessment.readyForHumanReview===true,
      required:artifact.assessment.required??null,
    }),
    acknowledgement:Object.freeze({
      reviewedPromotionReadiness:true,
      understandsNoAutomaticMerge:true,
      understandsNoAutomaticDeployment:true,
      understandsHnkCanonRemainsSeparate:true,
    }),
    governance:Object.freeze({
      executesMerge:false,
      executesDeployment:false,
      changesPackageVersion:false,
      promotesHnkCanon:false,
      automaticPromotion:false,
      authority:'HUMAN_DECISION_RECORD_NOT_EXECUTION_AUTHORITY',
    }),
  });
}
