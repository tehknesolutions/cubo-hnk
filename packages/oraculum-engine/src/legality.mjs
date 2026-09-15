export const CUBE_LEGALITY_VERSION = 'HOC-CUBE-LEGALITY/V0.8';

const CENTER_INDEX_BY_FACE = Object.freeze({
  U: 4, R: 13, F: 22, D: 31, L: 40, B: 49
});

const FACE_DIGIT = Object.freeze({ U:0, R:1, F:2, D:3, L:4, B:5 });

const CORNERS = Object.freeze([
  Object.freeze({ id:'URF', facelets:Object.freeze([8,9,20]), colors:Object.freeze([0,1,2]) }),
  Object.freeze({ id:'UFL', facelets:Object.freeze([6,18,38]), colors:Object.freeze([0,2,4]) }),
  Object.freeze({ id:'ULB', facelets:Object.freeze([0,36,47]), colors:Object.freeze([0,4,5]) }),
  Object.freeze({ id:'UBR', facelets:Object.freeze([2,45,11]), colors:Object.freeze([0,5,1]) }),
  Object.freeze({ id:'DFR', facelets:Object.freeze([29,26,15]), colors:Object.freeze([3,2,1]) }),
  Object.freeze({ id:'DLF', facelets:Object.freeze([27,44,24]), colors:Object.freeze([3,4,2]) }),
  Object.freeze({ id:'DBL', facelets:Object.freeze([33,53,42]), colors:Object.freeze([3,5,4]) }),
  Object.freeze({ id:'DRB', facelets:Object.freeze([35,17,51]), colors:Object.freeze([3,1,5]) })
]);

const EDGES = Object.freeze([
  Object.freeze({ id:'UR', facelets:Object.freeze([5,10]), colors:Object.freeze([0,1]) }),
  Object.freeze({ id:'UF', facelets:Object.freeze([7,19]), colors:Object.freeze([0,2]) }),
  Object.freeze({ id:'UL', facelets:Object.freeze([3,37]), colors:Object.freeze([0,4]) }),
  Object.freeze({ id:'UB', facelets:Object.freeze([1,46]), colors:Object.freeze([0,5]) }),
  Object.freeze({ id:'DR', facelets:Object.freeze([32,16]), colors:Object.freeze([3,1]) }),
  Object.freeze({ id:'DF', facelets:Object.freeze([28,25]), colors:Object.freeze([3,2]) }),
  Object.freeze({ id:'DL', facelets:Object.freeze([30,43]), colors:Object.freeze([3,4]) }),
  Object.freeze({ id:'DB', facelets:Object.freeze([34,52]), colors:Object.freeze([3,5]) }),
  Object.freeze({ id:'FR', facelets:Object.freeze([23,12]), colors:Object.freeze([2,1]) }),
  Object.freeze({ id:'FL', facelets:Object.freeze([21,41]), colors:Object.freeze([2,4]) }),
  Object.freeze({ id:'BL', facelets:Object.freeze([50,39]), colors:Object.freeze([5,4]) }),
  Object.freeze({ id:'BR', facelets:Object.freeze([48,14]), colors:Object.freeze([5,1]) })
]);

function error(code, message, meta={}) {
  return Object.freeze({ code, message, meta:Object.freeze({...meta}) });
}

function permutationParity(permutation) {
  let inversions=0;
  for (let i=0;i<permutation.length;i+=1) {
    for (let j=i+1;j<permutation.length;j+=1) {
      if (permutation[i] > permutation[j]) inversions += 1;
    }
  }
  return inversions % 2;
}

function compactState(cubeState) {
  return String(cubeState ?? '').replace(/\s+/gu,'');
}

function duplicateIds(permutation, definitions) {
  const counts=new Map();
  for (const index of permutation) {
    if (!Number.isInteger(index)) continue;
    counts.set(index,(counts.get(index) ?? 0)+1);
  }
  return [...counts.entries()].filter(([,count])=>count>1).map(([index])=>definitions[index].id);
}

function decodeCorners(values, errors) {
  const permutation=[];
  const orientation=[];
  const pieces=[];
  for (let positionIndex=0; positionIndex<CORNERS.length; positionIndex+=1) {
    const position=CORNERS[positionIndex];
    const observed=position.facelets.map(index=>values[index]);
    const udIndex=observed.findIndex(color=>color===0 || color===3);
    if (udIndex < 0) {
      errors.push(error('UNKNOWN_CORNER',`Corner ${position.id} has no U/D sticker.`,{position:position.id,observed}));
      permutation.push(null); orientation.push(null);
      pieces.push(Object.freeze({position:position.id,cubie:null,orientation:null,observed:Object.freeze(observed)}));
      continue;
    }
    const c1=observed[(udIndex+1)%3];
    const c2=observed[(udIndex+2)%3];
    const cubieIndex=CORNERS.findIndex(candidate=>candidate.colors[1]===c1 && candidate.colors[2]===c2);
    if (cubieIndex < 0) {
      errors.push(error('UNKNOWN_CORNER',`Corner ${position.id} does not match a legal corner cubie.`,{position:position.id,observed}));
      permutation.push(null); orientation.push(null);
      pieces.push(Object.freeze({position:position.id,cubie:null,orientation:null,observed:Object.freeze(observed)}));
      continue;
    }
    const ori=udIndex % 3;
    permutation.push(cubieIndex); orientation.push(ori);
    pieces.push(Object.freeze({position:position.id,cubie:CORNERS[cubieIndex].id,orientation:ori,observed:Object.freeze(observed)}));
  }
  return { permutation, orientation, pieces };
}

function decodeEdges(values, errors) {
  const permutation=[];
  const orientation=[];
  const pieces=[];
  for (let positionIndex=0; positionIndex<EDGES.length; positionIndex+=1) {
    const position=EDGES[positionIndex];
    const observed=position.facelets.map(index=>values[index]);
    let cubieIndex=-1;
    let ori=null;
    for (let candidateIndex=0; candidateIndex<EDGES.length; candidateIndex+=1) {
      const colors=EDGES[candidateIndex].colors;
      if (observed[0]===colors[0] && observed[1]===colors[1]) {
        cubieIndex=candidateIndex; ori=0; break;
      }
      if (observed[0]===colors[1] && observed[1]===colors[0]) {
        cubieIndex=candidateIndex; ori=1; break;
      }
    }
    if (cubieIndex < 0) {
      errors.push(error('UNKNOWN_EDGE',`Edge ${position.id} does not match a legal edge cubie.`,{position:position.id,observed}));
      permutation.push(null); orientation.push(null);
      pieces.push(Object.freeze({position:position.id,cubie:null,orientation:null,observed:Object.freeze(observed)}));
      continue;
    }
    permutation.push(cubieIndex); orientation.push(ori);
    pieces.push(Object.freeze({position:position.id,cubie:EDGES[cubieIndex].id,orientation:ori,observed:Object.freeze(observed)}));
  }
  return { permutation, orientation, pieces };
}

export function analyzeCubeLegality(cubeState) {
  const state=compactState(cubeState);
  const errors=[];

  if (!/^[0-5]{54}$/.test(state)) {
    errors.push(error('INVALID_FORMAT','Cube state must contain exactly 54 base-6 digits (0..5).',{length:state.length}));
    return Object.freeze({
      version:CUBE_LEGALITY_VERSION,
      valid:false,
      mechanicallyReachable:false,
      state,
      errors:Object.freeze(errors),
      checks:Object.freeze({format:false,counts:false,centers:false,cubies:false,cornerOrientation:false,edgeOrientation:false,parity:false})
    });
  }

  const counts=Object.freeze(Array.from({length:6},(_,digit)=>[...state].filter(char=>Number(char)===digit).length));
  const countsOk=counts.every(count=>count===9);
  if (!countsOk) errors.push(error('COLOR_COUNT','Each calibrated digit must occur exactly nine times.',{counts}));

  const values=[...state].map(Number);
  let centersOk=true;
  for (const [face,index] of Object.entries(CENTER_INDEX_BY_FACE)) {
    const expected=FACE_DIGIT[face];
    if (values[index] !== expected) {
      centersOk=false;
      errors.push(error('CENTER_MISMATCH',`Center ${face} must equal calibrated digit ${expected}.`,{face,index,indexHuman:index%9+1,expected,actual:values[index]}));
    }
  }

  const corners=decodeCorners(values,errors);
  const edges=decodeEdges(values,errors);

  const cornersKnown=corners.permutation.every(Number.isInteger);
  const edgesKnown=edges.permutation.every(Number.isInteger);

  let cubiesOk=cornersKnown && edgesKnown;
  if (cornersKnown) {
    const duplicates=duplicateIds(corners.permutation,CORNERS);
    if (duplicates.length) {
      cubiesOk=false;
      errors.push(error('DUPLICATE_CORNER','One or more corner cubies appear more than once.',{duplicates}));
    }
    if (new Set(corners.permutation).size !== CORNERS.length) cubiesOk=false;
  }
  if (edgesKnown) {
    const duplicates=duplicateIds(edges.permutation,EDGES);
    if (duplicates.length) {
      cubiesOk=false;
      errors.push(error('DUPLICATE_EDGE','One or more edge cubies appear more than once.',{duplicates}));
    }
    if (new Set(edges.permutation).size !== EDGES.length) cubiesOk=false;
  }

  const cornerOrientationSum=corners.orientation.every(Number.isInteger) ? corners.orientation.reduce((sum,value)=>sum+value,0) : null;
  const cornerOrientationMod3=cornerOrientationSum===null ? null : cornerOrientationSum % 3;
  const cornerOrientationOk=cornerOrientationMod3===0;
  if (cornerOrientationMod3 !== null && !cornerOrientationOk) {
    errors.push(error('CORNER_TWIST_SUM','Corner orientation sum must be divisible by 3.',{sum:cornerOrientationSum,mod3:cornerOrientationMod3}));
  }

  const edgeOrientationSum=edges.orientation.every(Number.isInteger) ? edges.orientation.reduce((sum,value)=>sum+value,0) : null;
  const edgeOrientationMod2=edgeOrientationSum===null ? null : edgeOrientationSum % 2;
  const edgeOrientationOk=edgeOrientationMod2===0;
  if (edgeOrientationMod2 !== null && !edgeOrientationOk) {
    errors.push(error('EDGE_FLIP_SUM','Edge orientation sum must be even.',{sum:edgeOrientationSum,mod2:edgeOrientationMod2}));
  }

  let cornerParity=null;
  let edgeParity=null;
  let parityOk=false;
  if (cubiesOk) {
    cornerParity=permutationParity(corners.permutation);
    edgeParity=permutationParity(edges.permutation);
    parityOk=cornerParity===edgeParity;
    if (!parityOk) errors.push(error('PERMUTATION_PARITY_MISMATCH','Corner and edge permutations must have the same parity.',{cornerParity,edgeParity}));
  }

  const valid=countsOk && centersOk && cubiesOk && cornerOrientationOk && edgeOrientationOk && parityOk;
  return Object.freeze({
    version:CUBE_LEGALITY_VERSION,
    valid,
    mechanicallyReachable:valid,
    state,
    counts,
    errors:Object.freeze(errors),
    checks:Object.freeze({
      format:true,
      counts:countsOk,
      centers:centersOk,
      cubies:cubiesOk,
      cornerOrientation:cornerOrientationOk,
      edgeOrientation:edgeOrientationOk,
      parity:parityOk
    }),
    invariants:Object.freeze({
      cornerOrientationSum,
      cornerOrientationMod3,
      edgeOrientationSum,
      edgeOrientationMod2,
      cornerParity,
      edgeParity
    }),
    corners:Object.freeze(corners.pieces),
    edges:Object.freeze(edges.pieces)
  });
}

export function assertCubeLegality(cubeState) {
  const report=analyzeCubeLegality(cubeState);
  if (!report.valid) {
    const codes=report.errors.map(item=>item.code).join(', ') || 'UNKNOWN';
    const failure=new Error(`Mechanically illegal 3x3 cube state: ${codes}`);
    failure.name='CubeLegalityError';
    failure.report=report;
    throw failure;
  }
  return report;
}

export const CUBE_LEGALITY_MODEL = Object.freeze({
  faceOrder:Object.freeze(['U','R','F','D','L','B']),
  scanProfile:'HOC-FACELET-SCAN-V1',
  centers:CENTER_INDEX_BY_FACE,
  corners:CORNERS,
  edges:EDGES
});
