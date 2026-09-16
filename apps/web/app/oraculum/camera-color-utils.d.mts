export type Rgb={r:number;g:number;b:number};
export function colorDistance(a:Rgb,b:Rgb):number;
export function rgbToHex(rgb:Rgb):string;
export function classifyRgb(sample:Rgb,prototypes:ReadonlyArray<Rgb>):Readonly<{bestDigit:number;bestDistance:number;secondDistance:number;confidence:number}>;
export function sampleNinePatches(data:ArrayLike<number>,width:number,height:number):ReadonlyArray<Readonly<Rgb>>;
