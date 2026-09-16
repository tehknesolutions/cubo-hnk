export const RC1_PROMOTION_READINESS_VERSION='HOC-RC1-PROMOTION-READINESS/V1';
export const RC1_RELEASE_ID='HOC-V1.0-RC1';
export const RC1_LEDGER_VERSION='HOC-RC1-EVIDENCE-LEDGER/V1';

export const REQUIRED_PROMOTION_GATES=Object.freeze([
  'runtimeSelfTest',
  'deploymentVerification',
  'physicalState',
  'physicalRitual',
  'cameraDevice',
  'crossDeviceManifest',
  'productionHardeningSource',
  'ciBuild',
  'manualFinalDocs',
]);

export const SUPPLEMENTAL_GATES=Object.freeze(['independentValidation']);
export const HUMAN_GATE='humanPromotion';
const ALLOWED_STATUS=new Set(['PASS','PENDING','BLOCKED']);

function gateMap(report){return new Map((Array.isArray(report?.gates)?report.gates:[]).map(item=>[item?.id,item]));}
function compactGate(item){return Object.freeze({id:item.id,label:item.label,status:item.status,detail:item.detail,evidenceCount:item.evidenceCount??0});}
function baseGovernance(){return Object.freeze({automaticPromotion:false,mergeAuthorized:false,stablePromotionAuthorized:false,hnkCanonPromotionAuthorized:false,authority:'READINESS_ASSESSMENT_NOT_PROMOTION_AUTHORITY'});}

export function evaluateRc1PromotionReadiness(ledgerReport){
  const ledgerValid=Boolean(
    ledgerReport
    &&ledgerReport.version===RC1_LEDGER_VERSION
    &&ledgerReport.releaseId===RC1_RELEASE_ID
    &&Array.isArray(ledgerReport.gates),
  );

  if(!ledgerValid){
    return Object.freeze({
      version:RC1_PROMOTION_READINESS_VERSION,
      releaseId:RC1_RELEASE_ID,
      status:'INVALID_LEDGER',
      readyForHumanReview:false,
      sourceLedgerValid:false,
      required:Object.freeze({total:REQUIRED_PROMOTION_GATES.length,pass:0,pending:0,blocked:0,missing:REQUIRED_PROMOTION_GATES.length,invalid:0}),
      blockers:Object.freeze([]),
      pendingRequirements:Object.freeze([]),
      missingRequirements:Object.freeze([...REQUIRED_PROMOTION_GATES]),
      invalidRequirements:Object.freeze([]),
      supplemental:Object.freeze([]),
      humanDecision:null,
      nextActions:Object.freeze(['Importe um HOC-RC1-EVIDENCE-LEDGER/V1 válido da release HOC-V1.0-RC1.']),
      governance:baseGovernance(),
    });
  }

  const byId=gateMap(ledgerReport);
  const required=[];
  const missing=[];
  const invalid=[];
  for(const id of REQUIRED_PROMOTION_GATES){
    const item=byId.get(id);
    if(!item){missing.push(id);continue;}
    if(!ALLOWED_STATUS.has(item.status)){invalid.push(id);continue;}
    required.push(compactGate(item));
  }

  const humanSource=byId.get(HUMAN_GATE);
  const human=humanSource&&ALLOWED_STATUS.has(humanSource.status)?compactGate(humanSource):null;
  if(!human)invalid.push(HUMAN_GATE);

  const blockers=required.filter(item=>item.status==='BLOCKED');
  const pendingRequirements=required.filter(item=>item.status==='PENDING');
  const pass=required.filter(item=>item.status==='PASS');
  const supplemental=SUPPLEMENTAL_GATES.map(id=>byId.get(id)).filter(item=>item&&ALLOWED_STATUS.has(item.status)).map(compactGate);

  let status='READY_FOR_HUMAN_REVIEW';
  if(missing.length>0||invalid.length>0)status='INVALID_LEDGER';
  else if(blockers.length>0)status='BLOCKED';
  else if(pendingRequirements.length>0)status='EVIDENCE_INCOMPLETE';

  const readyForHumanReview=status==='READY_FOR_HUMAN_REVIEW';
  const nextActions=[];
  for(const item of blockers)nextActions.push(`Resolver blocker obrigatório: ${item.label} — ${item.detail}`);
  for(const item of pendingRequirements)nextActions.push(`Fechar evidência obrigatória: ${item.label} — ${item.detail}`);
  for(const id of missing)nextActions.push(`Restaurar gate obrigatório ausente no ledger: ${id}`);
  for(const id of invalid)nextActions.push(`Corrigir gate com estado inválido no ledger: ${id}`);
  if(readyForHumanReview)nextActions.push('Submeter o pacote completo à decisão humana explícita de promoção RC1 → V1.0.');
  if(supplemental.some(item=>item.status!=='PASS'))nextActions.push('Opcional: executar o Independent Executor como evidência suplementar; ele não substitui GitHub CI.');

  return Object.freeze({
    version:RC1_PROMOTION_READINESS_VERSION,
    releaseId:RC1_RELEASE_ID,
    status,
    readyForHumanReview,
    sourceLedgerValid:true,
    required:Object.freeze({total:REQUIRED_PROMOTION_GATES.length,pass:pass.length,pending:pendingRequirements.length,blocked:blockers.length,missing:missing.length,invalid:invalid.length}),
    blockers:Object.freeze(blockers),
    pendingRequirements:Object.freeze(pendingRequirements),
    missingRequirements:Object.freeze(missing),
    invalidRequirements:Object.freeze(invalid),
    supplemental:Object.freeze(supplemental),
    humanDecision:human,
    nextActions:Object.freeze(nextActions),
    governance:baseGovernance(),
  });
}
