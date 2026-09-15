import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCubeLegality, assertCubeLegality, CUBE_LEGALITY_VERSION } from '../src/legality.mjs';

const SOLVED='000000000111111111222222222333333333444444444555555555';
const LEGAL_TOP_TURN='000000000222111111444222222333333333555444444111555555';

function swap(state,a,b){
  const chars=[...state];
  [chars[a],chars[b]]=[chars[b],chars[a]];
  return chars.join('');
}

function twistUrf(state){
  const chars=[...state];
  const values=[chars[8],chars[9],chars[20]];
  [chars[8],chars[9],chars[20]]=[values[1],values[2],values[0]];
  return chars.join('');
}

test('solved cube is mechanically reachable',()=>{
  const report=analyzeCubeLegality(SOLVED);
  assert.equal(report.version,CUBE_LEGALITY_VERSION);
  assert.equal(report.valid,true);
  assert.equal(report.errors.length,0);
  assert.equal(report.invariants.cornerOrientationMod3,0);
  assert.equal(report.invariants.edgeOrientationMod2,0);
  assert.equal(report.invariants.cornerParity,0);
  assert.equal(report.invariants.edgeParity,0);
});

test('a non-solved legal top-layer turn remains reachable',()=>{
  const report=analyzeCubeLegality(LEGAL_TOP_TURN);
  assert.equal(report.valid,true);
  assert.equal(report.invariants.cornerParity,1);
  assert.equal(report.invariants.edgeParity,1);
});

test('9/9 color counts do not hide a single flipped edge',()=>{
  const state=swap(SOLVED,7,19);
  assert.deepEqual(Array.from({length:6},(_,digit)=>[...state].filter(char=>Number(char)===digit).length),[9,9,9,9,9,9]);
  const report=analyzeCubeLegality(state);
  assert.equal(report.valid,false);
  assert.ok(report.errors.some(item=>item.code==='EDGE_FLIP_SUM'));
});

test('single twisted corner is rejected',()=>{
  const report=analyzeCubeLegality(twistUrf(SOLVED));
  assert.equal(report.valid,false);
  assert.ok(report.errors.some(item=>item.code==='CORNER_TWIST_SUM'));
});

test('odd edge permutation with solved corners is rejected by parity',()=>{
  const state=swap(SOLVED,10,19);
  const report=analyzeCubeLegality(state);
  assert.equal(report.valid,false);
  assert.ok(report.errors.some(item=>item.code==='PERMUTATION_PARITY_MISMATCH'));
  assert.equal(report.invariants.cornerParity,0);
  assert.equal(report.invariants.edgeParity,1);
});

test('calibrated centers are enforced',()=>{
  const state=swap(SOLVED,4,13);
  const report=analyzeCubeLegality(state);
  assert.equal(report.valid,false);
  assert.ok(report.errors.some(item=>item.code==='CENTER_MISMATCH'));
});

test('assertCubeLegality fails closed with a structured report',()=>{
  const state=swap(SOLVED,7,19);
  assert.throws(()=>assertCubeLegality(state),error=>{
    assert.equal(error.name,'CubeLegalityError');
    assert.equal(error.report.valid,false);
    assert.ok(error.report.errors.some(item=>item.code==='EDGE_FLIP_SUM'));
    return true;
  });
});
