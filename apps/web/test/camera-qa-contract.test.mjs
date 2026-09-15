import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const client=readFileSync(new URL('../app/oraculum/qa/camera/CameraQaClient.tsx',import.meta.url),'utf8');

test('camera QA measures actual browser camera capabilities',()=>{
  assert.match(client,/window\.isSecureContext/);
  assert.match(client,/navigator\.mediaDevices\?\.getUserMedia/);
  assert.match(client,/videoWidth/);
  assert.match(client,/sampleNinePatches/);
});

test('camera QA requires six faces and human checklist for full PASS',()=>{
  assert.match(client,/FACES\.every\(face=>captures\[face\]\?\.length===9\)/);
  assert.match(client,/const manualPass=MANUAL_ITEMS\.every/);
  assert.match(client,/const fullQaPass=capabilityPass&&manualPass/);
});

test('camera QA evidence excludes image serialization, device IDs and location',()=>{
  assert.doesNotMatch(client,/toDataURL|canvas\.toBlob|image\/jpeg|image\/png/);
  assert.doesNotMatch(client,/deviceId|getSettings\(/);
  assert.doesNotMatch(client,/geolocation|getCurrentPosition|watchPosition/);
  assert.match(client,/No image bytes, device IDs, or location are included/);
});

test('camera QA keeps camera classification candidate and human-review governed',()=>{
  assert.match(client,/classifyRgb/);
  assert.match(client,/Baixa confiança|lowConfidenceCells|warnings/);
  assert.match(client,/não é falha de protocolo; a câmera é candidata/);
  assert.match(client,/não gera hash sem a revisão humana das 54 casas/);
});
