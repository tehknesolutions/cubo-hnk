import { analyzeCubeLegality } from './legality.mjs';

export const RITUAL_INTEGRITY_VERSION = 'HOC-RITUAL-INTEGRITY/V0.9';
export const RITUAL_MOVE_NOTATION = 'SINGMASTER_FACE_TURNS_V1';
export const RITUAL_REQUIRED_MOVE_COUNT = 32;

const FACE_ORDER = Object.freeze(['U','R','F','D','L','B']);
const FACE_FRAMES = Object.freeze({
  U:Object.freeze({normal:Object.freeze([0,0,1]),right:Object.freeze([1,0,0]),up:Object.freeze([0,-1,0])}),
  R:Object.freeze({normal:Object.freeze([1,0,0]),right:Object.freeze([0,-1,0]),up:Object.freeze([0,0,1])}),
  F:Object.freeze({normal:Object.freeze([0,1,0]),right:Object.freeze([1,0,0]),up:Object.freeze([0,0,1])}),
  D:Object.freeze({normal:Object.freeze([0,0,-1]),right:Object.freeze([1,0,0]),up:Object.freeze([0,1,0])}),
  L:Object.freeze({normal:Object.freeze([-1,0,0]),right:Object.freeze([0,1,0]),up:Object.freeze([0,0,1])}),
  B:Object.freeze({normal:Object.freeze([0,-1,0]),right:Object.freeze([-1,0,0]),up:Object.freeze([0,0,1])})
});

function error(code,message,meta={}) {
  return Object.freeze({code,message,meta:Object.freeze({...meta})});
}

function compactState(value) {
  return String(value ?? '').replace(/\s+/gu,'');
}

function add(a,b) { return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]; }
function scale(k,a) { return [k*a[0],k*a[1],k*a[2]]; }
function dot(a,b) { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
function key(position,normal) { return `${position.join(',')}|${normal.join(',')}`; }

const FACELETS = [];
const INDEX_BY_GEOMETRY = new Map();
for (let faceIndex=0; faceIndex<FACE_ORDER.length; faceIndex+=1) {
  const face=FACE_ORDER[faceIndex];
  const frame=FACE_FRAMES[face];
  for (let row=0; row<3; row+=1) {
    for (let column=0; column<3; column+=1) {
      const position=add(frame.normal,add(scale(column-1,frame.right),scale(1-row,frame.up)));
      const index=faceIndex*9+row*3+column;
      const entry=Object.freeze({index,face,row,column,position:Object.freeze(position),normal:frame.normal});
      FACELETS.push(entry);
      INDEX_BY_GEOMETRY.set(key(position,frame.normal),index);
    }
  }
}
Object.freeze(FACELETS);

function rotateClockwise(vector,normal) {
  const [x,y,z]=vector;
  const id=normal.join(',');
  if (id==='1,0,0') return [x,-z,y];
  if (id==='-1,0,0') return [x,z,-y];
  if (id==='0,1,0') return [z,y,-x];
  if (id==='0,-1,0') return [-z,y,x];
  if (id==='0,0,1') return [-y,x,z];
  if (id==='0,0,-1') return [y,-x,z];
  throw new Error(`Unsupported face normal ${id}`);
}

const QUARTER_TURN_PERMUTATION = Object.freeze(Object.fromEntries(FACE_ORDER.map(face=>{
  const normal=FACE_FRAMES[face].normal;
  const permutation=Array.from({length:54},(_,index)=>index);
  for (const facelet of FACELETS) {
    if (dot(facelet.position,normal)!==1) continue;
    const rotatedPosition=rotateClockwise(facelet.position,normal);
    const rotatedNormal=rotateClockwise(facelet.normal,normal);
    const target=INDEX_BY_GEOMETRY.get(key(rotatedPosition,rotatedNormal));
    if (!Number.isInteger(target)) throw new Error(`Geometry mapping failure for ${face} facelet ${facelet.index}`);
    permutation[target]=facelet.index;
  }
  return [face,Object.freeze(permutation)];
})));

function parseMoveToken(token) {
  const value=String(token ?? '').trim();
  if (!/^[URFDLB](?:2|')?$/.test(value)) throw new Error(`Invalid Singmaster move: ${value}`);
  const face=value[0];
  const turns=value.endsWith('2') ? 2 : value.endsWith("'") ? 3 : 1;
  return Object.freeze({token:value,face,turns});
}

export function normalizeRitualMoveSequence(moves,{requiredCount=null}={}) {
  const tokens=Array.isArray(moves)
    ? moves.map(value=>String(value).trim()).filter(Boolean)
    : String(moves ?? '').trim().split(/\s+/u).filter(Boolean);
  if (Number.isInteger(requiredCount) && tokens.length!==requiredCount) {
    throw new Error(`Ritual move sequence requires exactly ${requiredCount} moves; got ${tokens.length}`);
  }
  const parsed=tokens.map(parseMoveToken);
  return Object.freeze({tokens:Object.freeze(parsed.map(item=>item.token)),moveCount:parsed.length,normalized:parsed.map(item=>item.token).join(' ')});
}

function applyPermutation(state,permutation) {
  return permutation.map(sourceIndex=>state[sourceIndex]).join('');
}

export function applyCubeMove(cubeState,move) {
  let state=compactState(cubeState);
  if (!/^[0-5]{54}$/.test(state)) throw new Error('Cube state must contain exactly 54 base-6 digits (0..5)');
  const parsed=parseMoveToken(move);
  const permutation=QUARTER_TURN_PERMUTATION[parsed.face];
  for (let turn=0; turn<parsed.turns; turn+=1) state=applyPermutation(state,permutation);
  return state;
}

export function simulateCubeMoves(initialCubeState,moves) {
  const initialState=compactState(initialCubeState);
  if (!/^[0-5]{54}$/.test(initialState)) throw new Error('Initial cube state must contain exactly 54 base-6 digits (0..5)');
  const sequence=normalizeRitualMoveSequence(moves);
  let state=initialState;
  for (const token of sequence.tokens) state=applyCubeMove(state,token);
  return Object.freeze({
    version:RITUAL_INTEGRITY_VERSION,
    notation:RITUAL_MOVE_NOTATION,
    initialState,
    normalizedMoves:sequence.normalized,
    moveCount:sequence.moveCount,
    finalState:state
  });
}

export function invertMoveSequence(moves) {
  const sequence=normalizeRitualMoveSequence(moves);
  const inverted=[...sequence.tokens].reverse().map(token=>{
    if (token.endsWith('2')) return token;
    if (token.endsWith("'")) return token[0];
    return `${token}'`;
  });
  return Object.freeze(inverted);
}

function mismatchDescriptor(index,expected,actual) {
  const faceIndex=Math.floor(index/9);
  const position=index%9;
  return Object.freeze({
    index,
    face:FACE_ORDER[faceIndex],
    position:position+1,
    row:Math.floor(position/3)+1,
    column:(position%3)+1,
    expected:Number(expected),
    actual:Number(actual)
  });
}

export function analyzeRitualIntegrity({initialCubeState,finalCubeState,moves}={}) {
  const initialState=compactState(initialCubeState);
  const finalState=compactState(finalCubeState);
  const errors=[];

  if (!initialState) errors.push(error('INITIAL_STATE_REQUIRED','RITUAL_32 requires the physical cube state before the first move.'));

  let sequence=null;
  try {
    sequence=normalizeRitualMoveSequence(moves,{requiredCount:RITUAL_REQUIRED_MOVE_COUNT});
  } catch (cause) {
    const message=cause instanceof Error ? cause.message : String(cause);
    const code=/exactly 32/u.test(message) ? 'MOVE_COUNT' : 'INVALID_MOVE';
    errors.push(error(code,message));
  }

  const initialLegality=initialState ? analyzeCubeLegality(initialState) : null;
  const finalLegality=analyzeCubeLegality(finalState);
  if (initialLegality && !initialLegality.valid) {
    errors.push(error('INITIAL_STATE_ILLEGAL','Initial state is not mechanically reachable on a physical 3×3.',{codes:initialLegality.errors.map(item=>item.code)}));
  }
  if (!finalLegality.valid) {
    errors.push(error('FINAL_STATE_ILLEGAL','Final state is not mechanically reachable on a physical 3×3.',{codes:finalLegality.errors.map(item=>item.code)}));
  }

  let expectedFinalState=null;
  let mismatches=[];
  if (sequence && initialLegality?.valid && finalLegality.valid) {
    expectedFinalState=simulateCubeMoves(initialState,sequence.tokens).finalState;
    mismatches=[...expectedFinalState].flatMap((expected,index)=>expected===finalState[index] ? [] : [mismatchDescriptor(index,expected,finalState[index])]);
    if (mismatches.length) {
      errors.push(error('FINAL_STATE_MISMATCH','The reported final state does not equal initial state + the recorded 32 moves.',{mismatchCount:mismatches.length}));
    }
  }

  const valid=Boolean(sequence && initialLegality?.valid && finalLegality.valid && expectedFinalState===finalState && errors.length===0);
  return Object.freeze({
    version:RITUAL_INTEGRITY_VERSION,
    notation:RITUAL_MOVE_NOTATION,
    valid,
    integrityConfirmed:valid,
    initialState:initialState || null,
    reportedFinalState:finalState,
    expectedFinalState,
    normalizedMoves:sequence?.normalized ?? null,
    moveCount:sequence?.moveCount ?? null,
    initialLegality,
    finalLegality,
    mismatches:Object.freeze(mismatches),
    errors:Object.freeze(errors)
  });
}

export function assertRitualIntegrity(input) {
  const report=analyzeRitualIntegrity(input);
  if (!report.valid) {
    const codes=report.errors.map(item=>item.code).join(', ') || 'UNKNOWN';
    const failure=new Error(`RITUAL_32 integrity failure: ${codes}`);
    failure.name='RitualIntegrityError';
    failure.report=report;
    throw failure;
  }
  return report;
}

export const RITUAL_SIMULATOR_MODEL = Object.freeze({
  faceOrder:FACE_ORDER,
  scanProfile:'HOC-FACELET-SCAN-V1',
  legalityProfile:'HOC-CUBE-LEGALITY/V0.8',
  notation:RITUAL_MOVE_NOTATION,
  requiredMoveCount:RITUAL_REQUIRED_MOVE_COUNT,
  acceptedMoves:Object.freeze(FACE_ORDER.flatMap(face=>[face,`${face}'`,`${face}2`]))
});
