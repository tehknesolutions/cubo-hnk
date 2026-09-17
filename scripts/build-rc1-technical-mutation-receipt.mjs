import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {buildRc1TechnicalMutationReceipt} from './lib/rc1-technical-mutation-receipt.mjs';

function fail(message){console.error(message);process.exitCode=1;}
function arg(name){const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]??null:null;}
function args(name){const values=[];for(let i=0;i<process.argv.length;i+=1){if(process.argv[i]===name&&process.argv[i+1])values.push(process.argv[i+1]);}return values;}
function parseEvidence(values){return values.map((entry,index)=>{const split=entry.indexOf('=');if(split<1||split===entry.length-1)throw new Error(`--evidence #${index+1} must use kind=value.`);return {kind:entry.slice(0,split),value:entry.slice(split+1)};});}

const planPath=arg('--plan');
const authorizationPath=arg('--authorization');
const guardPath=arg('--guard');
const result=arg('--result');
const executorLabel=arg('--executor');
const summary=arg('--summary');
const startedAt=arg('--started-at');
const evidenceRefs=parseEvidence(args('--evidence'));
const outPath=arg('--out')??'dist/HOC-RC1-TECHNICAL-MUTATION-RECEIPT.json';

if(!planPath)return fail('Missing --plan <promotion-execution-plan.json>.');
if(!authorizationPath)return fail('Missing --authorization <technical-authorization.json>.');
if(!guardPath)return fail('Missing --guard <pre-mutation-guard-allow.json>.');
if(!result)return fail('Missing --result <SUCCESS|FAILED|CANCELLED>.');
if(!executorLabel)return fail('Missing --executor <label>.');
if(!summary)return fail('Missing --summary <text>.');
if(!startedAt)return fail('Missing --started-at <ISO timestamp>.');

try{
  const [plan,authorization,guardDecision]=await Promise.all([
    readFile(resolve(planPath),'utf8').then(JSON.parse),
    readFile(resolve(authorizationPath),'utf8').then(JSON.parse),
    readFile(resolve(guardPath),'utf8').then(JSON.parse),
  ]);
  const receipt=buildRc1TechnicalMutationReceipt({plan,authorization,guardDecision,result,executorLabel,summary,evidenceRefs,startedAt});
  const output=resolve(outPath);
  await mkdir(dirname(output),{recursive:true});
  await writeFile(output,`${JSON.stringify(receipt,null,2)}\n`,'utf8');
  console.log(`HOC RC1 technical mutation receipt written: ${output}`);
  console.log(`Step: ${receipt.stepId}`);
  console.log(`Reported result: ${receipt.result}`);
  console.log('Verification status: UNVERIFIED_EXTERNAL_RESULT');
  console.log('This receipt does not advance the completed-step prefix and is not execution proof.');
}catch(error){
  fail(error instanceof Error?error.message:String(error));
}
