import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const runtimeClient=readFileSync(new URL('../app/oraculum/qa/Rc1QaClient.tsx',import.meta.url),'utf8');
const verifierClient=readFileSync(new URL('../app/oraculum/verify/ManifestVerifierClient.tsx',import.meta.url),'utf8');
const ledgerClient=readFileSync(new URL('../app/oraculum/qa/evidence/EvidenceLedgerClient.tsx',import.meta.url),'utf8');

test('runtime QA exports a typed evidence artifact',()=>{
  assert.match(runtimeClient,/HOC-RC1-RUNTIME-QA-EVIDENCE\/V1/);
  assert.match(runtimeClient,/report,/);
  assert.match(runtimeClient,/Baixar evidência JSON/);
});

test('manifest verifier exports device-labeled verification evidence without raw manifest body',()=>{
  assert.match(verifierClient,/HOC-RC1-MANIFEST-VERIFY-EVIDENCE\/V1/);
  assert.match(verifierClient,/deviceLabel/);
  assert.match(verifierClient,/sessionId:result\.sessionId/);
  assert.match(verifierClient,/checksum:result\.checksum/);
  const evidenceBlock=verifierClient.slice(verifierClient.indexOf("evidenceKind:'HOC-RC1-MANIFEST-VERIFY-EVIDENCE/V1'"),verifierClient.indexOf('const blob=',verifierClient.indexOf("evidenceKind:'HOC-RC1-MANIFEST-VERIFY-EVIDENCE/V1'")));
  assert.doesNotMatch(evidenceBlock,/manifest\s*[:,]/);
  assert.doesNotMatch(evidenceBlock,/deviceId|geolocation|getCurrentPosition/);
});

test('ledger processes imported JSON locally and exposes promotion matrix',()=>{
  assert.match(ledgerClient,/multiple onChange=\{importFiles\}/);
  assert.match(ledgerClient,/evaluateRc1Evidence/);
  assert.match(ledgerClient,/PASS \/ PENDING \/ BLOCKED/);
  assert.doesNotMatch(ledgerClient,/fetch\(/);
});
