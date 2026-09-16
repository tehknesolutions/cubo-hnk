export declare const RC1_HUMAN_DECISION_VERSION:'HOC-RC1-HUMAN-PROMOTION-DECISION/V1';
export declare const RC1_READINESS_VERSION:'HOC-RC1-PROMOTION-READINESS/V1';
export declare const RC1_RELEASE_ID:'HOC-V1.0-RC1';
export declare const HUMAN_DECISIONS:readonly ['APPROVE_V1_0','DEFER','REJECT'];

export interface Rc1ReadinessInspection{
  readonly valid:boolean;
  readonly status:string|null;
  readonly requiredMatrixReady:boolean;
  readonly approveAllowed:boolean;
  readonly releaseId:string|null;
  readonly readinessVersion:string|null;
}

export interface Rc1HumanDecisionInspection{
  readonly valid:boolean;
  readonly decision:'APPROVE_V1_0'|'DEFER'|'REJECT'|null;
  readonly approvalReady:boolean;
  readonly recordId:string|null;
  readonly releaseId:string|null;
}

export interface Rc1HumanPromotionDecisionRecord{
  readonly version:typeof RC1_HUMAN_DECISION_VERSION;
  readonly releaseId:typeof RC1_RELEASE_ID;
  readonly recordId:string;
  readonly recordedAt:string;
  readonly decision:'APPROVE_V1_0'|'DEFER'|'REJECT';
  readonly reviewerLabel:string;
  readonly rationale:string;
  readonly sourceReadiness:Readonly<{evidenceKind:string;generatedAt:string|null;status:string;readyForHumanReview:boolean;required:unknown}>;
  readonly acknowledgement:Readonly<{reviewedPromotionReadiness:true;understandsNoAutomaticMerge:true;understandsNoAutomaticDeployment:true;understandsHnkCanonRemainsSeparate:true}>;
  readonly governance:Readonly<{executesMerge:false;executesDeployment:false;changesPackageVersion:false;promotesHnkCanon:false;automaticPromotion:false;authority:'HUMAN_DECISION_RECORD_NOT_EXECUTION_AUTHORITY'}>;
}

export declare function inspectRc1ReadinessArtifact(artifact:unknown):Rc1ReadinessInspection;
export declare function inspectRc1HumanPromotionDecisionRecord(record:unknown):Rc1HumanDecisionInspection;
export declare function buildRc1HumanPromotionDecision(input:{artifact:unknown;decision:'APPROVE_V1_0'|'DEFER'|'REJECT';reviewerLabel:string;reason:string;acknowledged:boolean;recordedAt?:string;recordId?:string|null}):Rc1HumanPromotionDecisionRecord;
