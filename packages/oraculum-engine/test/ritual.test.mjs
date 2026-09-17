import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCubeLegality } from '../src/legality.mjs';
import {
  RITUAL_REQUIRED_MOVE_COUNT,
  analyzeRitualIntegrity,
  applyCubeMove,
  assertRitualIntegrity,
  invertMoveSequence,
  simulateCubeMoves
} from '../src/ritual.mjs';

const SOLVED='000000000111111111222222222333333333444444444555555555';
const RITUAL32=[
  'U','R','F','D','L','B',"U'","R'",'F2','D2','L2','B2','U2','R2',"F'","D'",
  "L'","B'",'U','F','R','B','L','D',"U'","F'","R'","B'","L'","D'",'U2','F2'
];
const RITUAL32_GOLDEN_FINAL='513004512451013254000425014533433235324540121221251340';

test('V0.9 keeps the ritual contract at exactly 32 moves',()=>{
  assert.equal(RITUAL_REQUIRED_MOVE_COUNT,32);
  assert.equal(RITUAL32.length,32);
});

test('each basic clockwise face turn preserves V0.8 mechanical legality',()=>{
  for (const face of ['U','R','F','D','L','B']) {
    const state=applyCubeMove(SOLVED,face);
    const legality=analyzeCubeLegality(state);
    assert.equal(legality.valid,true,`${face} must remain a legal 3x3 state`);
  }
});

test('four quarter turns and move + inverse return to identity',()=>{
  for (const face of ['U','R','F','D','L','B']) {
    let four=SOLVED;
    for (let i=0;i<4;i+=1) four=applyCubeMove(four,face);
    assert.equal(four,SOLVED,`${face}^4 must be identity`);
    assert.equal(applyCubeMove(applyCubeMove(SOLVED,face),`${face}'`),SOLVED,`${face} ${face}' must cancel`);
    assert.equal(applyCubeMove(SOLVED,`${face}2`),applyCubeMove(applyCubeMove(SOLVED,face),face),`${face}2 must equal two quarter turns`);
  }
});

test('an arbitrary sequence followed by its inverse returns exactly to its initial state',()=>{
  const sequence=['R','U',"R'","U'",'F2','L','D2',"B'"];
  const forward=simulateCubeMoves(SOLVED,sequence).finalState;
  const restored=simulateCubeMoves(forward,invertMoveSequence(sequence)).finalState;
  assert.equal(restored,SOLVED);
});

test('locked 32-move sequence reaches the V0.9 golden final state',()=>{
  assert.equal(simulateCubeMoves(SOLVED,RITUAL32).finalState,RITUAL32_GOLDEN_FINAL);
  assert.equal(analyzeCubeLegality(RITUAL32_GOLDEN_FINAL).valid,true);
});

test('exact initial + 32 recorded moves + exact final state passes ritual integrity',()=>{
  const expected=simulateCubeMoves(SOLVED,RITUAL32).finalState;
  assert.equal(expected,RITUAL32_GOLDEN_FINAL);
  const report=analyzeRitualIntegrity({initialCubeState:SOLVED,finalCubeState:expected,moves:RITUAL32});
  assert.equal(report.valid,true);
  assert.equal(report.integrityConfirmed,true);
  assert.equal(report.moveCount,32);
  assert.equal(report.expectedFinalState,expected);
  assert.equal(report.mismatches.length,0);
  assert.doesNotThrow(()=>assertRitualIntegrity({initialCubeState:SOLVED,finalCubeState:expected,moves:RITUAL32}));
});

test('a legal but wrong reported final state is rejected as FINAL_STATE_MISMATCH',()=>{
  const expected=simulateCubeMoves(SOLVED,RITUAL32).finalState;
  assert.notEqual(expected,SOLVED);
  const report=analyzeRitualIntegrity({initialCubeState:SOLVED,finalCubeState:SOLVED,moves:RITUAL32});
  assert.equal(report.valid,false);
  assert.ok(report.errors.some(item=>item.code==='FINAL_STATE_MISMATCH'));
  assert.ok(report.mismatches.length>0);
});

test('missing initial state and wrong move count fail closed',()=>{
  const missing=analyzeRitualIntegrity({finalCubeState:SOLVED,moves:RITUAL32});
  assert.ok(missing.errors.some(item=>item.code==='INITIAL_STATE_REQUIRED'));
  const short=analyzeRitualIntegrity({initialCubeState:SOLVED,finalCubeState:SOLVED,moves:RITUAL32.slice(0,31)});
  assert.ok(short.errors.some(item=>item.code==='MOVE_COUNT'));
});

test('mechanically impossible final state is rejected before ritual comparison',()=>{
  const chars=[...SOLVED];
  [chars[5],chars[10]]=[chars[10],chars[5]];
  const flippedEdge=chars.join('');
  const report=analyzeRitualIntegrity({initialCubeState:SOLVED,finalCubeState:flippedEdge,moves:RITUAL32});
  assert.equal(report.finalLegality.valid,false);
  assert.ok(report.errors.some(item=>item.code==='FINAL_STATE_ILLEGAL'));
  assert.equal(report.expectedFinalState,null);
});
