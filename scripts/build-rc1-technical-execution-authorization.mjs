import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {buildRc1TechnicalExecutionAuthorization} from './lib/rc1-technical-execution-authorization.mjs';

function fail(message){console.error(message);process.exitCode=1;}
function arg(name){const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]??null:null;}
function flag(name){return process.argv.includes(name);}
function parseSteps(value){return String(value??'').split(',').map(item=>item.trim()).filter(Boolean);}

const planPath=arg('--plan');
const steps=parseSteps(arg('--steps'));
const authorizerLabel=arg('--authorizer');
const rationale=arg('--reason');
const outPath=arg('--out')??'dist/HOC-RC1-TECHNICAL-EXECUTION-AUTHORIZATION.json';

if(!planPath)return fail('Missing --plan <promotion-execution-plan.json>.');
if(steps.length===0)return fail('Missing --steps <STEP_ID[,STEP_ID...]>; authorization is always explicit and step-scoped.');
if(!authorizerLabel)return fail('Missing --authorizer <label>.');
if(!rationale)return fail('Missing --reason <text>.');
if(!flag('--ack'))return fail('Missing --ack. Explicit technical-execution acknowledgement is required.');

try{
  const plan=JSON.parse(await readFile(resolve(planPath),'utf8'));
  const record=buildRc1TechnicalExecutionAuthorization({
    plan,
    authorizedStepIds:steps,
    authorizerLabel,
    rationale,
    acknowledged:true,
    stableBoundaryAcknowledged:flag('--ack-stable'),
    productionBoundaryAcknowledged:flag('--ack-production'),
  });
  const output=resolve(outPath);
  await mkdir(dirname(output),{recursive:true});
  await writeFile(output,`${JSON.stringify(record,null,2)}\n`,'utf8');
  console.log(`HOC RC1 technical execution authorization written: ${output}`);
  console.log(`Authorized steps: ${record.authorizedStepIds.length}/${record.authorizationScope.totalPlanSteps}`);
  console.log(`Plan fingerprint: ${record.sourcePlan.planFingerprint}`);
  console.log('This record does not execute any action. Only listed steps are authorized.');
}catch(error){
  fail(error instanceof Error?error.message:String(error));
}
