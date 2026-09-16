import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ORACULUM_PROTOCOL, runOracle } from '../src/index.mjs';
import { CUBE_LEGALITY_VERSION, analyzeCubeLegality } from '../src/legality.mjs';
import { RITUAL_INTEGRITY_VERSION, RITUAL_REQUIRED_MOVE_COUNT, analyzeRitualIntegrity, simulateCubeMoves } from '../src/ritual.mjs';
import { SESSION_MANIFEST_VERSION, SESSION_CANONICAL_JSON_VERSION } from '../src/manifest.mjs';
import { HNK40_GLYPH_SET_SHA256, HNK40_STATUS } from '../src/hnk40-runtime.mjs';

const packageJson=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const release=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/RELEASE_MANIFEST.json',import.meta.url),'utf8'));
const official=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/OFFICIAL_VECTORS.json',import.meta.url),'utf8'));

test('RC1 package and protocol identities are frozen',()=>{
  assert.equal(packageJson.version,'1.0.0-rc.1');
  assert.equal(release.releaseId,'HOC-V1.0-RC1');
  assert.equal(release.semver,'1.0.0-rc.1');
  assert.equal(ORACULUM_PROTOCOL,'HNK-ORACULUM-CUBE/V0.4');
  assert.equal(CUBE_LEGALITY_VERSION,'HOC-CUBE-LEGALITY/V0.8');
  assert.equal(RITUAL_INTEGRITY_VERSION,'HOC-RITUAL-INTEGRITY/V0.9');
  assert.equal(SESSION_MANIFEST_VERSION,'HOC-SESSION-MANIFEST/V0.10');
  assert.equal(SESSION_CANONICAL_JSON_VERSION,'HOC-CANONICAL-JSON/V1');
  assert.equal(release.protocols.raw,ORACULUM_PROTOCOL);
  assert.equal(release.protocols.cubeLegality,CUBE_LEGALITY_VERSION);
  assert.equal(release.protocols.ritualIntegrity,RITUAL_INTEGRITY_VERSION);
  assert.equal(release.protocols.sessionManifest,SESSION_MANIFEST_VERSION);
  assert.equal(release.protocols.canonicalJson,SESSION_CANONICAL_JSON_VERSION);
});

test('RC1 HNK40 structural identity is frozen without canon promotion',()=>{
  assert.equal(HNK40_STATUS,'PREPRODUCTION_NOT_OFFICIAL');
  assert.equal(HNK40_GLYPH_SET_SHA256,'78668df0f707952b7c280de52526abaa2b7900597fb8ff362a3a08641fd1bce5');
  assert.equal(release.hnk40.status,HNK40_STATUS);
  assert.equal(release.hnk40.glyphSetSha256,HNK40_GLYPH_SET_SHA256);
  assert.equal(release.hnk40.candidateOracleSemanticsRemainNonCanonical,true);
});

test('RC1 official STATE vector reproduces frozen RAW output',()=>{
  const vector=official.vectors.stateGolden;
  const legality=analyzeCubeLegality(vector.cubeState);
  assert.equal(legality.valid,true);
  const raw=runOracle({intent:vector.intent,cubeState:vector.cubeState,mode:vector.mode});
  assert.equal(raw.commit,vector.oracleCommit);
  assert.equal(raw.raw.seed256,vector.seed256);
  assert.equal(raw.path32.index,vector.expected.path32);
  assert.equal(raw.hnk.glyphId,vector.expected.hnkGlyphId);
  assert.equal(raw.tarot.cardIndex,vector.expected.tarotCardIndex);
  assert.equal(raw.astrology.zodiac,vector.expected.zodiac);
  assert.equal(raw.astrology.planet,vector.expected.planet);
  assert.equal(raw.astrology.element,vector.expected.element);
  assert.equal(raw.alchemy.principle,vector.expected.alchemyPrinciple);
  assert.equal(raw.alchemy.phase,vector.expected.alchemyPhase);
  assert.equal(raw.numerology.raw,vector.expected.numerologyRaw);
  assert.equal(raw.colors.essence,vector.expected.essenceColor);
  assert.equal(raw.colors.shadow,vector.expected.shadowColor);
  assert.equal(raw.colors.manifestation,vector.expected.manifestationColor);
  assert.equal(raw.iching.primary.kingWen,vector.expected.ichingPrimaryKingWen);
  assert.deepEqual(raw.iching.movingLines,vector.expected.movingLines);
  assert.equal(raw.iching.resulting.kingWen,vector.expected.ichingResultingKingWen);
});

test('RC1 official RITUAL_32 vector reproduces exact physical final state',()=>{
  const vector=official.vectors.ritualIntegrityGolden;
  assert.equal(vector.moves.length,RITUAL_REQUIRED_MOVE_COUNT);
  const simulated=simulateCubeMoves(vector.initialCubeState,vector.moves);
  assert.equal(simulated.finalState,vector.expectedFinalState);
  const report=analyzeRitualIntegrity({
    initialCubeState:vector.initialCubeState,
    finalCubeState:vector.expectedFinalState,
    moves:vector.moves,
  });
  assert.equal(report.valid,true);
  assert.equal(report.integrityConfirmed,true);
  assert.equal(report.moveCount,32);
});

test('RC1 manifest primitive is pinned to the independently cross-checked checksum',()=>{
  assert.equal(official.vectors.manifestSyntheticGolden.protocol,SESSION_MANIFEST_VERSION);
  assert.equal(official.vectors.manifestSyntheticGolden.canonicalJson,SESSION_CANONICAL_JSON_VERSION);
  assert.equal(official.vectors.manifestSyntheticGolden.checksum,'e8510e6f8eb299ef57ecc2481d7ac5e3e4b0dd754284c2c5728d48febbb60041');
  assert.equal(official.vectors.manifestSyntheticGolden.sessionId,'HOC-E8510E6F8EB299EF57ECC248');
});
