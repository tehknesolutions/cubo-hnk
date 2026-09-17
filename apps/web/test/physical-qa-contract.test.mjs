import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const route=readFileSync(new URL('../app/api/oraculum/qa/physical/route.ts',import.meta.url),'utf8');
const client=readFileSync(new URL('../app/oraculum/qa/physical/PhysicalQaClient.tsx',import.meta.url),'utf8');

test('physical QA API consumes frozen RC1 vectors instead of local copies',()=>{
  assert.match(route,/RC1_QA_VECTORS/);
  assert.match(route,/RC1_RELEASE_ID/);
  assert.doesNotMatch(route,/513004512451013254000425014533433235324540121221251340/);
});

test('physical QA requires explicit human confirmation',()=>{
  assert.match(route,/physicalTranscriptionConfirmed!==true/);
  assert.match(route,/PHYSICAL_CONFIRMATION_REQUIRED/);
  assert.match(client,/Confirmo que esta sequência foi transcrita de um cubo físico real/);
});

test('STATE physical QA locks legality, commit and seed',()=>{
  assert.match(route,/caseId==='STATE_SOLVED'/);
  assert.match(route,/analyzeCubeLegality\(actualState\)/);
  assert.match(route,/rawSeed256===vector\.seed256/);
  assert.match(route,/rawCommit===vector\.commit/);
});

test('RITUAL_32 physical QA compares real transcript through V0.9',()=>{
  assert.match(route,/caseId==='RITUAL32_OFFICIAL'/);
  assert.match(route,/analyzeRitualIntegrity/);
  assert.match(route,/initialCubeState:vector\.initialCubeState/);
  assert.match(route,/moves:vector\.moves/);
  assert.match(route,/status:passed\?200:422/);
});

test('wizard does not prefill or display the hidden ritual final state before evaluation',()=>{
  assert.doesNotMatch(client,/513004512451013254000425014533433235324540121221251340/);
  assert.doesNotMatch(client,/expectedFinalState/);
  assert.match(client,/Não consulte o estado final esperado antes de terminar a transcrição/);
});
