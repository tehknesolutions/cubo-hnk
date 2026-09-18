import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {basename,resolve} from 'node:path';
import process from 'node:process';

const EVIDENCE_VERSION='HOC-RC1-INDEPENDENT-VALIDATION-EVIDENCE/V1';
const RELEASE_ID='HOC-V1.0-RC1';
const OUT_DIR=resolve('dist','rc1-validation');
const OUT_FILE=resolve(OUT_DIR,'HOC-RC1-INDEPENDENT-VALIDATION-EVIDENCE.json');
const MAX_CAPTURE_CHARS=200_000;
const COREPACK=process.platform==='win32'?'corepack.cmd':'corepack';

function sha256(text){return createHash('sha256').update(text).digest('hex');}
function clip(text){
  const value=String(text??'');
  if(value.length<=MAX_CAPTURE_CHARS)return value;
  return `${value.slice(0,MAX_CAPTURE_CHARS)}\n...[truncated ${value.length-MAX_CAPTURE_CHARS} chars]`;
}
function exec(command,args,{required=true,env={}}={}){
  const started=Date.now();
  const result=spawnSync(command,args,{encoding:'utf8',shell:false,env:{...process.env,...env},maxBuffer:20*1024*1024});
  const stdout=String(result.stdout??'');
  const stderr=String(result.stderr??'');
  const exitCode=typeof result.status==='number'?result.status:result.error?127:null;
  const passed=exitCode===0;
  return {
    command:[command,...args],
    required,
    passed,
    exitCode,
    signal:result.signal??null,
    durationMs:Date.now()-started,
    stdoutSha256:sha256(stdout),
    stderrSha256:sha256(stderr),
    stdoutTail:clip(stdout).split('\n').slice(-120).join('\n'),
    stderrTail:clip(stderr).split('\n').slice(-120).join('\n'),
    spawnError:result.error?String(result.error.message??result.error):null,
  };
}
function readPackageVersion(){
  try{return JSON.parse(readFileSync(resolve('package.json'),'utf8')).version??null;}
  catch{return null;}
}

mkdirSync(OUT_DIR,{recursive:true});

const environment={
  platform:process.platform,
  arch:process.arch,
  node:process.version,
  repositoryDirectory:basename(process.cwd()),
  packageVersion:readPackageVersion(),
};

const gitHead=exec('git',['rev-parse','HEAD'],{required:false});
const gitStatus=exec('git',['status','--porcelain'],{required:false});
const initialTreeClean=gitStatus.passed&&gitStatus.stdoutTail.trim()==='';
const pnpmVersion=exec(COREPACK,['pnpm','--version']);

const commands=[];
function run(command,args,options){
  const result=exec(command,args,options);
  commands.push(result);
  if(result.required&&!result.passed)return false;
  return true;
}

let chainOk=pnpmVersion.passed&&initialTreeClean;
let gitStatusAfterInstall=null;

if(chainOk)chainOk=run(COREPACK,['pnpm','install','--frozen-lockfile']);
if(chainOk){
  gitStatusAfterInstall=exec('git',['status','--porcelain'],{required:false});
  chainOk=gitStatusAfterInstall.passed&&gitStatusAfterInstall.stdoutTail.trim()==='';
}
if(chainOk)chainOk=run(COREPACK,['pnpm','test']);
if(chainOk)chainOk=run(COREPACK,['pnpm','typecheck']);
if(chainOk)chainOk=run(COREPACK,['pnpm','check']);
if(chainOk)chainOk=run(COREPACK,['pnpm','--filter','@hnk/cubo-web','build']);
if(chainOk)chainOk=run(process.execPath,['--input-type=module','-e',`import {runRc1RuntimeSelfTest} from './packages/oraculum-engine/src/selftest.mjs'; const r=runRc1RuntimeSelfTest(); console.log(JSON.stringify(r)); if(!r.passed) process.exit(1);`]);

const gitStatusFinal=exec('git',['status','--porcelain'],{required:false});
const finalTreeClean=gitStatusFinal.passed&&gitStatusFinal.stdoutTail.trim()==='';
const requiredResults=[pnpmVersion,...commands.filter(item=>item.required)];
const passed=chainOk&&finalTreeClean&&requiredResults.length>0&&requiredResults.every(item=>item.passed);

const evidence={
  evidenceKind:EVIDENCE_VERSION,
  releaseId:RELEASE_ID,
  generatedAt:new Date().toISOString(),
  passed,
  authority:'INDEPENDENT_EXECUTOR_EVIDENCE_NOT_GITHUB_CI',
  environment,
  repository:{
    gitHead:gitHead.passed?gitHead.stdoutTail.trim():null,
    gitStatusClean:initialTreeClean,
    gitStatusSha256:gitStatus.stdoutSha256,
    gitStatusAfterInstallClean:gitStatusAfterInstall?gitStatusAfterInstall.passed&&gitStatusAfterInstall.stdoutTail.trim()==='':null,
    gitStatusAfterInstallSha256:gitStatusAfterInstall?.stdoutSha256??null,
    gitStatusFinalClean:finalTreeClean,
    gitStatusFinalSha256:gitStatusFinal.stdoutSha256,
  },
  bootstrap:{pnpmVersion},
  commands,
  summary:{
    requiredCommands:requiredResults.length,
    passedCommands:requiredResults.filter(item=>item.passed).length,
    failedCommands:requiredResults.filter(item=>!item.passed).length,
  },
  governance:{
    replacesGitHubCI:false,
    promotesStable:false,
    promotesHnkCanon:false,
    note:'Independent real-executor evidence only. GitHub CI remains a separate release gate unless human governance explicitly changes that requirement.',
  },
};

writeFileSync(OUT_FILE,`${JSON.stringify(evidence,null,2)}\n`,'utf8');
console.log(`RC1 independent validation: ${passed?'PASS':'FAIL'}`);
console.log(`Evidence: ${OUT_FILE}`);
if(!passed)process.exitCode=1;
