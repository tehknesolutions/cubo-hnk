import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const route=readFileSync(new URL('../app/api/oraculum/rc1-selftest/route.ts',import.meta.url),'utf8');
const client=readFileSync(new URL('../app/oraculum/qa/Rc1QaClient.tsx',import.meta.url),'utf8');

test('RC1 self-test API uses the official engine self-test and fails closed',()=>{
  assert.match(route,/runRc1RuntimeSelfTest/);
  assert.match(route,/status: report\.passed \? 200 : 503/);
  assert.match(route,/Cache-Control/);
  assert.match(route,/X-HOC-RC1-Self-Test/);
});

test('RC1 QA dashboard re-runs the API and exposes per-check failures',()=>{
  assert.match(client,/fetch\('\/api\/oraculum\/rc1-selftest'/);
  assert.match(client,/Executar novamente/);
  assert.match(client,/report\.checks\.map/);
  assert.match(client,/expected:check\.expected,actual:check\.actual/);
});

test('RC1 QA dashboard does not claim to replace CI or physical QA',()=>{
  assert.match(client,/não substitui CI, build de produção nem QA com cubo físico/);
});
