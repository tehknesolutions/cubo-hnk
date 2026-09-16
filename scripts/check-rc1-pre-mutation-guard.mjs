import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {evaluateRc1PreMutationGuard} from './lib/rc1-pre-mutation-guard.mjs';

function fail(message){console.error(message);process.exitCode=1;}
function arg(name){const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]??null:null;}

const planPath=arg('--plan');
const authorizationPath=arg('--authorization');
const statePath=arg('--state');
const stepId=arg('--step');

if(!planPath)return fail('Missing --plan <promotion-execution-plan.json>.');
if(!authorizationPath)return fail('Missing --authorization <technical-authorization.json>.');
if(!statePath)return fail('Missing --state <completed-prefix-state.json>.');
if(!stepId)return fail('Missing --step <STEP_ID>.');

try{
  const [plan,authorization,completedPrefixState]=await Promise.all([
    readFile(resolve(planPath),'utf8').then(JSON.parse),
    readFile(resolve(authorizationPath),'utf8').then(JSON.parse),
    readFile(resolve(statePath),'utf8').then(JSON.parse),
  ]);
  const result=evaluateRc1PreMutationGuard({plan,authorization,stepId,completedPrefixState});
  console.log(JSON.stringify(result,null,2));
  process.exitCode=result.decision==='ALLOW'?0:2;
}catch(error){
  fail(error instanceof Error?error.message:String(error));
}
