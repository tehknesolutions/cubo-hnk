import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildRc1PromotionExecutionPlan} from './lib/rc1-promotion-execution-plan.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const DEFAULT_STACK=resolve(ROOT,'release/v1.0-rc1/STACK_LANDING_PLAN.json');
const DEFAULT_OUT=resolve(ROOT,'dist/HOC-RC1-PROMOTION-EXECUTION-PLAN.json');

function readArg(name){
  const index=process.argv.indexOf(name);
  return index>=0?process.argv[index+1]??null:null;
}

function help(){
  console.log(`Usage:\n  pnpm plan:rc1:promotion -- --decision <approved-decision.json> [--stack <STACK_LANDING_PLAN.json>] [--out <output.json>]\n\nThis command is DRY-RUN ONLY. It does not merge PRs, change versions, create tags/releases or deploy.`);
}

if(process.argv.includes('--help')||process.argv.includes('-h')){
  help();
  process.exit(0);
}

const decisionArg=readArg('--decision');
if(!decisionArg){
  help();
  throw new Error('Missing required --decision <approved-decision.json>.');
}

const decisionPath=resolve(process.cwd(),decisionArg);
const stackPath=resolve(process.cwd(),readArg('--stack')??DEFAULT_STACK);
const outPath=resolve(process.cwd(),readArg('--out')??DEFAULT_OUT);

const [decisionRecord,stackPlan]=await Promise.all([
  readFile(decisionPath,'utf8').then(JSON.parse),
  readFile(stackPath,'utf8').then(JSON.parse),
]);

const plan=buildRc1PromotionExecutionPlan({decisionRecord,stackPlan});
await mkdir(dirname(outPath),{recursive:true});
await writeFile(outPath,`${JSON.stringify(plan,null,2)}\n`,'utf8');

console.log(`Promotion execution plan written: ${outPath}`);
console.log(`Mode: ${plan.mode}`);
console.log(`Steps: ${plan.summary.totalSteps} (${plan.summary.stackLandingSteps} stack landing)`);
console.log(`Execution authorized: ${plan.governance.executionAuthorized}`);
