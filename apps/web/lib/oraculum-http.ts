import {NextResponse} from 'next/server';

export class HocPayloadTooLargeError extends Error {
  readonly status=413;
  constructor(readonly maxBytes:number){
    super(`Payload exceeds HOC endpoint limit of ${maxBytes} bytes`);
    this.name='HocPayloadTooLargeError';
  }
}

export class HocInvalidJsonError extends Error {
  readonly status=400;
  constructor(){
    super('Invalid JSON payload');
    this.name='HocInvalidJsonError';
  }
}

export async function readBoundedJson<T=unknown>(request:Request,maxBytes:number):Promise<T>{
  const declared=request.headers.get('content-length');
  if(declared!==null){
    const bytes=Number(declared);
    if(Number.isFinite(bytes)&&bytes>maxBytes)throw new HocPayloadTooLargeError(maxBytes);
  }

  const text=await request.text();
  const actualBytes=new TextEncoder().encode(text).byteLength;
  if(actualBytes>maxBytes)throw new HocPayloadTooLargeError(maxBytes);
  if(text.trim()==='')throw new HocInvalidJsonError();

  try{return JSON.parse(text) as T;}
  catch{throw new HocInvalidJsonError();}
}

export const HOC_NO_STORE_HEADERS=Object.freeze({
  'Cache-Control':'no-store, max-age=0',
  'Pragma':'no-cache',
  'X-Content-Type-Options':'nosniff',
});

export function hocJson(data:unknown,init:ResponseInit={}){
  const headers=new Headers(init.headers);
  for(const [key,value] of Object.entries(HOC_NO_STORE_HEADERS))headers.set(key,value);
  return NextResponse.json(data,{...init,headers});
}

export function hocErrorStatus(error:unknown,fallback=400){
  if(error instanceof HocPayloadTooLargeError)return error.status;
  if(error instanceof HocInvalidJsonError)return error.status;
  return fallback;
}
