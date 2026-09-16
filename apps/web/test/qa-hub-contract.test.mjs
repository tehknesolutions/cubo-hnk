import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const hub=readFileSync(new URL('../app/oraculum/qa/Rc1QaClient.tsx',import.meta.url),'utf8');

test('RC1 QA hub links every release validation surface',()=>{
  assert.match(hub,/href="\/oraculum\/qa"/);
  assert.match(hub,/href="\/oraculum\/qa\/physical"/);
  assert.match(hub,/href="\/oraculum\/qa\/camera"/);
  assert.match(hub,/href="\/oraculum\/verify"/);
});

test('RC1 QA hub keeps CI/build as separate promotion gates',()=>{
  assert.match(hub,/Nenhum painel substitui CI, build ou promoção humana/);
  assert.match(hub,/instalação limpa, TypeScript, build Next\.js/);
});
