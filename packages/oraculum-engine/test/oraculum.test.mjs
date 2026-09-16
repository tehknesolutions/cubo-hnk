import test from 'node:test';
import assert from 'node:assert/strict';
import { HNK40_GLYPH_IDS, getGlyph } from '../src/hnk40-runtime.mjs';
import { DEFAULT_PROFILE_ID, ORACULUM_MODES, assertRuntimeGlyphCoverage, buildOracleCommit, dedupeSourceChains, runOracle } from '../src/index.mjs';

const SOLVED='000000000111111111222222222333333333444444444555555555';
const INTENT='Qual padrão precisa se manifestar?';
const EXPECTED_COMMIT='HNK-ORACULUM-CUBE/V0.4|STATE|Qual padrão precisa se manifestar?|000000000111111111222222222333333333444444444555555555|NULL';
const EXPECTED_SEED='df6bcd1bfd58288fb8f7d7e0f22b69d7e305a24429ba4445c242efc000e3b6fc';

test('same canonical input is byte-for-byte deterministic',()=>{const a=runOracle({intent:INTENT,cubeState:SOLVED});const b=runOracle({intent:INTENT,cubeState:SOLVED});assert.deepEqual(a,b);assert.equal(a.commit,EXPECTED_COMMIT);assert.equal(a.raw.seed256,EXPECTED_SEED);assert.equal(a.raw.binary.length,256);});

test('locked V0.4 vector decodes exact fields',()=>{const r=runOracle({intent:INTENT,cubeState:SOLVED});assert.equal(r.path32.index,24);assert.equal(r.hnk.glyphId,'G39');assert.equal(r.tarot.cardIndex,71);assert.equal(r.astrology.zodiac,'SAGITTARIUS');assert.equal(r.astrology.zodiacSelection.retryCount,1);assert.equal(r.astrology.planet,'MARS');assert.equal(r.astrology.planetSelection.retryCount,1);assert.equal(r.astrology.element,'AIR');assert.equal(r.alchemy.principle,'SALT');assert.equal(r.alchemy.phase,'CITRINITAS');assert.equal(r.numerology.raw,194);assert.equal(r.colors.essence,'#447DC7');assert.equal(r.colors.shadow,'#BB8238');assert.equal(r.colors.manifestation,'#7DC744');assert.deepEqual(r.iching.movingLines,[1,3,4]);assert.equal(r.iching.primary.kingWen,30);assert.equal(r.iching.resulting.kingWen,23);assert.equal(r.sigil.points.length,16);});

test('intent, cube and ritual validation remain fail-closed',()=>{const canonical=buildOracleCommit({intent:'  Qual   padrão\nprecisa se manifestar?  ',cubeState:SOLVED});assert.equal(canonical.intent,INTENT);assert.throws(()=>buildOracleCommit({intent:'A|B',cubeState:SOLVED}),/reserved separator/);assert.throws(()=>buildOracleCommit({intent:'Teste',cubeState:SOLVED.slice(1)}),/54 base-6/);const moves=Array.from({length:32},(_,i)=>['U','R','F2',"L'"][i%4]);assert.equal(buildOracleCommit({intent:'Teste',cubeState:SOLVED,mode:ORACULUM_MODES.RITUAL_32,moves}).moves.split(' ').length,32);});

test('profiles cannot mutate raw oracle',()=>{const a=runOracle({intent:INTENT,cubeState:SOLVED,profileId:DEFAULT_PROFILE_ID});const b=runOracle({intent:INTENT,cubeState:SOLVED,profileId:'TEST_PROFILE_V1'});assert.equal(a.raw.seed256,b.raw.seed256);assert.deepEqual(a.raw,b.raw);assert.deepEqual(a.hnk,b.hnk);assert.notEqual(a.profileId,b.profileId);});

test('source chain dedupe keeps strongest contribution',()=>{const d=dedupeSourceChains([{sourceChainId:'GD:MEM',signal:'WATER',score:1},{sourceChainId:'GD:MEM',signal:'HANGED_MAN',score:2},{sourceChainId:'ICHING:KAN',signal:'WATER',score:2}]);assert.equal(d.length,2);assert.equal(d.find(x=>x.sourceChainId==='GD:MEM').signal,'HANGED_MAN');});

test('standalone HNK40 adapter preserves 40 identities',()=>{assert.equal(assertRuntimeGlyphCoverage(),true);assert.equal(HNK40_GLYPH_IDS.length,40);assert.equal(HNK40_GLYPH_IDS[0],'G01');assert.equal(HNK40_GLYPH_IDS[39],'G40');assert.equal(getGlyph('G39').phonemeIpa,'/ɣ/');assert.equal(getGlyph('G39').worldId,'W4');});
