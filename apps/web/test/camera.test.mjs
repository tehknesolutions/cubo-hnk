import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyRgb,colorDistance,rgbToHex,sampleNinePatches } from '../app/oraculum/camera-color-utils.mjs';
test('RGB distance and HEX conversion are deterministic',()=>{assert.equal(colorDistance({r:0,g:0,b:0},{r:3,g:4,b:0}),5);assert.equal(rgbToHex({r:68,g:125,b:199}),'#447DC7');});
test('nearest prototype classification is deterministic',()=>{const p=[{r:245,g:245,b:242},{r:217,g:72,b:72},{r:52,g:168,b:83},{r:242,g:207,b:58},{r:232,g:137,b:47},{r:63,g:101,b:217}];const r=classifyRgb({r:226,g:80,b:75},p);assert.equal(r.bestDigit,1);assert.ok(r.confidence>0);});
test('3x3 sampler returns exactly nine RGB samples',()=>{const w=30,h=30,data=new Uint8ClampedArray(w*h*4);for(let i=0;i<data.length;i+=4){data[i]=100;data[i+1]=120;data[i+2]=140;data[i+3]=255;}const s=sampleNinePatches(data,w,h);assert.equal(s.length,9);assert.deepEqual(s[4],{r:100,g:120,b:140});});
