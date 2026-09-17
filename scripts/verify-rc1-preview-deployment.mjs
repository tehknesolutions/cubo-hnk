import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import process from 'node:process';

const EVIDENCE_VERSION='HOC-RC1-PREVIEW-GATE-EVIDENCE/V1';
const EXPECTED_OWNER='tehknesolutions';
const EXPECTED_REPO='cubo-hnk';
const REQUEST_TIMEOUT_MS=20_000;
const OUT_DIR=resolve('dist','rc1-deployment-validation');
const OUT_FILE=resolve(OUT_DIR,'HOC-RC1-PREVIEW-GATE-EVIDENCE.json');

function parseArgs(argv){
  let url='';
  let commit='';
  for(let i=0;i<argv.length;i+=1){
    const arg=argv[i];
    if(arg==='--url')url=argv[i+1]??'';
    else if(arg.startsWith('--url='))url=arg.slice(6);
    else if(arg==='--commit')commit=argv[i+1]??'';
    else if(arg.startsWith('--commit='))commit=arg.slice(9);
  }
  if(!url)throw new Error('Preview URL required: --url https://<preview>.vercel.app');
  if(!commit)throw new Error('Expected Git commit is mandatory for preview verification: --commit <sha>.');
  const parsed=new URL(url);
  if(parsed.protocol!=='https:')throw new Error('Preview URL must use HTTPS.');
  const normalizedCommit=commit.trim().toLowerCase();
  if(!/^[0-9a-f]{7,64}$/u.test(normalizedCommit))throw new Error('Expected commit must be a 7-64 character hexadecimal Git SHA prefix.');
  return {base:parsed.origin,expectedCommit:normalizedCommit};
}

const {base,expectedCommit}=parseArgs(process.argv.slice(2));
const response=await fetch(`${base}/api/oraculum/release`,{cache:'no-store',signal:AbortSignal.timeout(REQUEST_TIMEOUT_MS),headers:{Accept:'application/json'}});
const body=await response.json().catch(()=>null);
const provenance=body?.provenance??null;
const actualCommit=typeof provenance?.git?.commitSha==='string'?provenance.git.commitSha.toLowerCase():null;
const checks=[
  ['release.http200',response.status===200&&body?.ok===true,{status:response.status}],
  ['preview.provider',provenance?.provider==='VERCEL',provenance?.provider??null],
  ['preview.environment',provenance?.environment==='preview',provenance?.environment??null],
  ['preview.deploymentId',Boolean(provenance?.deployment?.id),provenance?.deployment?.id??null],
  ['preview.gitRef',Boolean(provenance?.git?.commitRef),provenance?.git?.commitRef??null],
  ['preview.gitSha',Boolean(actualCommit),actualCommit],
  ['preview.expectedCommit',Boolean(actualCommit?.startsWith(expectedCommit)),{expected:expectedCommit,actual:actualCommit}],
  ['preview.repoOwner',provenance?.git?.repoOwner===EXPECTED_OWNER,provenance?.git?.repoOwner??null],
  ['preview.repoSlug',provenance?.git?.repoSlug===EXPECTED_REPO,provenance?.git?.repoSlug??null],
  ['preview.completeness',provenance?.completeness==='COMMIT_AND_REF',provenance?.completeness??null],
].map(([id,passed,actual])=>({id,passed:Boolean(passed),actual}));

const provenancePassed=checks.every(item=>item.passed);
let genericVerifier=null;
if(provenancePassed){
  const result=spawnSync(process.execPath,['scripts/verify-rc1-deployment.mjs','--url',base,'--commit',expectedCommit],{stdio:'inherit'});
  genericVerifier={status:result.status,signal:result.signal??null,passed:result.status===0};
}else{
  genericVerifier={status:null,signal:null,passed:false,skipped:'PREVIEW_PROVENANCE_GATE_FAILED'};
}

const passed=provenancePassed&&genericVerifier.passed;
const evidence={
  evidenceKind:EVIDENCE_VERSION,
  generatedAt:new Date().toISOString(),
  passed,
  authority:'PREVIEW_RUNTIME_EVIDENCE_NOT_PRODUCTION_PROMOTION',
  preview:{origin:base,expectedCommit,expectedOwner:EXPECTED_OWNER,expectedRepo:EXPECTED_REPO},
  provenance:{provider:provenance?.provider??null,environment:provenance?.environment??null,deploymentId:provenance?.deployment?.id??null,commitRef:provenance?.git?.commitRef??null,commitSha:actualCommit,repoOwner:provenance?.git?.repoOwner??null,repoSlug:provenance?.git?.repoSlug??null,completeness:provenance?.completeness??null},
  checks,
  genericVerifier,
  governance:{previewOnly:true,promotesProduction:false,promotesStable:false,promotesHnkCanon:false,replacesGitHubCI:false},
};

mkdirSync(OUT_DIR,{recursive:true});
writeFileSync(OUT_FILE,`${JSON.stringify(evidence,null,2)}\n`,'utf8');
console.log(`RC1 preview verification: ${passed?'PASS':'FAIL'}`);
console.log(`Evidence: ${OUT_FILE}`);
if(!passed)process.exitCode=1;
