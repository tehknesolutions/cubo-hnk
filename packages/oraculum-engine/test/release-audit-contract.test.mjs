import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const audit=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/AUDIT_STATUS.json',import.meta.url),'utf8'));
const manual=readFileSync(new URL('../../../docs/MANUAL_V1_RC1.md',import.meta.url),'utf8');
const report=readFileSync(new URL('../../../release/v1.0-rc1/RELEASE_AUDIT_REPORT.md',import.meta.url),'utf8');

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

test('markdown reconciliation does not imply visual artifact reconciliation',()=>{
  assert.equal(gate('markdownManual').status,'PASS');
  assert.equal(gate('docxPdfManual').status,'PENDING');
  assert.match(manual,/IMPLEMENTADO ≠ INSTRUMENTADO ≠ EXECUTADO ≠ APROVADO/);
  assert.match(manual,/DOCX\/PDF visual original ainda precisa ser regenerado/);
  assert.match(report,/HOC V1\.0 RC1 = NOT READY FOR STABLE PROMOTION/);
});
