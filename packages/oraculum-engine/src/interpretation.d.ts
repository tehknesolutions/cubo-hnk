export interface InterpretationSignal { category:string; key:string; family:string; sourceChainId:string; score:number; authority:string; origin:string; phase:'PRIMARY'|'RESULTING'; meta:Readonly<Record<string,unknown>>; }
export interface InterpretationOptions { profileId?:string; includeResultingIChing?:boolean; }
export function buildInterpretationSignals(rawResult:Readonly<Record<string,any>>,options?:InterpretationOptions):ReadonlyArray<Readonly<InterpretationSignal>>;
export function analyzeConvergences(signals:ReadonlyArray<Readonly<InterpretationSignal>>):ReadonlyArray<Readonly<Record<string,unknown>>>;
export function analyzeTensions(signals:ReadonlyArray<Readonly<InterpretationSignal>>,options?:{profileId?:string}):ReadonlyArray<Readonly<Record<string,unknown>>>;
export function interpretOracle(rawResult:Readonly<Record<string,any>>,options?:InterpretationOptions):Readonly<Record<string,unknown>>;
