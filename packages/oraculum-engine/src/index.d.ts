export type OraculumMode = 'STATE' | 'RITUAL_32';
export interface OracleInput { intent:string; cubeState:string; mode?:OraculumMode; moves?:string|string[]; profileId?:string; }
export interface CanonicalOracleCommit { protocol:string; profileId:string; mode:OraculumMode; intent:string; cubeState:string; moves:string; commit:string; }
export interface SourceSignal { sourceChainId:string; score?:number; [key:string]:unknown; }
export const ORACULUM_PROTOCOL:string;
export const ORACULUM_ENGINE_VERSION:string;
export const DEFAULT_PROFILE_ID:string;
export const ORACULUM_MODES:Readonly<{ STATE:'STATE'; RITUAL_32:'RITUAL_32' }>;
export const TRIGRAMS_BY_BOTTOM_TO_TOP_BITS:Readonly<Record<string,Readonly<{ id:string; symbol:string; image:string }>>>;
export function normalizeIntent(intent:unknown):string;
export function normalizeCubeState(cubeState:unknown):string;
export function normalizeMoves(mode:OraculumMode,moves?:string|string[]):string;
export function buildOracleCommit(input:OracleInput):Readonly<CanonicalOracleCommit>;
export function dedupeSourceChains<T extends SourceSignal>(signals:T[]):ReadonlyArray<T & {score:number}>;
export function assertRuntimeGlyphCoverage():true;
export interface OracleResult { protocol:string; engineVersion:string; profileId:string; mode:OraculumMode; canonicalInput:Readonly<{intent:string;cubeState:string;moves:string}>; commit:string; raw:Readonly<{seed256:string;hex:string;binary:string}>; iching:Readonly<Record<string,unknown>>; path32:Readonly<{index:number;sourceBits:string}>; hnk:Readonly<Record<string,unknown>>; tarot:Readonly<Record<string,unknown>>; astrology:Readonly<Record<string,unknown>>; alchemy:Readonly<Record<string,unknown>>; numerology:Readonly<Record<string,unknown>>; colors:Readonly<Record<string,unknown>>; synthesisVector:Readonly<Record<string,unknown>>; derivationReservoir:string; sigil:Readonly<Record<string,unknown>>; provenance:ReadonlyArray<Readonly<Record<string,unknown>>>; }
export function runOracle(input:OracleInput):Readonly<OracleResult>;
