import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {buildRc1CompletedPrefixGenesis,buildRc1CompletedPrefixTransition} from './lib/rc1-completed-prefix-transition.mjs';

function arg(name){const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]:null;}
function readJson(path,label){if(!path)throw new Error(`${label} path is required.`);return JSON.parse(readFileSync(resolve(path),'utf8'));}

try{
  const plan=readJson(arg('--plan'),'--plan');
  const authorization=readJson(arg('--authorization'),'--authorization');
  const receipt=readJson(arg('--receipt'),'--receipt');
  const verification=readJson(arg('--verification'),'--verification');
  const statePath=arg('--state');
  const currentState=statePath?readJson(statePath,'--state'):buildRc1CompletedPrefixGenesis({plan});
  const transitionedAt=arg('--transitioned-at')??new Date().toISOString();
  const transitionId=arg('--transition-id');
  const out=resolve(arg('--out')??'dist/HOC-RC1-COMPLETED-PREFIX-TRANSITION.json');
  const stateOut=resolve(arg('--state-out')??'dist/HOC-RC1-COMPLETED-PREFIX-STATE.json');

  const transition=buildRc1CompletedPrefixTransition({plan,authorization,receipt,verification,currentState,transitionedAt,transitionId});
  mkdirSync(dirname(out),{recursive:true});
  mkdirSync(dirname(stateOut),{recursive:true});
  writeFileSync(out,`${JSON.stringify(transition,null,2)}\n`,'utf8');
  writeFileSync(stateOut,`${JSON.stringify(transition.nextState,null,2)}\n`,'utf8');
  console.log(`Completed-prefix transition recorded: ${transition.result.fromCount} -> ${transition.result.toCount}`);
  console.log(`Step: ${transition.result.appendedStepId}`);
  console.log(`Transition fingerprint: ${transition.transitionFingerprint}`);
  console.log(`Next-state fingerprint: ${transition.nextState.stateFingerprint}`);
  console.log(`Transition JSON: ${out}`);
  console.log(`State JSON: ${stateOut}`);
  console.log('No technical mutation, merge, deployment or HNK_CANON promotion was executed by this command.');
}catch(error){
  console.error(`Completed-prefix transition failed: ${error instanceof Error?error.message:String(error)}`);
  process.exitCode=1;
}
