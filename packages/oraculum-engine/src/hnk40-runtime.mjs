export const HNK40_STATUS = 'PREPRODUCTION_NOT_OFFICIAL';
export const HNK40_GLYPH_SET_SHA256 = '78668df0f707952b7c280de52526abaa2b7900597fb8ff362a3a08641fd1bce5';
export const HNK40_IPA = Object.freeze(['/a/','/e/','/i/','/o/','/u/','/ə/','/h/','/ʔ/','/ʕ/','/ħ/','/m/','/n/','/ŋ/','/l/','/r/','/j/','/w/','/b/','/d/','/g/','/p/','/t/','/k/','/q/','/f/','/s/','/ʃ/','/x/','/θ/','/ts/','/v/','/z/','/ʒ/','/ð/','/tʃ/','/dʒ/','/sˤ/','/tˤ/','/ɣ/','/y/']);

const GID_RE = /^G(?:0[1-9]|[1-3][0-9]|40)$/;

export const HNK40_ENTRIES = Object.freeze(HNK40_IPA.map((phonemeIpa,index)=>{
  const n=index+1;
  const glyphId=`G${String(n).padStart(2,'0')}`;
  return Object.freeze({
    glyphId,
    phonemeIpa,
    worldId:`W${Math.floor(index/10)+1}`,
    protoglyphColumn:(index%10)+1,
    visualState:'VISUAL_FROZEN_CANDIDATE'
  });
}));

export const HNK40_GLYPH_IDS = Object.freeze(HNK40_ENTRIES.map(entry=>entry.glyphId));
export const HNK40_BY_ID = Object.freeze(Object.fromEntries(HNK40_ENTRIES.map(entry=>[entry.glyphId,entry])));

export function isGlyphId(value) {
  return typeof value === 'string' && GID_RE.test(value);
}

export function assertGlyphId(value) {
  if (!isGlyphId(value)) throw new RangeError(`Invalid HNK40 glyph id: ${String(value)}`);
  return value;
}

export function glyphIdFromNumber(value) {
  if (!Number.isInteger(value) || value < 1 || value > 40) throw new RangeError(`HNK40 glyph number must be 1..40: ${value}`);
  return `G${String(value).padStart(2,'0')}`;
}

export function getGlyph(value) {
  return HNK40_BY_ID[assertGlyphId(value)];
}
