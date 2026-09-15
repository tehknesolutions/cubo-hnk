import { createHash } from 'node:crypto';
import { getGlyph, glyphIdFromNumber, HNK40_GLYPH_IDS } from './hnk40-runtime.mjs';

export const ORACULUM_PROTOCOL = 'HNK-ORACULUM-CUBE/V0.4';
export const ORACULUM_ENGINE_VERSION = '0.4.0-candidate';
export const DEFAULT_PROFILE_ID = 'HNK_ORACULUM_DEFAULT_V1';
export const ORACULUM_MODES = Object.freeze({ STATE: 'STATE', RITUAL_32: 'RITUAL_32' });

export const TRIGRAMS_BY_BOTTOM_TO_TOP_BITS = Object.freeze({
  '111': Object.freeze({ id: 'QIAN', symbol: '☰', image: 'HEAVEN' }),
  '110': Object.freeze({ id: 'DUI', symbol: '☱', image: 'LAKE' }),
  '101': Object.freeze({ id: 'LI', symbol: '☲', image: 'FIRE' }),
  '100': Object.freeze({ id: 'ZHEN', symbol: '☳', image: 'THUNDER' }),
  '011': Object.freeze({ id: 'XUN', symbol: '☴', image: 'WIND' }),
  '010': Object.freeze({ id: 'KAN', symbol: '☵', image: 'WATER' }),
  '001': Object.freeze({ id: 'GEN', symbol: '☶', image: 'MOUNTAIN' }),
  '000': Object.freeze({ id: 'KUN', symbol: '☷', image: 'EARTH' })
});

const TRIGRAM_ORDER = Object.freeze(['QIAN', 'DUI', 'LI', 'ZHEN', 'XUN', 'KAN', 'GEN', 'KUN']);
const KING_WEN_BY_LOWER_UPPER = Object.freeze([
  Object.freeze([1, 43, 14, 34, 9, 5, 26, 11]),
  Object.freeze([10, 58, 38, 54, 61, 60, 41, 19]),
  Object.freeze([13, 49, 30, 55, 37, 63, 22, 36]),
  Object.freeze([25, 17, 21, 51, 42, 3, 27, 24]),
  Object.freeze([44, 28, 50, 32, 57, 48, 18, 46]),
  Object.freeze([6, 47, 64, 40, 59, 29, 4, 7]),
  Object.freeze([33, 31, 56, 62, 53, 39, 52, 15]),
  Object.freeze([12, 45, 35, 16, 20, 8, 23, 2])
]);

const ICHING_LINE_STATES = Object.freeze({
  '00': Object.freeze({ polarity: 'YIN', moving: true, primary: 0, transformed: 1 }),
  '01': Object.freeze({ polarity: 'YIN', moving: false, primary: 0, transformed: 0 }),
  '10': Object.freeze({ polarity: 'YANG', moving: false, primary: 1, transformed: 1 }),
  '11': Object.freeze({ polarity: 'YANG', moving: true, primary: 1, transformed: 0 })
});

const ELEMENTS = Object.freeze(['FIRE', 'WATER', 'AIR', 'EARTH']);
const ALCHEMICAL_PRINCIPLES = Object.freeze(['MERCURY', 'SULFUR', 'SALT']);
const ALCHEMICAL_PHASES = Object.freeze(['NIGREDO', 'ALBEDO', 'CITRINITAS', 'RUBEDO']);
const ZODIAC = Object.freeze(['ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES']);
const CLASSICAL_PLANETS = Object.freeze(['SATURN', 'JUPITER', 'MARS', 'SUN', 'VENUS', 'MERCURY', 'MOON']);

function sha256Hex(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function hexToBinary(hex) {
  return [...Buffer.from(hex, 'hex')].map(byte => byte.toString(2).padStart(8, '0')).join('');
}

function readBits(binary, start, length) {
  return binary.slice(start, start + length);
}

function bitsToInt(bits) {
  return Number.parseInt(bits, 2);
}

function assertProfileId(profileId) {
  const value = String(profileId ?? DEFAULT_PROFILE_ID).trim();
  if (!/^[A-Z0-9_-]+$/.test(value)) throw new Error(`Invalid profileId: ${value}`);
  return value;
}

export function normalizeIntent(intent) {
  const value = String(intent ?? '').normalize('NFKC').trim().replace(/\s+/gu, ' ');
  if (!value) throw new Error('Intent must not be empty');
  if (value.includes('|')) throw new Error('Intent must not contain the reserved separator |');
  return value;
}

export function normalizeCubeState(cubeState) {
  const value = String(cubeState ?? '').replace(/\s+/gu, '');
  if (!/^[0-5]{54}$/.test(value)) throw new Error('Cube state must contain exactly 54 base-6 facelet digits (0..5)');
  for (const digit of '012345') {
    const count = [...value].filter(char => char === digit).length;
    if (count !== 9) throw new Error(`Cube state must contain exactly nine ${digit} facelets; got ${count}`);
  }
  return value;
}

export function normalizeMoves(mode, moves) {
  if (mode === ORACULUM_MODES.STATE) return 'NULL';
  if (mode !== ORACULUM_MODES.RITUAL_32) throw new Error(`Unsupported oraculum mode: ${mode}`);
  const tokens = Array.isArray(moves)
    ? moves.map(String)
    : String(moves ?? '').trim().split(/\s+/u).filter(Boolean);
  if (tokens.length !== 32) throw new Error(`RITUAL_32 requires exactly 32 moves; got ${tokens.length}`);
  for (const token of tokens) {
    if (!/^[URFDLB](?:2|')?$/.test(token)) throw new Error(`Invalid Singmaster move in RITUAL_32: ${token}`);
  }
  return tokens.join(' ');
}

export function buildOracleCommit({ intent, cubeState, mode = ORACULUM_MODES.STATE, moves, profileId = DEFAULT_PROFILE_ID }) {
  const normalizedIntent = normalizeIntent(intent);
  const normalizedCubeState = normalizeCubeState(cubeState);
  const normalizedProfileId = assertProfileId(profileId);
  const normalizedMoves = normalizeMoves(mode, moves);
  const commit = [ORACULUM_PROTOCOL, mode, normalizedIntent, normalizedCubeState, normalizedMoves].join('|');
  return Object.freeze({ protocol: ORACULUM_PROTOCOL, profileId: normalizedProfileId, mode, intent: normalizedIntent, cubeState: normalizedCubeState, moves: normalizedMoves, commit });
}

function pickBounded({ seedHex, fieldName, initialBits, limit }) {
  let candidate = bitsToInt(initialBits);
  if (candidate < limit) return Object.freeze({ value: candidate, retryCount: 0, source: 'MASTER_BITS' });
  const width = initialBits.length;
  for (let counter = 1; counter <= 1024; counter += 1) {
    const retryHex = sha256Hex(`${seedHex}|RETRY|${fieldName}|${counter}`);
    const retryBits = hexToBinary(retryHex).slice(0, width);
    candidate = bitsToInt(retryBits);
    if (candidate < limit) return Object.freeze({ value: candidate, retryCount: counter, source: 'RETRY_HASH' });
  }
  throw new Error(`Retry exhaustion for ${fieldName}`);
}

function trigramFromBits(bits) {
  const trigram = TRIGRAMS_BY_BOTTOM_TO_TOP_BITS[bits];
  if (!trigram) throw new Error(`Unknown trigram bits: ${bits}`);
  return trigram;
}

function kingWenNumber(lowerId, upperId) {
  const lower = TRIGRAM_ORDER.indexOf(lowerId);
  const upper = TRIGRAM_ORDER.indexOf(upperId);
  if (lower < 0 || upper < 0) throw new Error(`Unknown trigram pair: ${lowerId}/${upperId}`);
  return KING_WEN_BY_LOWER_UPPER[lower][upper];
}

function bottomFirstBinaryIndex(lines) {
  return lines.reduce((value, bit, index) => value + (bit << index), 0);
}

function decodeIChing(binary) {
  const lines = Array.from({ length: 6 }, (_, index) => {
    const code = readBits(binary, index * 2, 2);
    const state = ICHING_LINE_STATES[code];
    return Object.freeze({ line: index + 1, code, ...state });
  });
  const primaryLines = lines.map(line => line.primary);
  const transformedLines = lines.map(line => line.transformed);
  const movingLines = lines.filter(line => line.moving).map(line => line.line);
  const primaryLowerBits = primaryLines.slice(0, 3).join('');
  const primaryUpperBits = primaryLines.slice(3, 6).join('');
  const transformedLowerBits = transformedLines.slice(0, 3).join('');
  const transformedUpperBits = transformedLines.slice(3, 6).join('');
  const primaryLower = trigramFromBits(primaryLowerBits);
  const primaryUpper = trigramFromBits(primaryUpperBits);
  const transformedLower = trigramFromBits(transformedLowerBits);
  const transformedUpper = trigramFromBits(transformedUpperBits);
  return Object.freeze({
    lineOrder: 'BOTTOM_TO_TOP',
    lines: Object.freeze(lines),
    movingLines: Object.freeze(movingLines),
    primary: Object.freeze({ binaryBottomToTop: primaryLines.join(''), binaryIndex: bottomFirstBinaryIndex(primaryLines), lowerTrigram: primaryLower, upperTrigram: primaryUpper, kingWen: kingWenNumber(primaryLower.id, primaryUpper.id) }),
    resulting: Object.freeze({ binaryBottomToTop: transformedLines.join(''), binaryIndex: bottomFirstBinaryIndex(transformedLines), lowerTrigram: transformedLower, upperTrigram: transformedUpper, kingWen: kingWenNumber(transformedLower.id, transformedUpper.id) })
  });
}

function digitalSum(value) { return String(value).split('').reduce((sum, digit) => sum + Number(digit), 0); }
function digitalRoot(value) { if (value === 0) return 0; return 1 + ((value - 1) % 9); }
function isPrime(value) { if (value < 2) return false; for (let i = 2; i * i <= value; i += 1) if (value % i === 0) return false; return true; }
function primeFactors(value) { const factors=[]; let remaining=value; for(let divisor=2; divisor*divisor<=remaining; divisor+=1){ while(remaining%divisor===0){ factors.push(divisor); remaining/=divisor; } } if(remaining>1) factors.push(remaining); return factors; }
function triangularIndex(value) { const n=(Math.sqrt(8*value+1)-1)/2; return Number.isInteger(n)?n:null; }
function hexColorFromRgb(rgb) { return `#${rgb.map(value => value.toString(16).padStart(2, '0').toUpperCase()).join('')}`; }

function decodeColors(binary) {
  const colorBits = readBits(binary, 51, 24);
  const rgb = [0, 8, 16].map(offset => bitsToInt(colorBits.slice(offset, offset + 8)));
  const shadow = rgb.map(value => 255 - value);
  const manifestation = [rgb[1], rgb[2], rgb[0]];
  return Object.freeze({ essence: hexColorFromRgb(rgb), shadow: hexColorFromRgb(shadow), manifestation: hexColorFromRgb(manifestation), essenceRgb: Object.freeze(rgb), derivation: Object.freeze({ shadow: '0xFFFFFF XOR ESSENCE', manifestation: 'RGB->GBR byte rotation' }) });
}

function decodeSigil(binary) {
  const bits = readBits(binary, 128, 128);
  const points = Array.from({ length: 16 }, (_, index) => {
    const byte = bits.slice(index * 8, index * 8 + 8);
    return Object.freeze({ index: index + 1, x: bitsToInt(byte.slice(0, 4)), y: bitsToInt(byte.slice(4, 8)), byte });
  });
  return Object.freeze({ grid: '16x16', pointOrder: 'P01_TO_P16', points: Object.freeze(points) });
}

export function dedupeSourceChains(signals) {
  if (!Array.isArray(signals)) throw new TypeError('signals must be an array');
  const byChain = new Map();
  for (const signal of signals) {
    if (!signal || typeof signal !== 'object') throw new TypeError('Each signal must be an object');
    const sourceChainId = String(signal.sourceChainId ?? '').trim();
    if (!sourceChainId) throw new Error('Each signal requires sourceChainId');
    const score = Number(signal.score ?? 0);
    const current = byChain.get(sourceChainId);
    if (!current || score > current.score) byChain.set(sourceChainId, Object.freeze({ ...signal, sourceChainId, score }));
  }
  return Object.freeze([...byChain.values()]);
}

export function runOracle(input) {
  const canonical = buildOracleCommit(input);
  const seed256 = sha256Hex(canonical.commit);
  const binary = hexToBinary(seed256);
  const glyphPick = pickBounded({ seedHex: seed256, fieldName: 'HNK_GLYPH', initialBits: readBits(binary, 17, 6), limit: 40 });
  const tarotPick = pickBounded({ seedHex: seed256, fieldName: 'TAROT', initialBits: readBits(binary, 23, 7), limit: 78 });
  const zodiacPick = pickBounded({ seedHex: seed256, fieldName: 'ZODIAC', initialBits: readBits(binary, 30, 4), limit: 12 });
  const planetPick = pickBounded({ seedHex: seed256, fieldName: 'PLANET', initialBits: readBits(binary, 34, 3), limit: 7 });
  const alchemyPrinciplePick = pickBounded({ seedHex: seed256, fieldName: 'ALCHEMY_PRINCIPLE', initialBits: readBits(binary, 39, 2), limit: 3 });
  const glyphId = glyphIdFromNumber(glyphPick.value + 1);
  const glyph = getGlyph(glyphId);
  const numberRaw = bitsToInt(readBits(binary, 43, 8)) + 1;
  const phaseIndex = bitsToInt(readBits(binary, 41, 2));
  const elementIndex = bitsToInt(readBits(binary, 37, 2));
  const result = {
    protocol: canonical.protocol,
    engineVersion: ORACULUM_ENGINE_VERSION,
    profileId: canonical.profileId,
    mode: canonical.mode,
    canonicalInput: Object.freeze({ intent: canonical.intent, cubeState: canonical.cubeState, moves: canonical.moves }),
    commit: canonical.commit,
    raw: Object.freeze({ seed256, hex: seed256.toUpperCase(), binary }),
    iching: decodeIChing(binary),
    path32: Object.freeze({ index: bitsToInt(readBits(binary, 12, 5)) + 1, sourceBits: 'B012-B016' }),
    hnk: Object.freeze({ glyphId, phonemeIpa: glyph.phonemeIpa, worldId: glyph.worldId, runtimeVisualState: glyph.visualState, selection: glyphPick, sourceBits: 'B017-B022', authority: '@hnk/glyphs' }),
    tarot: Object.freeze({ cardIndex: tarotPick.value + 1, selection: tarotPick, sourceBits: 'B023-B029', profileRequiredForMeaning: true }),
    astrology: Object.freeze({ zodiac: ZODIAC[zodiacPick.value], zodiacIndex: zodiacPick.value + 1, zodiacSelection: zodiacPick, planet: CLASSICAL_PLANETS[planetPick.value], planetIndex: planetPick.value + 1, planetSelection: planetPick, element: ELEMENTS[elementIndex], elementIndex: elementIndex + 1 }),
    alchemy: Object.freeze({ principle: ALCHEMICAL_PRINCIPLES[alchemyPrinciplePick.value], principleSelection: alchemyPrinciplePick, phase: ALCHEMICAL_PHASES[phaseIndex] }),
    numerology: Object.freeze({ raw: numberRaw, digitalSum: digitalSum(numberRaw), digitalRoot: digitalRoot(numberRaw), binary: numberRaw.toString(2), hex: numberRaw.toString(16).toUpperCase(), parity: numberRaw % 2 === 0 ? 'EVEN' : 'ODD', isPrime: isPrime(numberRaw), primeFactors: Object.freeze(primeFactors(numberRaw)), triangularIndex: triangularIndex(numberRaw) }),
    colors: decodeColors(binary),
    synthesisVector: Object.freeze({ index: bitsToInt(readBits(binary, 75, 5)) + 1, status: 'RESERVED_PENDING_HNK_AUTHORING' }),
    derivationReservoir: readBits(binary, 80, 48),
    sigil: decodeSigil(binary),
    provenance: Object.freeze([
      Object.freeze({ field: 'ICHING', sourceBits: 'B000-B011', authority: 'HNK_DIGITAL_METHOD' }),
      Object.freeze({ field: 'PATH32', sourceBits: 'B012-B016', authority: 'HNK_PROTOCOL' }),
      Object.freeze({ field: 'HNK_GLYPH', sourceBits: 'B017-B022', authority: '@hnk/glyphs' }),
      Object.freeze({ field: 'TAROT_INDEX', sourceBits: 'B023-B029', authority: 'PROFILE_REQUIRED' }),
      Object.freeze({ field: 'ZODIAC', sourceBits: 'B030-B033', authority: 'PROFILE_REQUIRED' }),
      Object.freeze({ field: 'PLANET', sourceBits: 'B034-B036', authority: 'PROFILE_REQUIRED' }),
      Object.freeze({ field: 'ELEMENT', sourceBits: 'B037-B038', authority: 'HNK_AUTHORED_COMPUTATIONAL' }),
      Object.freeze({ field: 'ALCHEMY', sourceBits: 'B039-B042', authority: 'PROFILE_REQUIRED' }),
      Object.freeze({ field: 'NUMEROLOGY', sourceBits: 'B043-B050', authority: 'HNK_PROTOCOL' }),
      Object.freeze({ field: 'ESSENCE_COLOR', sourceBits: 'B051-B074', authority: 'HNK_PROTOCOL' }),
      Object.freeze({ field: 'SYNTHESIS_VECTOR', sourceBits: 'B075-B079', authority: 'RESERVED' }),
      Object.freeze({ field: 'DERIVATION_RESERVOIR', sourceBits: 'B080-B127', authority: 'RESERVED' }),
      Object.freeze({ field: 'SIGIL', sourceBits: 'B128-B255', authority: 'HNK_AUTHORED_COMPUTATIONAL' })
    ])
  };
  return Object.freeze(result);
}

export function assertRuntimeGlyphCoverage() {
  if (HNK40_GLYPH_IDS.length !== 40) throw new Error(`HNK40 cardinality drift: ${HNK40_GLYPH_IDS.length}`);
  return true;
}
