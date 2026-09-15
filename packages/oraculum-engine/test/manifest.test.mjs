import test from 'node:test';
import assert from 'node:assert/strict';
import { runOracle } from '../src/index.mjs';
import { interpretOracle } from '../src/interpretation.mjs';
import { analyzeCubeLegality } from '../src/legality.mjs';
import { analyzeRitualIntegrity, simulateCubeMoves } from '../src/ritual.mjs';
import { buildSessionManifest, canonicalJson, verifySessionManifest } from '../src/manifest.mjs';

const SOLVED='000000000111111111222222222333333333444444444555555555';
const INTENT='Qual padrão precisa se manifestar?';
const GOLDEN_SEED='df6bcd1bfd58288fb8f7d7e0f22b69d7e305a24429ba4445c242efc000e3b6fc';
const RITUAL32=[
  'U','R','F','D','L','B',"U'","R'",'F2','D2','L2','B2','U2','R2',"F'","D'",
  "L'","B'",'U','F','R','B','L','D',"U'","F'","R'","B'","L'","D'",'U2','F2'
];

function syntheticFixture(){
  const raw={
    protocol:'HNK-ORACULUM-CUBE/V0.4',engineVersion:'0.10-test',mode:'STATE',profileId:'HNK_ORACULUM_DEFAULT_V1',
    canonicalInput:{intent:'Teste',cubeState:SOLVED,moves:'NULL'},commit:'TEST-COMMIT',raw:{seed256:'a'.repeat(64)},
    iching:{},path32:{index:1},hnk:{glyphId:'G01'},tarot:{cardIndex:1},astrology:{},alchemy:{},numerology:{},colors:{},
    synthesisVector:{},derivationReservoir:'',sigil:{points:[]},provenance:[]
  };
  const legality={version:'HOC-CUBE-LEGALITY/V0.8',valid:true,mechanicallyReachable:true,checks:{format:true},invariants:{},errors:[]};
  const interpretation={interpretationVersion:'0.5.0-candidate',rawSeed256:'a'.repeat(64),profileId:'HNK_ORACULUM_DEFAULT_V1',path:{},tarot:{},signals:[],convergences:[],tensions:[],dominantConvergence:null,hnkOracleSemantics:{status:'NOT_CONSUMED'},malkuth:{verificationRequired:true}};
  return {raw,legality,interpretation};
}

test('canonical JSON is independent of object key insertion order',()=>{
  assert.equal(canonicalJson({b:2,a:1,nested:{z:3,y:2}}),canonicalJson({nested:{y:2,z:3},a:1,b:2}));
  assert.equal(canonicalJson({b:2,a:1}),'{"a":1,"b":2}');
});

test('synthetic V0.10 checksum is frozen',()=>{
  const manifest=buildSessionManifest(syntheticFixture());
  assert.equal(manifest.audit.checksum,'e8510e6f8eb299ef57ecc2481d7ac5e3e4b0dd754284c2c5728d48febbb60041');
  assert.equal(manifest.audit.sessionId,'HOC-E8510E6F8EB299EF57ECC248');
  assert.equal(verifySessionManifest(manifest),true);
});

test('golden STATE query preserves RAW seed and produces deterministic manifest',()=>{
  const raw=runOracle({intent:INTENT,cubeState:SOLVED});
  const legality=analyzeCubeLegality(SOLVED);
  const interpretation=interpretOracle(raw);
  const a=buildSessionManifest({legality,raw,interpretation});
  const b=buildSessionManifest({legality,raw,interpretation});
  assert.equal(raw.raw.seed256,GOLDEN_SEED);
  assert.deepEqual(a,b);
  assert.equal(a.oracle.seed256,GOLDEN_SEED);
  assert.match(a.audit.checksum,/^[0-9a-f]{64}$/);
  assert.match(a.audit.sessionId,/^HOC-[0-9A-F]{24}$/);
  assert.equal(verifySessionManifest(a),true);
});

test('tampering with a manifested output invalidates checksum verification',()=>{
  const fixture=syntheticFixture();
  const manifest=buildSessionManifest(fixture);
  const tampered=structuredClone(manifest);
  tampered.outputs.hnk.glyphId='G40';
  assert.equal(verifySessionManifest(tampered),false);
});

test('manifest fails closed on invalid legality or interpretation/raw mismatch',()=>{
  const fixture=syntheticFixture();
  assert.throws(()=>buildSessionManifest({...fixture,legality:{...fixture.legality,valid:false}}),/valid V0.8 legality/);
  assert.throws(()=>buildSessionManifest({...fixture,interpretation:{...fixture.interpretation,rawSeed256:'b'.repeat(64)}}),/seed mismatch/);
});

test('RITUAL_32 manifest requires and records a valid V0.9 audit',()=>{
  const finalState=simulateCubeMoves(SOLVED,RITUAL32).finalState;
  const raw=runOracle({intent:'Teste ritual',cubeState:finalState,mode:'RITUAL_32',moves:RITUAL32});
  const legality=analyzeCubeLegality(finalState);
  const ritualIntegrity=analyzeRitualIntegrity({initialCubeState:SOLVED,finalCubeState:finalState,moves:RITUAL32});
  const interpretation=interpretOracle(raw);
  assert.throws(()=>buildSessionManifest({legality,raw,interpretation}),/valid V0.9 ritual integrity/);
  const manifest=buildSessionManifest({legality,ritualIntegrity,raw,interpretation});
  assert.equal(manifest.physical.ritualIntegrity.integrityConfirmed,true);
  assert.equal(manifest.physical.ritualIntegrity.initialCubeState,SOLVED);
  assert.equal(manifest.physical.ritualIntegrity.reportedFinalState,finalState);
  assert.equal(verifySessionManifest(manifest),true);
});
