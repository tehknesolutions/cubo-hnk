export declare const RC1_EVIDENCE_LEDGER_VERSION:'HOC-RC1-EVIDENCE-LEDGER/V1';
export declare const RC1_RELEASE_ID:'HOC-V1.0-RC1';
export declare const EVIDENCE_KINDS:Readonly<{
  RUNTIME:'HOC-RC1-RUNTIME-QA-EVIDENCE/V1';
  INDEPENDENT:'HOC-RC1-INDEPENDENT-VALIDATION-EVIDENCE/V1';
  PHYSICAL:'HOC-RC1-PHYSICAL-QA-EVIDENCE/V1';
  CAMERA:'HOC-RC1-CAMERA-QA-EVIDENCE/V1';
  MANIFEST_VERIFY:'HOC-RC1-MANIFEST-VERIFY-EVIDENCE/V1';
}>;
export interface Rc1EvidenceGate{readonly id:string;readonly label:string;readonly status:'PASS'|'PENDING'|'BLOCKED';readonly detail:string;readonly evidenceCount:number;}
export interface Rc1EvidenceLedgerReport{
  readonly version:typeof RC1_EVIDENCE_LEDGER_VERSION;
  readonly releaseId:typeof RC1_RELEASE_ID;
  readonly overall:'PASS'|'PENDING'|'BLOCKED';
  readonly counts:Readonly<{pass:number;pending:number;blocked:number}>;
  readonly importedRecords:number;
  readonly acceptedRecords:number;
  readonly crossDevice:Readonly<{status:'PASS'|'PENDING';count:number;sessionId:string|null;checksum:string|null;deviceLabels:readonly string[]}>;
  readonly gates:readonly Rc1EvidenceGate[];
}
export declare function classifyRc1Evidence(record:unknown):Readonly<{kind:string;accepted:boolean;passed?:boolean;reason?:string}>;
export declare function evaluateRc1Evidence(records?:readonly unknown[]):Rc1EvidenceLedgerReport;
