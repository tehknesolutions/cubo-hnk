export type RitualFace = 'U'|'R'|'F'|'D'|'L'|'B';
export type RitualMove = `${RitualFace}` | `${RitualFace}'` | `${RitualFace}2`;

export interface RitualSequence {
  tokens: ReadonlyArray<string>;
  moveCount: number;
  normalized: string;
}

export interface RitualMismatch {
  index: number;
  face: RitualFace;
  position: number;
  row: number;
  column: number;
  expected: number;
  actual: number;
}

export interface RitualIntegrityInput {
  initialCubeState?: string;
  finalCubeState?: string;
  moves?: string | string[];
}

export const RITUAL_INTEGRITY_VERSION: 'HOC-RITUAL-INTEGRITY/V0.9';
export const RITUAL_MOVE_NOTATION: 'SINGMASTER_FACE_TURNS_V1';
export const RITUAL_REQUIRED_MOVE_COUNT: 32;
export const RITUAL_SIMULATOR_MODEL: Readonly<Record<string,unknown>>;

export function normalizeRitualMoveSequence(moves?: string|string[], options?:{requiredCount?:number|null}): Readonly<RitualSequence>;
export function applyCubeMove(cubeState:string, move:string): string;
export function simulateCubeMoves(initialCubeState:string, moves?:string|string[]): Readonly<{
  version:string;
  notation:string;
  initialState:string;
  normalizedMoves:string;
  moveCount:number;
  finalState:string;
}>;
export function invertMoveSequence(moves?:string|string[]): ReadonlyArray<string>;
export function analyzeRitualIntegrity(input?:RitualIntegrityInput): Readonly<Record<string,any>>;
export function assertRitualIntegrity(input?:RitualIntegrityInput): Readonly<Record<string,any>>;
