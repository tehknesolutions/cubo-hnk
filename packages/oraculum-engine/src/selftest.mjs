import { ORACULUM_PROTOCOL, runOracle } from './index.mjs';
import { interpretOracle } from './interpretation.mjs';
import { CUBE_LEGALITY_VERSION, analyzeCubeLegality } from './legality.mjs';
import { RITUAL_INTEGRITY_VERSION, analyzeRitualIntegrity, simulateCubeMoves } from './ritual.mjs';
import { SESSION_CANONICAL_JSON_VERSION, SESSION_MANIFEST_VERSION, buildSessionManifest, verifySessionManifest } from './manifest.mjs';
import { HNK40_GLYPH_SET_SHA256, HNK40_STATUS } from './hnk40-runtime.mjs';

export const RC1_RUNTIME_SELFTEST_VERSION = 'HOC-RC1-RUNTIME-SELFTEST/V1';
export const RC1_RELEASE_ID = 'HOC-V1.0-RC1';

const SOLVED='000000000111111111222222222333333333444444444555555555';
const STATE_INTENT='Qual padrão precisa se manifestar?';
const STATE_COMMIT='HNK-ORACULUM-CUBE/V0.4|STATE|Qual padrão precisa se manifestar?|000000000111111111222222222333333333444444444555555555|NULL';
const STATE_SEED='df6bcd1bfd58288fb8f7d7e0f22b69d7e305a24429ba4445c242efc000e3b6fc';
const RITUAL32=Object.freeze(['U','R','F','D','L','B',"U'","R'",'F2','D2','L2','B2','U2','R2',"F'","D'","L'","B'",'U','F','R','B','L','D',"U'","F'","R'","B'","L'","D'",'U2','F2']);
const RITUAL_FINAL='513004512451013254000425014533433235324540121221251340';
const MANIFEST_CHECKSUM='e8510e6f8eb299ef57ecc2481d7ac5e3e4b0dd754284c2c5728d48febbb60041';
const MANIFEST_SESSION_ID='HOC-E8510E6F8EB299EF57ECC248';
const HNK40_HASH='78668df0f707952b7c280de52526abaa2b7900597fb8ff362a3a08641fd1bce5';

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

function equal(a,b){
  return JSON.stringify(a)===JSON.stringify(b);
}

function createCollector(){
  const checks=[];
  function check(id,actual,expected){
    const passed=equal(actual,expected);
    checks.push(Object.freeze({id,passed,actual,expected}));
    return passed;
  }
  return {checks,check};
}

export function runRc1RuntimeSelfTest(){
  const {checks,check}=createCollector();

  check('protocol.raw',ORACULUM_PROTOCOL,'HNK-ORACULUM-CUBE/V0.4');
  check('protocol.legality',CUBE_LEGALITY_VERSION,'HOC-CUBE-LEGALITY/V0.8');
  check('protocol.ritual',RITUAL_INTEGRITY_VERSION,'HOC-RITUAL-INTEGRITY/V0.9');
  check('protocol.manifest',SESSION_MANIFEST_VERSION,'HOC-SESSION-MANIFEST/V0.10');
  check('protocol.canonicalJson',SESSION_CANONICAL_JSON_VERSION,'HOC-CANONICAL-JSON/V1');

  const raw=runOracle({intent:STATE_INTENT,cubeState:SOLVED,mode:'STATE'});
  check('state.commit',raw.commit,STATE_COMMIT);
  check('state.seed256',raw.raw.seed256,STATE_SEED);
  check('state.path32',raw.path32.index,24);
  check('state.hnkGlyphId',raw.hnk.glyphId,'G39');
  check('state.tarotCardIndex',raw.tarot.cardIndex,71);
  check('state.zodiac',raw.astrology.zodiac,'SAGITTARIUS');
  check('state.planet',raw.astrology.planet,'MARS');
  check('state.element',raw.astrology.element,'AIR');
  check('state.alchemyPrinciple',raw.alchemy.principle,'SALT');
  check('state.alchemyPhase',raw.alchemy.phase,'CITRINITAS');
  check('state.numerologyRaw',raw.numerology.raw,194);
  check('state.essenceColor',raw.colors.essence,'#447DC7');
  check('state.shadowColor',raw.colors.shadow,'#BB8238');
  check('state.manifestationColor',raw.colors.manifestation,'#7DC744');
  check('state.ichingPrimaryKingWen',raw.iching.primary.kingWen,30);
  check('state.movingLines',raw.iching.movingLines,[1,3,4]);
  check('state.ichingResultingKingWen',raw.iching.resulting.kingWen,23);

  const interpretation=interpretOracle(raw,{includeResultingIChing:true});
  check('interpretation.dominantConvergence',interpretation.dominantConvergence?.id??null,'ELEMENT:FIRE');
  check('interpretation.rawSeedInvariant',interpretation.rawSeed256,STATE_SEED);

  const solvedLegality=analyzeCubeLegality(SOLVED);
  check('legality.solvedValid',solvedLegality.valid,true);

  const simulated=simulateCubeMoves(SOLVED,RITUAL32);
  check('ritual.expectedFinalState',simulated.finalState,RITUAL_FINAL);
  const ritualIntegrity=analyzeRitualIntegrity({initialCubeState:SOLVED,finalCubeState:RITUAL_FINAL,moves:RITUAL32});
  check('ritual.integrityConfirmed',ritualIntegrity.integrityConfirmed,true);
  check('ritual.moveCount',ritualIntegrity.moveCount,32);

  const stateManifest=buildSessionManifest({legality:solvedLegality,raw,interpretation});
  check('manifest.stateVerifies',verifySessionManifest(stateManifest),true);
  const tampered=structuredClone(stateManifest);
  tampered.outputs.hnk.glyphId='G40';
  check('manifest.tamperRejected',verifySessionManifest(tampered),false);

  const synthetic=buildSessionManifest(syntheticFixture());
  check('manifest.syntheticChecksum',synthetic.audit.checksum,MANIFEST_CHECKSUM);
  check('manifest.syntheticSessionId',synthetic.audit.sessionId,MANIFEST_SESSION_ID);

  check('hnk40.hash',HNK40_GLYPH_SET_SHA256,HNK40_HASH);
  check('hnk40.status',HNK40_STATUS,'PREPRODUCTION_NOT_OFFICIAL');

  const failed=checks.filter(item=>!item.passed);
  return Object.freeze({
    version:RC1_RUNTIME_SELFTEST_VERSION,
    releaseId:RC1_RELEASE_ID,
    passed:failed.length===0,
    totalChecks:checks.length,
    passedChecks:checks.length-failed.length,
    failedChecks:failed.length,
    protocols:Object.freeze({
      raw:ORACULUM_PROTOCOL,
      legality:CUBE_LEGALITY_VERSION,
      ritual:RITUAL_INTEGRITY_VERSION,
      manifest:SESSION_MANIFEST_VERSION,
      canonicalJson:SESSION_CANONICAL_JSON_VERSION,
    }),
    checks:Object.freeze(checks),
  });
}
