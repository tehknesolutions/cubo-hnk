import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const ci=readFileSync(new URL('../../../.github/workflows/ci.yml',import.meta.url),'utf8');
const diagnostic=readFileSync(new URL('../../../.github/workflows/actions-runner-diagnostic.yml',import.meta.url),'utf8');
const runbook=readFileSync(new URL('../../../docs/GITHUB_ACTIONS_RECOVERY_RUNBOOK.md',import.meta.url),'utf8');

test('main CI exposes manual recovery while keeping PR/main triggers',()=>{
  assert.match(ci,/workflow_dispatch:/);
  assert.match(ci,/pull_request:/);
  assert.match(ci,/push:[\s\S]*branches:\s*\[main\]/);
  assert.match(ci,/permissions:[\s\S]*contents:\s*read/);
  assert.match(ci,/concurrency:[\s\S]*cancel-in-progress:\s*true/);
  assert.match(ci,/timeout-minutes:\s*20/);
  assert.match(ci,/pnpm install --frozen-lockfile/);
  assert.match(ci,/pnpm check/);
  assert.match(ci,/pnpm --filter @hnk\/cubo-web build/);
});

test('runner diagnostic is manual-only after pre-step localization',()=>{
  assert.match(diagnostic,/workflow_dispatch:/);
  assert.doesNotMatch(diagnostic,/pull_request:/);
  assert.doesNotMatch(diagnostic,/push:/);
  assert.match(diagnostic,/permissions:[\s\S]*contents:\s*read/);
  assert.match(diagnostic,/ubuntu-probe:[\s\S]*runs-on:\s*ubuntu-latest/);
  assert.match(diagnostic,/windows-probe:[\s\S]*runs-on:\s*windows-latest/);
  assert.match(diagnostic,/HOC_ACTIONS_RUNNER_PROBE=REACHED/);
});

test('recovery runbook preserves diagnostic and promotion boundaries',()=>{
  assert.match(runbook,/PRE_STEP_RUNNER_DISPATCH_OR_PROVISIONING_FAILURE/);
  assert.match(runbook,/Actions Runner Diagnostic/);
  assert.match(runbook,/Cubo HNK CI/);
  assert.match(runbook,/não autoriza merge ou stable/i);
  assert.match(runbook,/GITHUB_ACTIONS_SUPPORT_PACKET\.md/);
});
