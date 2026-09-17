import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const route=readFileSync(new URL('../app/api/oraculum/route.ts',import.meta.url),'utf8');
const manual=readFileSync(new URL('../app/oraculum/OraculumClient.tsx',import.meta.url),'utf8');
const camera=readFileSync(new URL('../app/oraculum/camera/CameraConsultationClient.tsx',import.meta.url),'utf8');
test('API evaluates ritual integrity before RAW hashing in RITUAL_32',()=>{
  assert.match(route,/analyzeRitualIntegrity/);assert.match(route,/input\.mode\s*===\s*'RITUAL_32'/);assert.match(route,/initialCubeState:\s*input\.initialCubeState/);assert.match(route,/status:\s*422/);
  const ritualGate=route.indexOf("input.mode==='RITUAL_32'");const rawIndex=route.indexOf('const raw=runOracle');assert.ok(ritualGate>=0&&rawIndex>ritualGate,'ritual gate must execute before runOracle');
});
test('manual surface captures and sends an explicit initial state only for RITUAL_32',()=>{assert.match(manual,/setInitialCubeState/);assert.match(manual,/Fixar grade atual como inicial/);assert.match(manual,/initialCubeState:mode==='RITUAL_32'\?initialCubeState:undefined/);assert.match(manual,/RITUAL_32 exige que o estado inicial seja fixado/);});
test('camera surface preserves human review for both initial and final ritual states',()=>{assert.match(camera,/fixInitialFromCurrent/);assert.match(camera,/if\(!reviewed\)return setError\('Revise visualmente as 54 casas antes de fixar o estado inicial\.'/);assert.match(camera,/initialCubeState:mode==='RITUAL_32'\?initialCubeState:undefined/);assert.match(camera,/Revisei visualmente todas as 54 casas/);});
