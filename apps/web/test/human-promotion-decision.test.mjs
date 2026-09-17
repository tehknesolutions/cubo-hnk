import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRc1HumanPromotionDecision,inspectRc1ReadinessArtifact,RC1_HUMAN_DECISION_VERSION} from '../app/oraculum/qa/readiness/human-decision.mjs';

const RELEASE='HOC-V1.0-RC1';
const READINESS='HOC-RC1-PROMOTION-READINESS/V1';
const safeGovernance={automaticPromotion:false,mergeAuthorized:false,stablePromotionAuthorized:false,hnkCanonPromotionAuthorized:false};

function artifact(status='READY_FOR_HUMAN_REVIEW',ready=status==='READY_FOR_HUMAN_REVIEW'){
  return {
    evidenceKind:READINESS,
    generatedAt:'2026-09-16T12:00:00.000Z',
    releaseId:RELEASE,
    governance:{...safeGovernance,cryptographicSignature:false},
    assessment:{
      version:READINESS,
      releaseId:RELEASE,
      status,
      readyForHumanReview:ready,
      sourceLedgerValid:true,
      required:{total:9,pass:ready?9:8,pending:ready?0:1,blocked:0,missing:0,invalid:0},
      governance:{...safeGovernance,authority:'READINESS_ASSESSMENT_NOT_PROMOTION_AUTHORITY'},
    },
  };
}

function build(overrides={}){
  return buildRc1HumanPromotionDecision({artifact:artifact(),decision:'APPROVE_V1_0',reviewerLabel:'Release Reviewer',reason:'Todos os gates obrigatórios foram revisados.',acknowledged:true,recordedAt:'2026-09-16T12:34:56.789Z',recordId:'HOC-DECISION-TEST-001',...overrides});
}

test('readiness inspection only enables approval for coherent READY_FOR_HUMAN_REVIEW',()=>{
  const ready=inspectRc1ReadinessArtifact(artifact());
  assert.equal(ready.valid,true);
  assert.equal(ready.requiredMatrixReady,true);
  assert.equal(ready.approveAllowed,true);
  assert.equal(inspectRc1ReadinessArtifact(artifact('EVIDENCE_INCOMPLETE',false)).approveAllowed,false);
  assert.equal(inspectRc1ReadinessArtifact({...artifact(),releaseId:'OTHER'}).valid,false);
});

test('APPROVE_V1_0 is rejected unless readiness is ready',()=>{
  assert.throws(()=>build({artifact:artifact('BLOCKED',false)}),/requires READY_FOR_HUMAN_REVIEW/);
  assert.throws(()=>build({artifact:artifact('EVIDENCE_INCOMPLETE',false)}),/requires READY_FOR_HUMAN_REVIEW/);
});

test('changing only the READY status cannot bypass an incomplete mandatory gate matrix',()=>{
  const forged=artifact();
  forged.assessment.required={total:9,pass:8,pending:1,blocked:0,missing:0,invalid:0};
  const inspection=inspectRc1ReadinessArtifact(forged);
  assert.equal(inspection.valid,true);
  assert.equal(inspection.requiredMatrixReady,false);
  assert.equal(inspection.approveAllowed,false);
  assert.throws(()=>build({artifact:forged}),/complete 9\/9 mandatory gate matrix/);
});

test('DEFER and REJECT can record a valid non-ready package without promoting it',()=>{
  for(const decision of ['DEFER','REJECT']){
    const record=build({artifact:artifact('EVIDENCE_INCOMPLETE',false),decision});
    assert.equal(record.decision,decision);
    assert.equal(record.sourceReadiness.status,'EVIDENCE_INCOMPLETE');
    assert.equal(record.governance.executesMerge,false);
    assert.equal(record.governance.executesDeployment,false);
  }
});

test('human acknowledgement, reviewer label and rationale are mandatory',()=>{
  assert.throws(()=>build({acknowledged:false}),/acknowledgement/i);
  assert.throws(()=>build({reviewerLabel:'X'}),/Reviewer label/);
  assert.throws(()=>build({reason:'no'}),/rationale/i);
});

test('approved record is an audit record only and never execution authority',()=>{
  const record=build();
  assert.equal(record.version,RC1_HUMAN_DECISION_VERSION);
  assert.equal(record.releaseId,RELEASE);
  assert.equal(record.decision,'APPROVE_V1_0');
  assert.equal(record.recordId,'HOC-DECISION-TEST-001');
  assert.equal(record.governance.executesMerge,false);
  assert.equal(record.governance.executesDeployment,false);
  assert.equal(record.governance.changesPackageVersion,false);
  assert.equal(record.governance.promotesHnkCanon,false);
  assert.equal(record.governance.automaticPromotion,false);
  assert.equal(record.governance.authority,'HUMAN_DECISION_RECORD_NOT_EXECUTION_AUTHORITY');
  assert.equal(record.acknowledgement.reviewedPromotionReadiness,true);
});

test('foreign, unsafe-governance or malformed readiness cannot produce a decision record',()=>{
  assert.throws(()=>build({artifact:null}),/invalid or belongs to another release/i);
  assert.throws(()=>build({artifact:{...artifact(),evidenceKind:'OTHER'}}),/invalid or belongs to another release/i);
  assert.throws(()=>build({artifact:{...artifact(),governance:{...safeGovernance,automaticPromotion:true}}}),/invalid or belongs to another release/i);
});
