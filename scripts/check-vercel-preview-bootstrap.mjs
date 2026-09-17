import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

function readJson(path){return JSON.parse(readFileSync(resolve(path),'utf8'));}

const rootPackage=readJson('package.json');
const webPackage=readJson('apps/web/package.json');
const vercel=readJson('apps/web/vercel.json');
const workspace=readFileSync(resolve('pnpm-workspace.yaml'),'utf8');
const lockfile=readFileSync(resolve('pnpm-lock.yaml'),'utf8');

assert.equal(rootPackage.version,'1.0.0-rc.1');
assert.equal(rootPackage.packageManager,'pnpm@10.17.1');
assert.equal(webPackage.version,'1.0.0-rc.1');
assert.equal(webPackage.dependencies?.['@hnk/oraculum-engine'],'workspace:*');
assert.match(workspace,/apps\/\*/);
assert.match(workspace,/packages\/\*/);
assert.match(lockfile,/^lockfileVersion: '9\.0'/m);
assert.equal(vercel.framework,'nextjs');
assert.equal(vercel.installCommand,'cd ../.. && pnpm install --frozen-lockfile');
assert.doesNotMatch(vercel.installCommand,/--no-frozen-lockfile\b/);
assert.equal(vercel.buildCommand,'cd ../.. && pnpm --filter @hnk/cubo-web build');
assert.doesNotMatch(vercel.installCommand,/--prod\b/);
assert.doesNotMatch(vercel.buildCommand,/--prod\b/);

console.log('HOC Vercel preview bootstrap preflight: PASS');
console.log('Dependency graph policy: tracked pnpm-lock.yaml + pnpm@10.17.1 + --frozen-lockfile.');
console.log('Project root expected in Vercel: apps/web');
console.log('Deployment target: preview only; production promotion is not authorized.');
