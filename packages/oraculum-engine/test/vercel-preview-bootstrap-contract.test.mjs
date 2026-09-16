import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const vercel=JSON.parse(readFileSync(new URL('../../../apps/web/vercel.json',import.meta.url),'utf8'));
const rootPackage=JSON.parse(readFileSync(new URL('../../../package.json',import.meta.url),'utf8'));
const audit=JSON.parse(readFileSync(new URL('../../../release/v1.0-rc1/AUDIT_STATUS.json',import.meta.url),'utf8'));
const doc=readFileSync(new URL('../../../docs/VERCEL_PREVIEW_BOOTSTRAP.md',import.meta.url),'utf8');

function gate(id){return audit.gates.find(item=>item.id===id);}

test('Vercel config builds the Next workspace from monorepo root',()=>{
  assert.equal(vercel.framework,'nextjs');
  assert.equal(vercel.installCommand,'cd ../.. && pnpm install --no-frozen-lockfile');
  assert.equal(vercel.buildCommand,'cd ../.. && pnpm --filter @hnk/cubo-web build');
  assert.doesNotMatch(vercel.installCommand,/--prod\b/);
  assert.doesNotMatch(vercel.buildCommand,/--prod\b/);
});

test('preview preflight is wired at workspace root',()=>{
  assert.equal(rootPackage.scripts['preview:preflight'],'node scripts/check-vercel-preview-bootstrap.mjs');
});

test('preview bootstrap does not masquerade as deployment verification',()=>{
  assert.equal(gate('previewBootstrap').status,'PASS');
  assert.equal(gate('previewBootstrap').level,'IMPLEMENTED');
  assert.equal(gate('deploymentVerification').status,'PENDING');
  assert.equal(audit.governance.stable,false);
  assert.equal(audit.governance.hnkCanonPromoted,false);
});

test('documentation freezes preview-only boundary',()=>{
  assert.match(doc,/Preview/i);
  assert.match(doc,/Root Directory: `apps\/web`/);
  assert.match(doc,/Do not use `vercel --prod`/);
  assert.match(doc,/PREVIEW_PROJECT_BOOTSTRAP_PENDING/);
  assert.match(doc,/does not replace/i);
});
