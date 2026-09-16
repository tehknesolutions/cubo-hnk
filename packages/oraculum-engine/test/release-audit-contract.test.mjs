import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const audit=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/AUDIT_STATUS.json',import.meta.url),'utf8'));
const manual=readFileSync(new URL('../../../docs/MANUAL_V1_RC1.md',import.meta.url),'utf8');
const report=readFileSync(new URL('../../../release/v1.0-rc1/RELEASE_AUDIT_REPORT.md',import.meta.url),'utf8');
const hardening=readFileSync(new URL('../../../docs/RC1_PRODUCTION_HARDENING.md',import.meta.url),'utf8');
const visual=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/VISUAL_MANUAL_ARTIFACTS.json',import.meta.url),'utf8'));

function gate(id){
  const found=audit.gates.find(item=>item.id===id);
  assert.ok(found,`missing audit gate ${id}`);
  return found;
}

test('RC1 audit cannot silently claim stable or HNK canon',()=>{
  assert.equal(audit.releaseId,'HOC-V1.0-RC1');
  assert.equal(audit.packageVersion,'1.0.0-rc.1');
  assert.equal(audit.overallStatus,'NOT_READY_FOR_STABLE');
  assert.equal(audit.governance.releaseStatus,'RELEASE_CANDIDATE');
  assert.equal(audit.governance.stable,false);
  assert.equal(audit.governance.hnkCanonPromoted,false);
});

test('frozen protocol identities remain explicit in audit',()=>{
  assert.equal(audit.protocols.raw,'HNK-ORACULUM-CUBE/V0.4');
  assert.equal(audit.protocols.interpretation,'0.5.0-candidate');
  assert.equal(audit.protocols.legality,'HOC-CUBE-LEGALITY/V0.8');
  assert.equal(audit.protocols.ritual,'HOC-RITUAL-INTEGRITY/V0.9');
  assert.equal(audit.protocols.manifest,'HOC-SESSION-MANIFEST/V0.10');
  assert.equal(audit.protocols.canonicalJson,'HOC-CANONICAL-JSON/V1');
});

test('execution-sensitive gates remain pending or blocked',()=>{
  assert.equal(gate('runtimeSelfTest').status,'PENDING');
  assert.equal(gate('physicalState').status,'PENDING');
  assert.equal(gate('physicalRitual32').status,'PENDING');
  assert.equal(gate('cameraDevice').status,'PENDING');
  assert.equal(gate('manifestCrossDevice').status,'PENDING');
  assert.equal(gate('ciTypecheckBuild').status,'BLOCKED');
  assert.equal(gate('humanPromotion').status,'PENDING');
});

test('source hardening pass does not imply deployed runtime verification',()=>{
  assert.equal(gate('productionHardeningSource').status,'PASS');
  assert.equal(gate('productionHardeningRuntime').status,'PENDING');
  assert.match(hardening,/IMPLEMENTED \/ NOT YET BUILD-VERIFIED/);
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
