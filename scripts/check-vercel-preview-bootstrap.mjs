import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

function readJson(path){return JSON.parse(readFileSync(resolve(path),'utf8'));}

const rootPackage=readJson('package.json');
const webPackage=readJson('apps/web/package.json');
const vercel=readJson('apps/web/vercel.json');
const workspace=readFileSync(resolve('pnpm-workspace.yaml'),'utf8');

assert.equal(rootPackage.version,'1.0.0-rc.1');
assert.equal(webPackage.version,'1.0.0-rc.1');
assert.equal(webPackage.dependencies?.['@hnk/oraculum-engine'],'workspace:*');
assert.match(workspace,/apps\/\*/);
assert.match(workspace,/packages\/\*/);
assert.equal(vercel.framework,'nextjs');
assert.equal(vercel.installCommand,'cd ../.. && pnpm install --no-frozen-lockfile');
assert.equal(vercel.buildCommand,'cd ../.. && pnpm --filter @hnk/cubo-web build');
assert.doesNotMatch(vercel.installCommand,/--prod\b/);
assert.doesNotMatch(vercel.buildCommand,/--prod\b/);

console.log('HOC Vercel preview bootstrap preflight: PASS');
console.log('Project root expected in Vercel: apps/web');
console.log('Deployment target: preview only; production promotion is not authorized.');
