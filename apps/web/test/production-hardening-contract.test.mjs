import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const oracle=readFileSync(new URL('app/api/oraculum/route.ts',root),'utf8');
const verify=readFileSync(new URL('app/api/oraculum/manifest/verify/route.ts',root),'utf8');
const physical=readFileSync(new URL('app/api/oraculum/qa/physical/route.ts',root),'utf8');
const selftest=readFileSync(new URL('app/api/oraculum/rc1-selftest/route.ts',root),'utf8');
const helper=readFileSync(new URL('lib/oraculum-http.ts',root),'utf8');
const nextConfig=readFileSync(new URL('next.config.ts',root),'utf8');

const protectedRoutes=[oracle,verify,physical,selftest];

test('POST endpoints use bounded JSON parsing instead of request.json()',()=>{
  assert.match(oracle,/readBoundedJson/);
  assert.match(verify,/readBoundedJson/);
  assert.match(physical,/readBoundedJson/);
  assert.doesNotMatch(oracle,/request\.json\(/);
  assert.doesNotMatch(verify,/request\.json\(/);
  assert.doesNotMatch(physical,/request\.json\(/);
  assert.match(oracle,/MAX_ORACLE_PAYLOAD_BYTES=32\*1024/);
  assert.match(verify,/MAX_MANIFEST_VERIFY_PAYLOAD_BYTES=512\*1024/);
  assert.match(physical,/MAX_PHYSICAL_QA_PAYLOAD_BYTES=16\*1024/);
});

test('bounded parser checks both declared and actual byte size',()=>{
  assert.match(helper,/content-length/);
  assert.match(helper,/TextEncoder\(\)\.encode\(text\)\.byteLength/);
  assert.match(helper,/HocPayloadTooLargeError/);
  assert.match(helper,/status=413/);
});

test('HOC API sources contain no console logging of request or manifest data',()=>{
  for(const source of protectedRoutes)assert.doesNotMatch(source,/console\.(log|info|debug|warn|error)\s*\(/);
});

test('responses and route config explicitly disable caching',()=>{
  assert.match(helper,/Cache-Control/);
  assert.match(helper,/no-store, max-age=0/);
  assert.match(nextConfig,/source:'\/api\/oraculum\/:path\*'/);
  assert.match(nextConfig,/Pragma/);
  assert.match(selftest,/Cache-Control/);
});

test('global defensive headers preserve camera while disabling microphone and geolocation',()=>{
  assert.match(nextConfig,/X-Content-Type-Options/);
  assert.match(nextConfig,/X-Frame-Options/);
  assert.match(nextConfig,/Referrer-Policy/);
  assert.match(nextConfig,/Cross-Origin-Opener-Policy/);
  assert.match(nextConfig,/camera=\(self\), microphone=\(\), geolocation=\(\)/);
});

test('oracle route validates bounded request shape before running engine',()=>{
  const validate=oracle.indexOf('validateOracleRequest(');
  const legality=oracle.indexOf('analyzeCubeLegality(input.cubeState)');
  const raw=oracle.indexOf('const raw = runOracle(');
  assert.ok(validate>=0&&legality>validate&&raw>legality);
  assert.match(oracle,/MAX_INTENT_CHARS=4096/);
  assert.match(oracle,/MAX_MOVES_TEXT_CHARS=2048/);
});
