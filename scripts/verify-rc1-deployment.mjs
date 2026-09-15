import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import process from 'node:process';

const EVIDENCE_VERSION='HOC-RC1-DEPLOYMENT-VERIFY-EVIDENCE/V1';
const RELEASE_ID='HOC-V1.0-RC1';
const GOLDEN_INTENT='Qual padrão precisa se manifestar?';
const GOLDEN_CUBE='000000000111111111222222222333333333444444444555555555';
const GOLDEN_SEED='df6bcd1bfd58288fb8f7d7e0f22b69d7e305a24429ba4445c242efc000e3b6fc';
const REQUEST_TIMEOUT_MS=20_000;
const MAX_BODY_CAPTURE=80_000;
const OUT_DIR=resolve('dist','rc1-deployment-validation');
const OUT_FILE=resolve(OUT_DIR,'HOC-RC1-DEPLOYMENT-VERIFY-EVIDENCE.json');

function sha256(text){return createHash('sha256').update(String(text??'')).digest('hex');}
function parseArgs(argv){
  let url=process.env.HOC_DEPLOY_URL??'';
  for(let index=0;index<argv.length;index+=1){
    const arg=argv[index];
    if(arg==='--url')url=argv[index+1]??'';
    else if(arg.startsWith('--url='))url=arg.slice(6);
  }
  if(!url)throw new Error('Deployment URL required. Use --url https://preview.example or HOC_DEPLOY_URL.');
  const parsed=new URL(url);
  const localhost=['localhost','127.0.0.1','::1'].includes(parsed.hostname);
  if(parsed.protocol!=='https:'&&!(localhost&&parsed.protocol==='http:'))throw new Error('Deployment URL must use HTTPS (HTTP allowed only for localhost).');
  return parsed.origin;
}
function clip(text){
  const value=String(text??'');
  return value.length<=MAX_BODY_CAPTURE?value:`${value.slice(0,MAX_BODY_CAPTURE)}\n...[truncated]`;
}
function headerIncludes(headers,name,expected){return String(headers.get(name)??'').toLowerCase().includes(String(expected).toLowerCase());}
function headerEquals(headers,name,expected){return String(headers.get(name)??'').toLowerCase()===String(expected).toLowerCase();}

async function request(base,path,options={}){
  const started=Date.now();
  try{
    const response=await fetch(`${base}${path}`,{
      ...options,
      redirect:'follow',
      cache:'no-store',
      signal:AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers:{'Accept':'application/json,text/html;q=0.9,*/*;q=0.8',...(options.headers??{})},
    });
    const text=await response.text();
    let json=null;
    try{json=text?JSON.parse(text):null;}catch{}
    return {
      ok:true,
      status:response.status,
      durationMs:Date.now()-started,
      finalUrl:new URL(response.url).pathname,
      headers:response.headers,
      text,
      json,
      bodySha256:sha256(text),
      bodyTail:clip(text).slice(-4000),
    };
  }catch(error){
    return {ok:false,status:null,durationMs:Date.now()-started,error:error instanceof Error?error.message:String(error),headers:new Headers(),text:'',json:null,bodySha256:sha256(''),bodyTail:''};
  }
}
function check(id,passed,detail,actual=null){return {id,passed:Boolean(passed),detail,actual};}
function responseSummary(result){return {reachable:result.ok,status:result.status,durationMs:result.durationMs,finalPath:result.finalUrl??null,bodySha256:result.bodySha256,error:result.error??null};}

const base=parseArgs(process.argv.slice(2));
const checks=[];

const selftest=await request(base,'/api/oraculum/rc1-selftest');
checks.push(check('selftest.http200',selftest.ok&&selftest.status===200,'Runtime self-test endpoint returns HTTP 200.',responseSummary(selftest)));
checks.push(check('selftest.pass',selftest.json?.report?.passed===true&&selftest.json?.ok===true,'Runtime self-test report is PASS.',selftest.json?{ok:selftest.json.ok,passed:selftest.json?.report?.passed,version:selftest.json?.report?.version}:null));
checks.push(check('selftest.header',headerEquals(selftest.headers,'x-hoc-rc1-self-test','PASS'),'Runtime self-test PASS header is present.',selftest.headers.get('x-hoc-rc1-self-test')));
checks.push(check('selftest.noStore',headerIncludes(selftest.headers,'cache-control','no-store'),'Runtime self-test response is no-store.',selftest.headers.get('cache-control')));

const page=await request(base,'/oraculum',{headers:{Accept:'text/html'}});
checks.push(check('page.http200',page.ok&&page.status===200,'Oraculum page is reachable.',responseSummary(page)));
checks.push(check('header.nosniff',headerEquals(page.headers,'x-content-type-options','nosniff'),'X-Content-Type-Options is nosniff.',page.headers.get('x-content-type-options')));
checks.push(check('header.frameDeny',headerEquals(page.headers,'x-frame-options','DENY'),'X-Frame-Options is DENY.',page.headers.get('x-frame-options')));
checks.push(check('header.referrer',headerEquals(page.headers,'referrer-policy','no-referrer'),'Referrer-Policy is no-referrer.',page.headers.get('referrer-policy')));
checks.push(check('header.coop',headerEquals(page.headers,'cross-origin-opener-policy','same-origin'),'COOP is same-origin.',page.headers.get('cross-origin-opener-policy')));
const permissions=String(page.headers.get('permissions-policy')??'');
checks.push(check('header.permissions.camera',permissions.includes('camera=(self)'),'Permissions-Policy allows same-origin camera.',permissions));
checks.push(check('header.permissions.microphone',permissions.includes('microphone=()'),'Permissions-Policy disables microphone.',permissions));
checks.push(check('header.permissions.geolocation',permissions.includes('geolocation=()'),'Permissions-Policy disables geolocation.',permissions));

const oraclePayload={intent:GOLDEN_INTENT,cubeState:GOLDEN_CUBE,mode:'STATE'};
const oracle=await request(base,'/api/oraculum',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(oraclePayload)});
const oracleSeed=oracle.json?.raw?.raw?.seed256??null;
const manifest=oracle.json?.manifest??null;
const sessionId=manifest?.audit?.sessionId??null;
const manifestChecksum=manifest?.audit?.checksum??null;
checks.push(check('oracle.http200',oracle.ok&&oracle.status===200&&oracle.json?.ok===true,'Golden STATE request returns HTTP 200.',responseSummary(oracle)));
checks.push(check('oracle.goldenSeed',oracleSeed===GOLDEN_SEED,'Deployment reproduces frozen RAW V0.4 golden seed.',oracleSeed));
checks.push(check('oracle.noStore',headerIncludes(oracle.headers,'cache-control','no-store'),'Oracle response is no-store.',oracle.headers.get('cache-control')));
checks.push(check('oracle.sessionHeader',sessionId&&oracle.headers.get('x-hoc-session-id')===sessionId,'Session ID response header matches manifest.',{header:oracle.headers.get('x-hoc-session-id'),body:sessionId}));
checks.push(check('oracle.checksumHeader',manifestChecksum&&oracle.headers.get('x-hoc-manifest-sha256')===manifestChecksum,'Manifest checksum response header matches manifest.',{header:oracle.headers.get('x-hoc-manifest-sha256'),body:manifestChecksum}));

let verify=null;
if(manifest){
  verify=await request(base,'/api/oraculum/manifest/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({manifest})});
  checks.push(check('manifestVerify.http200',verify.ok&&verify.status===200,'Manifest verifier returns HTTP 200 for generated manifest.',responseSummary(verify)));
  checks.push(check('manifestVerify.valid',verify.json?.valid===true&&verify.json?.sessionId===sessionId&&verify.json?.checksum===manifestChecksum,'Verifier reproduces same valid session identity.',verify.json?{valid:verify.json.valid,sessionId:verify.json.sessionId,checksum:verify.json.checksum}:null));
  checks.push(check('manifestVerify.noStore',headerIncludes(verify.headers,'cache-control','no-store'),'Manifest verifier response is no-store.',verify.headers.get('cache-control')));
}else{
  checks.push(check('manifestVerify.http200',false,'Manifest verifier could not run because oracle response had no manifest.',null));
  checks.push(check('manifestVerify.valid',false,'Manifest verifier could not run because oracle response had no manifest.',null));
  checks.push(check('manifestVerify.noStore',false,'Manifest verifier could not run because oracle response had no manifest.',null));
}

const malformed=await request(base,'/api/oraculum',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
checks.push(check('oracle.failClosed400',malformed.ok&&malformed.status===400&&malformed.json?.ok===false,'Malformed oracle request fails closed with HTTP 400.',responseSummary(malformed)));
checks.push(check('oracle.failClosedNoStore',headerIncludes(malformed.headers,'cache-control','no-store'),'Malformed oracle response is also no-store.',malformed.headers.get('cache-control')));

const passed=checks.every(item=>item.passed);
const evidence={
  evidenceKind:EVIDENCE_VERSION,
  releaseId:RELEASE_ID,
  generatedAt:new Date().toISOString(),
  passed,
  authority:'DEPLOYMENT_RUNTIME_EVIDENCE_NOT_PRODUCTION_PROMOTION',
  deployment:{origin:base,https:base.startsWith('https://')},
  golden:{intent:GOLDEN_INTENT,cubeStateSha256:sha256(GOLDEN_CUBE),expectedSeed256:GOLDEN_SEED,actualSeed256:oracleSeed,sessionId,manifestChecksum},
  checks,
  summary:{total:checks.length,passed:checks.filter(item=>item.passed).length,failed:checks.filter(item=>!item.passed).length},
  governance:{promotesStable:false,promotesHnkCanon:false,replacesGitHubCI:false,replacesPhysicalQa:false},
};

mkdirSync(OUT_DIR,{recursive:true});
writeFileSync(OUT_FILE,`${JSON.stringify(evidence,null,2)}\n`,'utf8');
console.log(`RC1 deployment verification: ${passed?'PASS':'FAIL'} (${evidence.summary.passed}/${evidence.summary.total})`);
console.log(`Evidence: ${OUT_FILE}`);
if(!passed)process.exitCode=1;
