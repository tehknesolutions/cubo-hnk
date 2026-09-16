export declare const RC1_PROMOTION_READINESS_VERSION:'HOC-RC1-PROMOTION-READINESS/V1';
export declare const RC1_RELEASE_ID:'HOC-V1.0-RC1';
export declare const RC1_LEDGER_VERSION:'HOC-RC1-EVIDENCE-LEDGER/V1';
export declare const REQUIRED_PROMOTION_GATES:readonly string[];
export declare const SUPPLEMENTAL_GATES:readonly string[];
export declare const HUMAN_GATE:'humanPromotion';

export interface Rc1ReadinessGate{readonly id:string;readonly label:string;readonly status:'PASS'|'PENDING'|'BLOCKED';readonly detail:string;readonly evidenceCount:number;}
export interface Rc1PromotionReadiness{
  readonly version:typeof RC1_PROMOTION_READINESS_VERSION;
  readonly releaseId:typeof RC1_RELEASE_ID;
  readonly status:'INVALID_LEDGER'|'BLOCKED'|'EVIDENCE_INCOMPLETE'|'READY_FOR_HUMAN_REVIEW';
  readonly readyForHumanReview:boolean;
  readonly sourceLedgerValid:boolean;
  readonly required:Readonly<{total:number;pass:number;pending:number;blocked:number;missing:number}>;
  readonly blockers:readonly Rc1ReadinessGate[];
  readonly pendingRequirements:readonly Rc1ReadinessGate[];
  readonly missingRequirements:readonly string[];
  readonly supplemental:readonly Rc1ReadinessGate[];
  readonly humanDecision:Rc1ReadinessGate|null;
  readonly nextActions:readonly string[];
  readonly governance:Readonly<{
    automaticPromotion:false;
    mergeAuthorized:false;
    stablePromotionAuthorized:false;
    hnkCanonPromotionAuthorized:false;
    authority:'READINESS_ASSESSMENT_NOT_PROMOTION_AUTHORITY';
  }>;
}

export declare function evaluateRc1PromotionReadiness(ledgerReport:unknown):Rc1PromotionReadiness;
