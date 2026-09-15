import test from 'node:test';
import assert from 'node:assert/strict';
import {EVIDENCE_KINDS,RC1_EVIDENCE_LEDGER_VERSION,evaluateRc1Evidence} from '../app/oraculum/qa/evidence/evidence-ledger.mjs';

const RELEASE='HOC-V1.0-RC1';
const CHECKSUM='a'.repeat(64);
const SESSION='HOC-ABCDEF0123456789ABCDEF01';

function runtime(passed=true){return {evidenceKind:EVIDENCE_KINDS.RUNTIME,releaseId:RELEASE,report:{releaseId:RELEASE,passed}};}
function independent(passed=true,overrides={}){return {
  evidenceKind:EVIDENCE_KINDS.INDEPENDENT,
  releaseId:RELEASE,
  passed,
  authority:'INDEPENDENT_EXECUTOR_EVIDENCE_NOT_GITHUB_CI',
  summary:{requiredCommands:7,passedCommands:passed?7:6,failedCommands:passed?0:1},
  governance:{replacesGitHubCI:false,promotesStable:false,promotesHnkCanon:false},
  ...overrides,
};}
function physical(caseId,passed=true){return {evidenceKind:EVIDENCE_KINDS.PHYSICAL,report:{releaseId:RELEASE,caseId,passed,physicalTranscriptionConfirmed:true}};}
function camera(passed=true){return {evidenceKind:EVIDENCE_KINDS.CAMERA,releaseId:RELEASE,fullQaPass:passed,capabilityPass:passed,manualPass:passed};}
function verify(deviceLabel,{sessionId=SESSION,checksum=CHECKSUM,valid=true}={}){return {evidenceKind:EVIDENCE_KINDS.MANIFEST_VERIFY,releaseId:RELEASE,valid,sessionId,checksum,deviceLabel};}

function byId(report,id){return report.gates.find(item=>item.id===id);}

test('empty ledger remains blocked by CI and pending for execution/human gates',()=>{
  const report=evaluateRc1Evidence([]);
  assert.equal(report.version,RC1_EVIDENCE_LEDGER_VERSION);
  assert.equal(report.overall,'BLOCKED');
  assert.equal(byId(report,'ciBuild').status,'BLOCKED');
  assert.equal(byId(report,'independentValidation').status,'PENDING');
  assert.equal(byId(report,'humanPromotion').status,'PENDING');
  assert.equal(byId(report,'physicalState').status,'PENDING');
  assert.equal(byId(report,'manualFinalDocs').status,'PASS');
  assert.equal(byId(report,'productionHardeningSource').status,'PASS');
});

test('runtime, independent executor, physical and camera PASS independently while CI stays blocked',()=>{
  const report=evaluateRc1Evidence([
    runtime(true),independent(true),physical('STATE_SOLVED',true),physical('RITUAL32_OFFICIAL',true),camera(true),
  ]);
  assert.equal(byId(report,'runtimeSelfTest').status,'PASS');
  assert.equal(byId(report,'independentValidation').status,'PASS');
  assert.equal(byId(report,'physicalState').status,'PASS');
  assert.equal(byId(report,'physicalRitual').status,'PASS');
  assert.equal(byId(report,'cameraDevice').status,'PASS');
  assert.equal(byId(report,'ciBuild').status,'BLOCKED');
  assert.equal(report.overall,'BLOCKED');
});

test('independent evidence must preserve governance boundary to PASS',()=>{
  const replacesCi=evaluateRc1Evidence([independent(true,{governance:{replacesGitHubCI:true,promotesStable:false,promotesHnkCanon:false}})]);
  assert.equal(byId(replacesCi,'independentValidation').status,'PENDING');

  const promotesStable=evaluateRc1Evidence([independent(true,{governance:{replacesGitHubCI:false,promotesStable:true,promotesHnkCanon:false}})]);
  assert.equal(byId(promotesStable,'independentValidation').status,'PENDING');

  const wrongAuthority=evaluateRc1Evidence([independent(true,{authority:'GITHUB_CI'})]);
  assert.equal(byId(wrongAuthority,'independentValidation').status,'PENDING');

  const failedCommands=evaluateRc1Evidence([independent(true,{summary:{requiredCommands:7,passedCommands:6,failedCommands:1}})]);
  assert.equal(byId(failedCommands,'independentValidation').status,'PENDING');
});

test('cross-device requires same manifest identity and distinct human device labels',()=>{
  const sameLabel=evaluateRc1Evidence([verify('Desktop'),verify('desktop')]);
  assert.equal(byId(sameLabel,'crossDeviceManifest').status,'PENDING');

  const differentIdentity=evaluateRc1Evidence([verify('Desktop'),verify('Android',{checksum:'b'.repeat(64)})]);
  assert.equal(byId(differentIdentity,'crossDeviceManifest').status,'PENDING');

  const passed=evaluateRc1Evidence([verify('Desktop Edge'),verify('Android Chrome')]);
  assert.equal(byId(passed,'crossDeviceManifest').status,'PASS');
  assert.equal(passed.crossDevice.sessionId,SESSION);
  assert.equal(passed.crossDevice.deviceLabels.length,2);
});

test('wrong release or unknown evidence is ignored',()=>{
  const report=evaluateRc1Evidence([
    {evidenceKind:EVIDENCE_KINDS.RUNTIME,releaseId:'OTHER',report:{releaseId:'OTHER',passed:true}},
    {evidenceKind:EVIDENCE_KINDS.INDEPENDENT,releaseId:'OTHER',passed:true},
    {evidenceKind:'UNKNOWN',releaseId:RELEASE,passed:true},
  ]);
  assert.equal(report.importedRecords,3);
  assert.equal(report.acceptedRecords,0);
  assert.equal(byId(report,'runtimeSelfTest').status,'PENDING');
  assert.equal(byId(report,'independentValidation').status,'PENDING');
});

test('non-PASS imported evidence never upgrades a gate',()=>{
  const report=evaluateRc1Evidence([runtime(false),independent(false),physical('STATE_SOLVED',false),camera(false),verify('Desktop',{valid:false})]);
  assert.equal(byId(report,'runtimeSelfTest').status,'PENDING');
  assert.equal(byId(report,'independentValidation').status,'PENDING');
  assert.equal(byId(report,'physicalState').status,'PENDING');
  assert.equal(byId(report,'cameraDevice').status,'PENDING');
  assert.equal(byId(report,'crossDeviceManifest').status,'PENDING');
});
