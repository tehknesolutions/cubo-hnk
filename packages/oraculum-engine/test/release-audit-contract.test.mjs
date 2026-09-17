import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const audit=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/AUDIT_STATUS.json',import.meta.url),'utf8'));
const tailEvidence=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/INDEPENDENT_TAIL_TEST_EVIDENCE.json',import.meta.url),'utf8'));
const manual=readFileSync(new URL('../../../docs/MANUAL_V1_RC1.md',import.meta.url),'utf8');
const report=readFileSync(new URL('../../../release/v1.0-rc1/RELEASE_AUDIT_REPORT.md',import.meta.url),'utf8');
const hardening=readFileSync(new URL('../../../docs/RC1_PRODUCTION_HARDENING.md',import.meta.url),'utf8');
const visual=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/VISUAL_MANUAL_ARTIFACTS.json',import.meta.url),'utf8'));
function gate(id){const found=audit.gates.find(item=>item.id===id);assert.ok(found,`missing audit gate ${id}`);return found;}

test('RC1 audit cannot silently claim stable or HNK canon',()=>{
  assert.equal(audit.releaseId,'HOC-V1.0-RC1');
  assert.equal(audit.packageVersion,'1.0.0-rc.1');
  assert.equal(audit.overallStatus,'NOT_READY_FOR_STABLE');
  assert.equal(audit.governance.releaseStatus,'RELEASE_CANDIDATE');
  assert.equal(audit.governance.stable,false);
  assert.equal(audit.governance.hnkCanonPromoted,false);
});

test('frozen protocol identities and operational guard/transition identities remain explicit',()=>{
  assert.equal(audit.protocols.raw,'HNK-ORACULUM-CUBE/V0.4');
  assert.equal(audit.protocols.legality,'HOC-CUBE-LEGALITY/V0.8');
  assert.equal(audit.protocols.ritual,'HOC-RITUAL-INTEGRITY/V0.9');
  assert.equal(audit.protocols.manifest,'HOC-SESSION-MANIFEST/V0.10');
  assert.equal(audit.protocols.preMutationGuard,'HOC-RC1-PRE-MUTATION-GUARD/V2');
  assert.equal(audit.protocols.preMutationGuardFingerprint,'HOC-RC1-PRE-MUTATION-GUARD-FINGERPRINT/V1');
  assert.equal(audit.protocols.completedPrefixState,'HOC-RC1-COMPLETED-PREFIX-STATE/V1');
  assert.equal(audit.protocols.completedPrefixTransition,'HOC-RC1-COMPLETED-PREFIX-TRANSITION/V2');
  assert.equal(audit.protocols.completedPrefixTransitionFingerprint,'HOC-RC1-COMPLETED-PREFIX-TRANSITION-FINGERPRINT/V2');
  assert.equal(gate('preMutationGuard').status,'PASS');
  assert.equal(gate('completedPrefixTransition').status,'PASS');
  assert.match(gate('completedPrefixTransition').reason,/state-swap/i);
});

test('independent frozen validation is reconciled without inflating GitHub CI',()=>{
  assert.equal(audit.protocols.independentValidationEvidence,'HOC-V1.0-RC1-FROZEN-INSTALL-RECONCILIATION-EVIDENCE/V1');
  assert.equal(audit.protocols.trackedLockfileEvidence,'HOC-V1.0-RC1-TRACKED-LOCKFILE-EVIDENCE/V1');
  assert.equal(audit.protocols.independentTailValidationEvidence,'HOC-RC1-INDEPENDENT-TAIL-REPOSITORY-TEST-EVIDENCE/V1');
  assert.equal(gate('independentValidation').status,'PASS');
  assert.equal(gate('independentValidation').level,'EXECUTED_RECONCILED');
  assert.equal(gate('trackedLockfile').status,'PASS');
  assert.equal(gate('trackedLockfile').level,'TRACKED_BYTE_IDENTICAL');
  assert.equal(gate('freshTrackedHeadExecution').status,'PENDING');
  assert.equal(gate('independentTailValidation').status,'PASS');
  assert.equal(gate('independentTailValidation').level,'EXECUTED_PARTIAL');
  assert.equal(gate('independentTailValidation').evidenceSha256,'3764a102ed07cdba9691c662e2d0aa7909fee1f2e3d2847fea1c71a59e68ee77');
  assert.equal(gate('independentTailValidation').tapSha256,'3cff2579e07fa55cad211f50ef83eb85defc1c51f954056fedb0ea89ffb218ac');
  assert.equal(tailEvidence.evidenceKind,'HOC-RC1-INDEPENDENT-TAIL-REPOSITORY-TEST-EVIDENCE/V1');
  assert.equal(tailEvidence.sourceHead,'41b62913a4f82ac1b3b61f087740840d7c1cee91');
  assert.deepEqual(tailEvidence.repositoryTests,{total:21,pass:21,fail:0,cancelled:0,skipped:0});
  assert.deepEqual(tailEvidence.supplementalHarness,{total:13,pass:13,fail:0});
  assert.equal(tailEvidence.passed,true);
  assert.equal(gate('ciTypecheckBuild').status,'BLOCKED');
});

test('execution-sensitive gates remain pending or blocked',()=>{
  assert.equal(gate('runtimeSelfTest').status,'PENDING');
  assert.equal(gate('freshTrackedHeadExecution').status,'PENDING');
  assert.equal(gate('physicalState').status,'PENDING');
  assert.equal(gate('physicalRitual32').status,'PENDING');
  assert.equal(gate('cameraDevice').status,'PENDING');
  assert.equal(gate('manifestCrossDevice').status,'PENDING');
  assert.equal(gate('ciTypecheckBuild').status,'BLOCKED');
  assert.equal(gate('humanPromotion').status,'PENDING');
});

test('source hardening and reconciled build do not imply deployed runtime verification',()=>{
  assert.equal(gate('productionHardeningSource').status,'PASS');
  assert.equal(gate('productionHardeningRuntime').status,'PENDING');
  assert.equal(gate('productionHardeningRuntime').level,'BUILD_VERIFIED_PRE_DEPLOY');
  assert.match(hardening,/BUILD-VERIFIED PRE-DEPLOY/);
  assert.match(hardening,/Independent frozen production build: `PASS`/);
  assert.match(report,/PRODUCTION_HARDENING_SOURCE = PASS/);
  assert.match(report,/PRODUCTION_HARDENING_RUNTIME = PENDING/);
});

test('visual manual gate is backed by exact QA artifact hashes',()=>{
  assert.equal(gate('markdownManual').status,'PASS');
  assert.equal(gate('docxPdfManual').status,'PASS');
  assert.equal(visual.releaseId,'HOC-V1.0-RC1');
  assert.equal(visual.qaStatus,'PASS');
  assert.equal(visual.pageCount,36);
  assert.equal(visual.artifacts.length,2);
  assert.equal(visual.artifacts[0].sha256,'b3e0d7720318ccd79cc8199d0a9737bd1b1fb3eeef22d3d4c002c6094e1e3f03');
  assert.equal(visual.artifacts[1].sha256,'c437e9f19be0611029d6a85d8d15489e0513d96095935073f7cf6644d4cbf2fe');
  assert.match(manual,/IMPLEMENTADO ≠ INSTRUMENTADO ≠ EXECUTADO ≠ APROVADO/);
  assert.match(report,/DOCX_PDF_FINAL = PASS/);
  assert.match(report,/HOC V1\.0 RC1 = NOT READY FOR STABLE PROMOTION/);
});
