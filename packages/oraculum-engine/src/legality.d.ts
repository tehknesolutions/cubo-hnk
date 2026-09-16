export interface CubeLegalityErrorItem {
  code:string;
  message:string;
  meta:Readonly<Record<string,unknown>>;
}
export interface CubeLegalityPiece {
  position:string;
  cubie:string|null;
  orientation:number|null;
  observed:ReadonlyArray<number>;
}
export interface CubeLegalityReport {
  version:string;
  valid:boolean;
  mechanicallyReachable:boolean;
  state:string;
  counts?:ReadonlyArray<number>;
  errors:ReadonlyArray<Readonly<CubeLegalityErrorItem>>;
  checks:Readonly<Record<string,boolean>>;
  invariants?:Readonly<{
    cornerOrientationSum:number|null;
    cornerOrientationMod3:number|null;
    edgeOrientationSum:number|null;
    edgeOrientationMod2:number|null;
    cornerParity:number|null;
    edgeParity:number|null;
  }>;
  corners?:ReadonlyArray<Readonly<CubeLegalityPiece>>;
  edges?:ReadonlyArray<Readonly<CubeLegalityPiece>>;
}
export const CUBE_LEGALITY_VERSION:string;
export const CUBE_LEGALITY_MODEL:Readonly<Record<string,unknown>>;
export function analyzeCubeLegality(cubeState:unknown):Readonly<CubeLegalityReport>;
export function assertCubeLegality(cubeState:unknown):Readonly<CubeLegalityReport>;
