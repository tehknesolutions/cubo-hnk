import test from 'node:test';
import assert from 'node:assert/strict';
import {RC1_PROMOTION_READINESS_VERSION,evaluateRc1PromotionReadiness} from '../app/oraculum/qa/evidence/promotion-readiness.mjs';

const RELEASE='HOC-V1.0-RC1';
const LEDGER='HOC-RC1-EVIDENCE-LEDGER/V1';
const required=[
  'runtimeSelfTest','deploymentVerification','physicalState','physicalRitual','cameraDevice','crossDeviceManifest','productionHardeningSource','ciBuild','manualFinalDocs',
];

function gate(id,status='PASS'){return {id,label:id,status,detail:`${id} detail`,evidenceCount:status==='PASS'?1:0};}
function ledger(overrides={}){
  const statuses=overrides.statuses??{};
  const gates=required.map(id=>gate(id,statuses[id]??'PASS'));
  gates.push(gate('independentValidation',statuses.independentValidation??'PENDING'));
  gates.push(gate('humanPromotion',statuses.humanPromotion??'PENDING'));
  return {version:LEDGER,releaseId:RELEASE,overall:'PENDING',counts:{pass:0,pending:0,blocked:0},importedRecords:0,acceptedRecords:0,crossDevice:{status:'PENDING',count:0,sessionId:null,checksum:null,deviceLabels:[]},gates};
}

test('invalid or foreign ledger never reaches readiness',()=>{
  const missing=evaluateRc1PromotionReadiness(null);
  assert.equal(missing.version,RC1_PROMOTION_READINESS_VERSION);
  assert.equal(missing.status,'INVALID_LEDGER');
  assert.equal(missing.readyForHumanReview,false);
  assert.equal(missing.governance.automaticPromotion,false);

  const foreign=evaluateRc1PromotionReadiness({...ledger(),releaseId:'OTHER'});
  assert.equal(foreign.status,'INVALID_LEDGER');
});

test('required BLOCKED gate dominates readiness',()=>{
  const report=evaluateRc1PromotionReadiness(ledger({statuses:{ciBuild:'BLOCKED',physicalState:'PENDING'}}));
  assert.equal(report.status,'BLOCKED');
  assert.equal(report.readyForHumanReview,false);
  assert.equal(report.required.blocked,1);
  assert.equal(report.required.pending,1);
  assert.deepEqual(report.blockers.map(item=>item.id),['ciBuild']);
});

test('required PENDING gates produce evidence incomplete when no blockers exist',()=>{
  const report=evaluateRc1PromotionReadiness(ledger({statuses:{cameraDevice:'PENDING',crossDeviceManifest:'PENDING'}}));
  assert.equal(report.status,'EVIDENCE_INCOMPLETE');
  assert.equal(report.readyForHumanReview,false);
  assert.equal(report.required.blocked,0);
  assert.equal(report.required.pending,2);
});

test('supplemental Independent Executor does not block human review readiness',()=>{
  const report=evaluateRc1PromotionReadiness(ledger({statuses:{independentValidation:'PENDING',humanPromotion:'PENDING'}}));
  assert.equal(report.status,'READY_FOR_HUMAN_REVIEW');
  assert.equal(report.readyForHumanReview,true);
  assert.equal(report.required.pass,required.length);
  assert.equal(report.supplemental[0].id,'independentValidation');
  assert.equal(report.supplemental[0].status,'PENDING');
  assert.equal(report.humanDecision.status,'PENDING');
});

test('human promotion remains outside automatic readiness authority',()=>{
  const report=evaluateRc1PromotionReadiness(ledger());
  assert.equal(report.status,'READY_FOR_HUMAN_REVIEW');
  assert.equal(report.governance.automaticPromotion,false);
  assert.equal(report.governance.mergeAuthorized,false);
  assert.equal(report.governance.stablePromotionAuthorized,false);
  assert.equal(report.governance.hnkCanonPromotionAuthorized,false);
  assert.equal(report.governance.authority,'READINESS_ASSESSMENT_NOT_PROMOTION_AUTHORITY');
  assert.match(report.nextActions.join('\n'),/decisão humana explícita/i);
});

test('missing required gate invalidates the ledger for promotion purposes',()=>{
  const source=ledger();
  source.gates=source.gates.filter(item=>item.id!=='physicalRitual');
  const report=evaluateRc1PromotionReadiness(source);
  assert.equal(report.status,'INVALID_LEDGER');
  assert.deepEqual(report.missingRequirements,['physicalRitual']);
  assert.equal(report.readyForHumanReview,false);
});

test('unknown mandatory status fails closed instead of being ignored',()=>{
  const source=ledger();
  source.gates=source.gates.map(item=>item.id==='ciBuild'?{...item,status:'UNKNOWN'}:item);
  const report=evaluateRc1PromotionReadiness(source);
  assert.equal(report.status,'INVALID_LEDGER');
  assert.deepEqual(report.invalidRequirements,['ciBuild']);
  assert.equal(report.readyForHumanReview,false);
});

test('human decision gate is structurally required even though it is not a pre-human PASS gate',()=>{
  const source=ledger();
  source.gates=source.gates.filter(item=>item.id!=='humanPromotion');
  const report=evaluateRc1PromotionReadiness(source);
  assert.equal(report.status,'INVALID_LEDGER');
  assert.deepEqual(report.invalidRequirements,['humanPromotion']);
  assert.equal(report.humanDecision,null);
});
