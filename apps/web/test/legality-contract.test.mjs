import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const route=readFileSync(new URL('../app/api/oraculum/route.ts',import.meta.url),'utf8');
test('API imports the V0.8 legality engine',()=>{assert.match(route,/analyzeCubeLegality/);assert.match(route,/@hnk\/oraculum-engine\/legality/);});
test('illegal physical states fail before runOracle',()=>{const analyzeIndex=route.indexOf('const legality=analyzeCubeLegality');const gateIndex=route.indexOf('if(!legality.valid)');const rawIndex=route.indexOf('const raw=runOracle');assert.ok(analyzeIndex>=0);assert.ok(gateIndex>analyzeIndex);assert.ok(rawIndex>gateIndex);assert.match(route,/status:\s*422/);});
test('successful response exposes the legality audit with the unchanged raw result',()=>{assert.match(route,/ok:true[^}]*scanProfile:'HOC-FACELET-SCAN-V1'[^}]*legality[^}]*raw[^}]*interpretation/s);assert.match(route,/HOC-FACELET-SCAN-V1/);});
