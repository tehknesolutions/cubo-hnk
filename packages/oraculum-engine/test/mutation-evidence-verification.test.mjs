import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildRc1PromotionExecutionPlan} from '../../../scripts/lib/rc1-promotion-execution-plan.mjs';
import {buildRc1TechnicalExecutionAuthorization} from '../../../scripts/lib/rc1-technical-execution-authorization.mjs';
import {evaluateRc1PreMutationGuard} from '../../../scripts/lib/rc1-pre-mutation-guard.mjs';
import {buildRc1TechnicalMutationReceipt} from '../../../scripts/lib/rc1-technical-mutation-receipt.mjs';
import {buildRc1MutationEvidenceVerification,inspectRc1MutationEvidenceVerification,computeRc1MutationEvidenceVerificationFingerprint,RC1_MUTATION_EVIDENCE_VERIFICATION_VERSION} from '../../../scripts/lib/rc1-mutation-evidence-verification.mjs';

const pkg=JSON.parse(readFileSync(new URL('../../../package.json',import.meta.url),'utf8'));
const cli=readFileSync(new URL('../../../scripts/build-rc1-mutation-evidence-verification.mjs',import.meta.url),'utf8');

function approvedDecision(){return {
  version:'HOC-RC1-HUMAN-PROMOTION-DECISION/V1',releaseId:'HOC-V1.0-RC1',recordId:'TEST-DECISION',recordedAt:'2026-09-16T15:00:00.000Z',decision:'APPROVE_V1_0',reviewerLabel:'Reviewer',rationale:'All mandatory gates passed for test.',
  sourceReadiness:{evidenceKind:'HOC-RC1-PROMOTION-READINESS/V1',generatedAt:'2026-09-16T14:59:00.000Z',status:'READY_FOR_HUMAN_REVIEW',readyForHumanReview:true,required:{total:9,pass:9,pending:0,blocked:0,missing:0,invalid:0}},
  acknowledgement:{reviewedPromotionReadiness:true,understandsNoAutomaticMerge:true,understandsNoAutomaticDeployment:true,understandsHnkCanonRemainsSeparate:true},
  governance:{executesMerge:false,executesDeployment:false,changesPackageVersion:false,promotesHnkCanon:false,automaticPromotion:false,authority:'HUMAN_DECISION_RECORD_NOT_EXECUTION_AUTHORITY'},
};}
function stack(){return {planVersion:'HOC-V1.0-RC1-STACK-LANDING/VTEST',releaseId:'HOC-V1.0-RC1',mergeAuthorized:false,stablePromotionAuthorized:false,hnkCanonPromotionAuthorized:false,orderedPullRequests:[{order:1,pr:999,base:'main',head:'test-head',role:'test'}]};}
function fixture(result='SUCCESS'){
  const plan=buildRc1PromotionExecutionPlan({decisionRecord:approvedDecision(),stackPlan:stack(),generatedAt:'2026-09-16T15:01:00.000Z'});
  const stepId=plan.steps[0].id;
  const authorization=buildRc1TechnicalExecutionAuthorization({plan,authorizedStepIds:[stepId],authorizerLabel:'Operator',rationale:'Authorize first synthetic step only.',acknowledged:true,recordedAt:'2026-09-16T15:02:00.000Z',authorizationId:'TEST-AUTH'});
  const guard=evaluateRc1PreMutationGuard({plan,authorization,stepId,completedStepIds:[]});
  const evidence=result==='SUCCESS'?[{kind:'execution-log',value:'artifact://synthetic-step-log',sha256:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}]:[];
  const receipt=buildRc1TechnicalMutationReceipt({plan,authorization,guardDecision:guard,result,executorLabel:'External Operator',summary:`Synthetic ${result} result.`,evidenceRefs:evidence,startedAt:'2026-09-16T15:03:00.000Z',completedAt:'2026-09-16T15:04:00.000Z',receiptId:`TEST-RECEIPT-${result}`});
  return {plan,authorization,receipt};
}

test('SUCCESS receipt evidence can be verified without mutating prefix',()=>{
  const {plan,authorization,receipt}=fixture();
  const observations=[{evidenceIndex:0,kind:'execution-log',value:'artifact://synthetic-step-log',observedSha256:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',observedAt:'2026-09-16T15:05:00.000Z',verified:true}];
  const record=buildRc1MutationEvidenceVerification({plan,authorization,receipt,observations,verifierLabel:'Independent Reviewer',method:'artifact hash and content review',acknowledged:true,verifiedAt:'2026-09-16T15:06:00.000Z',verificationId:'TEST-VERIFY'});
  assert.equal(record.version,RC1_MUTATION_EVIDENCE_VERIFICATION_VERSION);
  assert.equal(record.result.status,'VERIFIED_EXTERNAL_EVIDENCE');
  assert.equal(record.result.eligibleForCompletedPrefix,true);
  assert.equal(record.governance.mutatesCompletedPrefix,false);
  assert.equal(record.governance.executesAction,false);
  assert.equal(record.governance.promotesHnkCanon,false);
  assert.match(record.verificationFingerprint,/^[0-9a-f]{64}$/u);
  assert.equal(record.verificationFingerprint,computeRc1MutationEvidenceVerificationFingerprint(record));
  assert.equal(inspectRc1MutationEvidenceVerification(record,{plan,authorization,receipt}).valid,true);
});

test('tampering or evidence hash mismatch fails closed',()=>{
  const {plan,authorization,receipt}=fixture();
  const bad=[{evidenceIndex:0,kind:'execution-log',value:'artifact://synthetic-step-log',observedSha256:'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',observedAt:'2026-09-16T15:05:00.000Z',verified:true}];
  assert.throws(()=>buildRc1MutationEvidenceVerification({plan,authorization,receipt,observations:bad,verifierLabel:'Reviewer',method:'hash review',acknowledged:true,verifiedAt:'2026-09-16T15:06:00.000Z'}),/hash does not match/);
  const good=[{evidenceIndex:0,kind:'execution-log',value:'artifact://synthetic-step-log',observedSha256:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',observedAt:'2026-09-16T15:05:00.000Z',verified:true}];
  const record=buildRc1MutationEvidenceVerification({plan,authorization,receipt,observations:good,verifierLabel:'Reviewer',method:'hash review',acknowledged:true,verifiedAt:'2026-09-16T15:06:00.000Z'});
  const forged={...record,result:{...record.result,evidenceCount:99}};
  assert.equal(inspectRc1MutationEvidenceVerification(forged,{plan,authorization,receipt}).valid,false);
});

test('missing observations and non-SUCCESS receipts cannot become prefix-eligible',()=>{
  const success=fixture();
  assert.throws(()=>buildRc1MutationEvidenceVerification({plan:success.plan,authorization:success.authorization,receipt:success.receipt,observations:[],verifierLabel:'Reviewer',method:'review',acknowledged:true}),/Exactly one verification observation/);
  const failed=fixture('FAILED');
  assert.throws(()=>buildRc1MutationEvidenceVerification({plan:failed.plan,authorization:failed.authorization,receipt:failed.receipt,observations:[],verifierLabel:'Reviewer',method:'review',acknowledged:true}),/Only SUCCESS receipts/);
});

test('CLI is local-record verification only and has no mutation/network executor',()=>{
  assert.equal(pkg.scripts['verify:rc1:mutation-evidence'],'node scripts/build-rc1-mutation-evidence-verification.mjs');
  assert.match(cli,/--observations/);
  assert.match(cli,/VERIFIED_EXTERNAL_EVIDENCE/);
  assert.doesNotMatch(cli,/node:child_process|\bspawn\s*\(|\bexecFile\s*\(|\bfetch\s*\(|@octokit|api\.github\.com|vercel\.com\/api/i);
});
