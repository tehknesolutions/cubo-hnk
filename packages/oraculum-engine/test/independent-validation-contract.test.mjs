import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const runner=readFileSync(new URL('../../../scripts/run-rc1-independent-validation.mjs',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../../../package.json',import.meta.url),'utf8'));
const audit=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/AUDIT_STATUS.json',import.meta.url),'utf8'));

function gate(id){
  const found=audit.gates.find(item=>item.id===id);
  assert.ok(found,`missing gate ${id}`);
  return found;
}

test('root package exposes independent RC1 validator',()=>{
  assert.equal(pkg.scripts['validate:rc1:independent'],'node scripts/run-rc1-independent-validation.mjs');
});

test('independent validator freezes evidence identity and governance boundary',()=>{
  assert.match(runner,/HOC-RC1-INDEPENDENT-VALIDATION-EVIDENCE\/V1/);
  assert.match(runner,/INDEPENDENT_EXECUTOR_EVIDENCE_NOT_GITHUB_CI/);
  assert.match(runner,/replacesGitHubCI:false/);
  assert.match(runner,/promotesStable:false/);
  assert.match(runner,/promotesHnkCanon:false/);
});

test('validation sequence includes frozen install tests typecheck check build and runtime self-test',()=>{
  const ordered=[
    "['pnpm','install','--frozen-lockfile']",
    "['pnpm','test']",
    "['pnpm','typecheck']",
    "['pnpm','check']",
    "['pnpm','--filter','@hnk/cubo-web','build']",
    'runRc1RuntimeSelfTest',
  ];
  let cursor=-1;
  for(const marker of ordered){
    const next=runner.indexOf(marker,cursor+1);
    assert.ok(next>cursor,`missing or out-of-order marker: ${marker}`);
    cursor=next;
  }
});

test('validator requires clean repository state before install, after install and after the full chain',()=>{
  assert.match(runner,/initialTreeClean/);
  assert.match(runner,/gitStatusAfterInstall/);
  assert.match(runner,/gitStatusAfterInstallClean/);
  assert.match(runner,/gitStatusFinal/);
  assert.match(runner,/gitStatusFinalClean/);
  assert.match(runner,/const passed=chainOk&&finalTreeClean&&/);
});

test('runner is cross-platform and avoids absolute cwd disclosure',()=>{
  assert.match(runner,/process\.platform==='win32'\?'corepack\.cmd':'corepack'/);
  assert.match(runner,/repositoryDirectory:basename\(process\.cwd\(\)\)/);
  assert.doesNotMatch(runner,/cwd:process\.cwd\(\)/);
});

test('runner records bounded log evidence and cryptographic hashes',()=>{
  assert.match(runner,/stdoutSha256:sha256\(stdout\)/);
  assert.match(runner,/stderrSha256:sha256\(stderr\)/);
  assert.match(runner,/MAX_CAPTURE_CHARS=200_000/);
  assert.match(runner,/slice\(-120\)/);
});

test('independent validation gate records reconciled evidence while CI stays blocked',()=>{
  assert.equal(gate('independentValidation').status,'PASS');
  assert.equal(gate('independentValidation').level,'EXECUTED_RECONCILED');
  assert.equal(gate('ciTypecheckBuild').status,'BLOCKED');
});
