export interface Hnk40Glyph {
  glyphId: string;
  phonemeIpa: string;
  worldId: string;
  protoglyphColumn: number;
  visualState: string;
}
export const HNK40_STATUS: string;
export const HNK40_GLYPH_SET_SHA256: string;
export const HNK40_IPA: ReadonlyArray<string>;
export const HNK40_ENTRIES: ReadonlyArray<Readonly<Hnk40Glyph>>;
export const HNK40_GLYPH_IDS: ReadonlyArray<string>;
export const HNK40_BY_ID: Readonly<Record<string,Readonly<Hnk40Glyph>>>;
export function isGlyphId(value: unknown): value is string;
export function assertGlyphId(value: unknown): string;
export function glyphIdFromNumber(value: number): string;
export function getGlyph(value: unknown): Readonly<Hnk40Glyph>;
