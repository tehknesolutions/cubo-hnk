import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'dist','HOC-V1.0-RC1-QA');

const entries=[
  'README.md',
  'package.json',
  'pnpm-workspace.yaml',
  'docs',
  'release/v1.0-rc1',
  'packages/oraculum-engine',
  'apps/web/app',
  'apps/web/test',
  'apps/web/package.json',
  'apps/web/tsconfig.json',
  'apps/web/next.config.ts'
];

rmSync(out,{recursive:true,force:true});
mkdirSync(out,{recursive:true});

for(const entry of entries){
  const source=join(root,entry);
  if(!existsSync(source))continue;
  const target=join(out,entry);
  mkdirSync(dirname(target),{recursive:true});
  cpSync(source,target,{recursive:true});
}

function walk(path){
  const files=[];
  for(const name of readdirSync(path)){
    const full=join(path,name);
    if(statSync(full).isDirectory())files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const hashes=walk(out)
  .filter(file=>!file.endsWith('SHA256SUMS.txt'))
  .map(file=>{
    const digest=createHash('sha256').update(readFileSync(file)).digest('hex');
    return `${digest}  ${relative(out,file).replaceAll('\\','/')}`;
  })
  .sort();

writeFileSync(join(out,'SHA256SUMS.txt'),`${hashes.join('\n')}\n`,'utf8');
writeFileSync(join(out,'BUNDLE_INFO.txt'),[
  'HOC V1.0 RC1 portable QA bundle',
  'Release: 1.0.0-rc.1',
  'Status: RELEASE_CANDIDATE',
  'Generated locally from the checked-out release/v1.0-rc1 tree.',
  'Verify file integrity with SHA256SUMS.txt.',
  ''
].join('\n'),'utf8');

console.log(`RC1 QA bundle created at ${out}`);
