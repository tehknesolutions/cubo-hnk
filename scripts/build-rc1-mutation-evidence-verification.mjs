import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {buildRc1MutationEvidenceVerification} from './lib/rc1-mutation-evidence-verification.mjs';

function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null;}
function required(name){const value=arg(name);if(!value)throw new Error(`${name} is required.`);return value;}
function readJson(path){return JSON.parse(readFileSync(resolve(path),'utf8'));}

try{
  const plan=readJson(required('--plan'));
  const authorization=readJson(required('--authorization'));
  const receipt=readJson(required('--receipt'));
  const observations=readJson(required('--observations'));
  const verifierLabel=required('--verifier');
  const method=required('--method');
  const acknowledged=process.argv.includes('--ack');
  const verifiedAt=arg('--verified-at')??new Date().toISOString();
  const out=resolve(arg('--out')??'dist/HOC-RC1-MUTATION-EVIDENCE-VERIFICATION.json');

  const record=buildRc1MutationEvidenceVerification({plan,authorization,receipt,observations,verifierLabel,method,acknowledged,verifiedAt});
  mkdirSync(dirname(out),{recursive:true});
  writeFileSync(out,`${JSON.stringify(record,null,2)}\n`,'utf8');
  console.log(`VERIFIED_EXTERNAL_EVIDENCE ${record.verificationFingerprint}`);
  console.log(out);
}catch(error){
  console.error(error instanceof Error?error.message:String(error));
  process.exitCode=1;
}
