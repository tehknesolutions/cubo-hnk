import test from 'node:test';
import assert from 'node:assert/strict';
import {EVIDENCE_KINDS,RC1_EVIDENCE_LEDGER_VERSION,evaluateRc1Evidence} from '../app/oraculum/qa/evidence/evidence-ledger.mjs';

const RELEASE='HOC-V1.0-RC1';
const CHECKSUM='a'.repeat(64);
const SESSION='HOC-ABCDEF0123456789ABCDEF01';
const GOLDEN_SEED='df6bcd1bfd58288fb8f7d7e0f22b69d7e305a24429ba4445c242efc000e3b6fc';
const RELEASE_ATTESTATION_VERSION='HOC-RC1-RELEASE-ATTESTATION/V1';
const RELEASE_FINGERPRINT='08e003a28185fcd31a806549588547994bcc3075a256bc6cbe6d79d9558f3e90';
const BUILD_PROVENANCE_VERSION='HOC-RC1-BUILD-PROVENANCE/V1';
const COMMIT='6076efafe1f509f91de3cc77dd4609cfc8e585e8';

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
function deployment(passed=true,overrides={}){return {
  evidenceKind:EVIDENCE_KINDS.DEPLOYMENT,
  releaseId:RELEASE,
  passed,
  authority:'DEPLOYMENT_RUNTIME_EVIDENCE_NOT_PRODUCTION_PROMOTION',
  deployment:{origin:'https://preview.example',https:true,provider:'VERCEL',environment:'preview',deploymentId:'dpl_test'},
  releaseAttestation:{version:RELEASE_ATTESTATION_VERSION,expectedFingerprint:RELEASE_FINGERPRINT,actualFingerprint:RELEASE_FINGERPRINT,matchesExpected:true},
  buildProvenance:{version:BUILD_PROVENANCE_VERSION,provider:'VERCEL',environment:'preview',deploymentId:'dpl_test',commitRef:'feat/test',commitSha:COMMIT,expectedCommit:null,commitMatch:null,completeness:'COMMIT_AND_REF',source:'RUNTIME_ENV_METADATA_UNHASHED',authority:'BUILD_PROVENANCE_METADATA_NOT_RELEASE_IDENTITY',entersReleaseFingerprint:false},
  golden:{expectedSeed256:GOLDEN_SEED,actualSeed256:passed?GOLDEN_SEED:'0'.repeat(64)},
  summary:{total:33,passed:passed?33:32,failed:passed?0:1},
  governance:{promotesStable:false,promotesHnkCanon:false,replacesGitHubCI:false,replacesPhysicalQa:false},
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
  assert.equal(byId(report,'deploymentVerification').status,'PENDING');
  assert.equal(byId(report,'humanPromotion').status,'PENDING');
});

test('runtime, independent executor, deployment, physical and camera PASS independently while CI stays blocked',()=>{
  const report=evaluateRc1Evidence([runtime(true),independent(true),deployment(true),physical('STATE_SOLVED',true),physical('RITUAL32_OFFICIAL',true),camera(true)]);
  assert.equal(byId(report,'runtimeSelfTest').status,'PASS');
  assert.equal(byId(report,'independentValidation').status,'PASS');
  assert.equal(byId(report,'deploymentVerification').status,'PASS');
  assert.equal(byId(report,'physicalState').status,'PASS');
  assert.equal(byId(report,'physicalRitual').status,'PASS');
  assert.equal(byId(report,'cameraDevice').status,'PASS');
  assert.equal(byId(report,'ciBuild').status,'BLOCKED');
  assert.equal(report.overall,'BLOCKED');
});

test('deployment evidence requires attestation, provenance, golden seed and governance boundaries',()=>{
  assert.equal(byId(evaluateRc1Evidence([deployment(true)]),'deploymentVerification').status,'PASS');
  assert.equal(byId(evaluateRc1Evidence([deployment(true,{buildProvenance:{version:'OTHER'}})]),'deploymentVerification').status,'PENDING');
  assert.equal(byId(evaluateRc1Evidence([deployment(true,{buildProvenance:{...deployment().buildProvenance,entersReleaseFingerprint:true}})]),'deploymentVerification').status,'PENDING');
  assert.equal(byId(evaluateRc1Evidence([deployment(true,{buildProvenance:{...deployment().buildProvenance,authority:'RELEASE_IDENTITY'}})]),'deploymentVerification').status,'PENDING');
  assert.equal(byId(evaluateRc1Evidence([deployment(true,{buildProvenance:{...deployment().buildProvenance,expectedCommit:COMMIT.slice(0,12),commitMatch:true}})]),'deploymentVerification').status,'PASS');
  assert.equal(byId(evaluateRc1Evidence([deployment(true,{buildProvenance:{...deployment().buildProvenance,expectedCommit:'deadbee',commitMatch:true}})]),'deploymentVerification').status,'PENDING');
  assert.equal(byId(evaluateRc1Evidence([deployment(true,{buildProvenance:{...deployment().buildProvenance,expectedCommit:COMMIT.slice(0,12),commitMatch:false}})]),'deploymentVerification').status,'PENDING');
  assert.equal(byId(evaluateRc1Evidence([deployment(true,{releaseAttestation:{version:'OTHER',expectedFingerprint:RELEASE_FINGERPRINT,actualFingerprint:RELEASE_FINGERPRINT,matchesExpected:true}})]),'deploymentVerification').status,'PENDING');
  assert.equal(byId(evaluateRc1Evidence([deployment(true,{golden:{expectedSeed256:GOLDEN_SEED,actualSeed256:'b'.repeat(64)}})]),'deploymentVerification').status,'PENDING');
  assert.equal(byId(evaluateRc1Evidence([deployment(true,{governance:{promotesStable:true,promotesHnkCanon:false,replacesGitHubCI:false,replacesPhysicalQa:false}})]),'deploymentVerification').status,'PENDING');
  assert.equal(byId(evaluateRc1Evidence([deployment(true,{summary:{total:33,passed:32,failed:1}})]),'deploymentVerification').status,'PENDING');
});

test('independent evidence must preserve governance boundary to PASS',()=>{
  const replacesCi=evaluateRc1Evidence([independent(true,{governance:{replacesGitHubCI:true,promotesStable:false,promotesHnkCanon:false}})]);
  assert.equal(byId(replacesCi,'independentValidation').status,'PENDING');
});

test('cross-device requires same manifest identity and distinct human device labels',()=>{
  assert.equal(byId(evaluateRc1Evidence([verify('Desktop'),verify('desktop')]),'crossDeviceManifest').status,'PENDING');
  assert.equal(byId(evaluateRc1Evidence([verify('Desktop'),verify('Android',{checksum:'b'.repeat(64)})]),'crossDeviceManifest').status,'PENDING');
  const passed=evaluateRc1Evidence([verify('Desktop Edge'),verify('Android Chrome')]);
  assert.equal(byId(passed,'crossDeviceManifest').status,'PASS');
  assert.equal(passed.crossDevice.sessionId,SESSION);
});

test('wrong release or non-PASS evidence never upgrades gates',()=>{
  const report=evaluateRc1Evidence([{evidenceKind:EVIDENCE_KINDS.DEPLOYMENT,releaseId:'OTHER',passed:true},runtime(false),deployment(false)]);
  assert.equal(byId(report,'runtimeSelfTest').status,'PENDING');
  assert.equal(byId(report,'deploymentVerification').status,'PENDING');
});
