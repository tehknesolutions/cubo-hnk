import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildRc1PromotionExecutionPlan} from '../../../scripts/lib/rc1-promotion-execution-plan.mjs';
import {buildRc1TechnicalExecutionAuthorization} from '../../../scripts/lib/rc1-technical-execution-authorization.mjs';
import {evaluateRc1PreMutationGuard} from '../../../scripts/lib/rc1-pre-mutation-guard.mjs';
import {buildRc1TechnicalMutationReceipt,inspectRc1TechnicalMutationReceipt,RC1_TECHNICAL_MUTATION_RECEIPT_VERSION} from '../../../scripts/lib/rc1-technical-mutation-receipt.mjs';

const stack=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/STACK_LANDING_PLAN.json',import.meta.url),'utf8'));
const cli=readFileSync(new URL('../../../scripts/build-rc1-technical-mutation-receipt.mjs',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../../../package.json',import.meta.url),'utf8'));

function approvedDecision(){return {version:'HOC-RC1-HUMAN-PROMOTION-DECISION/V1',releaseId:'HOC-V1.0-RC1',recordId:'HOC-DECISION-RECEIPT-TEST',recordedAt:'2026-09-16T15:00:00.000Z',decision:'APPROVE_V1_0',reviewerLabel:'Release Reviewer',rationale:'All mandatory readiness gates were reviewed and passed.',sourceReadiness:{evidenceKind:'HOC-RC1-PROMOTION-READINESS/V1',generatedAt:'2026-09-16T14:59:00.000Z',status:'READY_FOR_HUMAN_REVIEW',readyForHumanReview:true,required:{total:9,pass:9,pending:0,blocked:0,missing:0,invalid:0}},acknowledgement:{reviewedPromotionReadiness:true,understandsNoAutomaticMerge:true,understandsNoAutomaticDeployment:true,understandsHnkCanonRemainsSeparate:true},governance:{executesMerge:false,executesDeployment:false,changesPackageVersion:false,promotesHnkCanon:false,automaticPromotion:false,authority:'HUMAN_DECISION_RECORD_NOT_EXECUTION_AUTHORITY'}};}
function setup(){
  const plan=buildRc1PromotionExecutionPlan({decisionRecord:approvedDecision(),stackPlan:stack,generatedAt:'2026-09-16T15:01:00.000Z'});
  const first=plan.steps[0].id;
  const authorization=buildRc1TechnicalExecutionAuthorization({plan,authorizedStepIds:[first],authorizerLabel:'Technical Authorizer',rationale:'Authorize the first runbook step only.',acknowledged:true,recordedAt:'2026-09-16T15:02:00.000Z',authorizationId:'HOC-EXEC-AUTH-RECEIPT-TEST'});
  const guard=evaluateRc1PreMutationGuard({plan,authorization,stepId:first,completedStepIds:[]});
  assert.equal(guard.decision,'ALLOW');
  return {plan,authorization,guard,first};
}
function receiptInput(overrides={}){const context=setup();return {...context,input:{plan:context.plan,authorization:context.authorization,guardDecision:context.guard,result:'SUCCESS',executorLabel:'External Executor',summary:'The externally executed step reported success.',evidenceRefs:[{kind:'external-ref',value:'urn:test:receipt:success'}],startedAt:'2026-09-16T15:03:00.000Z',completedAt:'2026-09-16T15:04:00.000Z',receiptId:'HOC-MUTATION-RECEIPT-TEST',...overrides}};}

test('SUCCESS receipt is bound to plan, authorization and ALLOW guard but remains unverified evidence',()=>{
  const {plan,authorization,input}=receiptInput();
  const receipt=buildRc1TechnicalMutationReceipt(input);
  const inspection=inspectRc1TechnicalMutationReceipt(receipt,{plan,authorization});
  assert.equal(receipt.version,RC1_TECHNICAL_MUTATION_RECEIPT_VERSION);
  assert.equal(receipt.result,'SUCCESS');
  assert.equal(inspection.valid,true);
  assert.equal(inspection.externallyVerified,false);
  assert.equal(inspection.advancesCompletedPrefix,false);
  assert.equal(receipt.verification.status,'UNVERIFIED_EXTERNAL_RESULT');
  assert.equal(receipt.verification.externalEvidenceVerified,false);
  assert.equal(receipt.governance.executesAction,false);
  assert.equal(receipt.governance.advancesCompletedPrefix,false);
  assert.equal(receipt.governance.promotesHnkCanon,false);
});

test('SUCCESS requires external evidence but FAILED/CANCELLED may be recorded without success evidence',()=>{
  const success=receiptInput({evidenceRefs:[]});
  assert.throws(()=>buildRc1TechnicalMutationReceipt(success.input),/SUCCESS receipt requires/i);
  for(const result of ['FAILED','CANCELLED']){
    const candidate=receiptInput({result,evidenceRefs:[]});
    const receipt=buildRc1TechnicalMutationReceipt(candidate.input);
    assert.equal(receipt.result,result);
    assert.equal(inspectRc1TechnicalMutationReceipt(receipt,{plan:candidate.plan,authorization:candidate.authorization}).valid,true);
  }
});

test('DENY guard, another authorization or another plan fingerprint cannot produce receipt',()=>{
  const context=receiptInput();
  const deny={...context.guard,decision:'DENY',code:'STEP_NOT_AUTHORIZED'};
  assert.throws(()=>buildRc1TechnicalMutationReceipt({...context.input,guardDecision:deny}),/requires an ALLOW/i);
  const otherAuth={...context.authorization,authorizationId:'OTHER'};
  assert.throws(()=>buildRc1TechnicalMutationReceipt({...context.input,authorization:otherAuth}),/Authorization is invalid/i);
  const otherGuard={...context.guard,planFingerprint:'0'.repeat(64)};
  assert.throws(()=>buildRc1TechnicalMutationReceipt({...context.input,guardDecision:otherGuard}),/another promotion plan fingerprint/i);
});

test('receipt enforces chronological timestamps and evidence-reference shape',()=>{
  const reversed=receiptInput({startedAt:'2026-09-16T15:05:00.000Z',completedAt:'2026-09-16T15:04:00.000Z'});
  assert.throws(()=>buildRc1TechnicalMutationReceipt(reversed.input),/cannot be earlier/i);
  const malformed=receiptInput({evidenceRefs:[{kind:'x',value:'ok',sha256:'xyz'}]});
  assert.throws(()=>buildRc1TechnicalMutationReceipt(malformed.input),/Evidence item 0/);

  const valid=receiptInput();
  const receipt=structuredClone(buildRc1TechnicalMutationReceipt(valid.input));
  receipt.evidenceRefs[0].kind='';
  assert.equal(inspectRc1TechnicalMutationReceipt(receipt,{plan:valid.plan,authorization:valid.authorization}).valid,false);
});

test('local receipt CLI contains no mutation executor or verification inflation',()=>{
  assert.equal(pkg.scripts['record:rc1:mutation'],'node scripts/build-rc1-technical-mutation-receipt.mjs');
  assert.match(cli,/UNVERIFIED_EXTERNAL_RESULT/);
  assert.match(cli,/does not advance the completed-step prefix/i);
  assert.doesNotMatch(cli,/node:child_process/);
  assert.doesNotMatch(cli,/\bspawn\s*\(/);
  assert.doesNotMatch(cli,/\bexecFile\s*\(/);
  assert.doesNotMatch(cli,/\bfetch\s*\(/);
  assert.doesNotMatch(cli,/@octokit|api\.github\.com|vercel\.com\/api/i);
});
