export const RC1_EVIDENCE_LEDGER_VERSION='HOC-RC1-EVIDENCE-LEDGER/V1';
export const RC1_RELEASE_ID='HOC-V1.0-RC1';
export const EVIDENCE_KINDS=Object.freeze({
  RUNTIME:'HOC-RC1-RUNTIME-QA-EVIDENCE/V1',
  PHYSICAL:'HOC-RC1-PHYSICAL-QA-EVIDENCE/V1',
  CAMERA:'HOC-RC1-CAMERA-QA-EVIDENCE/V1',
  MANIFEST_VERIFY:'HOC-RC1-MANIFEST-VERIFY-EVIDENCE/V1',
});

const STATUS=Object.freeze({PASS:'PASS',PENDING:'PENDING',BLOCKED:'BLOCKED'});

function gate(id,label,status,detail,evidenceCount=0){return Object.freeze({id,label,status,detail,evidenceCount});}
function asArray(value){return Array.isArray(value)?value:[];}
function sameRelease(record){
  return record?.releaseId===RC1_RELEASE_ID||record?.report?.releaseId===RC1_RELEASE_ID;
}

function validRuntime(record){
  return record?.evidenceKind===EVIDENCE_KINDS.RUNTIME&&sameRelease(record)&&record?.report?.passed===true;
}
function physicalCase(record,caseId){
  return record?.evidenceKind===EVIDENCE_KINDS.PHYSICAL&&sameRelease(record)&&record?.report?.caseId===caseId;
}
function physicalPass(record,caseId){return physicalCase(record,caseId)&&record?.report?.passed===true&&record?.report?.physicalTranscriptionConfirmed===true;}
function validCamera(record){return record?.evidenceKind===EVIDENCE_KINDS.CAMERA&&sameRelease(record)&&record?.fullQaPass===true&&record?.capabilityPass===true&&record?.manualPass===true;}
function validManifestVerify(record){
  return record?.evidenceKind===EVIDENCE_KINDS.MANIFEST_VERIFY&&sameRelease(record)&&record?.valid===true&&typeof record?.sessionId==='string'&&record.sessionId.startsWith('HOC-')&&/^[0-9a-f]{64}$/u.test(record?.checksum??'')&&typeof record?.deviceLabel==='string'&&record.deviceLabel.trim().length>0;
}

function statusFromEvidence(records,matcher,passer){
  const matching=records.filter(matcher);
  if(matching.some(passer))return {status:STATUS.PASS,count:matching.length};
  if(matching.length>0)return {status:STATUS.PENDING,count:matching.length};
  return {status:STATUS.PENDING,count:0};
}

function crossDeviceManifest(records){
  const valid=records.filter(validManifestVerify);
  const groups=new Map();
  for(const record of valid){
    const key=`${record.sessionId}|${record.checksum}`;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(record);
  }
  for(const [key,items] of groups){
    const labels=[...new Set(items.map(item=>item.deviceLabel.trim().toLowerCase()))];
    if(labels.length>=2){
      const [sessionId,checksum]=key.split('|');
      return {status:STATUS.PASS,count:items.length,sessionId,checksum,deviceLabels:labels};
    }
  }
  return {status:STATUS.PENDING,count:valid.length,sessionId:null,checksum:null,deviceLabels:[]};
}

export function classifyRc1Evidence(record){
  if(!record||typeof record!=='object')return Object.freeze({kind:'UNKNOWN',accepted:false,reason:'NOT_OBJECT'});
  switch(record.evidenceKind){
    case EVIDENCE_KINDS.RUNTIME:return Object.freeze({kind:'RUNTIME',accepted:sameRelease(record),passed:record?.report?.passed===true});
    case EVIDENCE_KINDS.PHYSICAL:return Object.freeze({kind:`PHYSICAL:${record?.report?.caseId??'UNKNOWN'}`,accepted:sameRelease(record),passed:record?.report?.passed===true});
    case EVIDENCE_KINDS.CAMERA:return Object.freeze({kind:'CAMERA',accepted:sameRelease(record),passed:record?.fullQaPass===true});
    case EVIDENCE_KINDS.MANIFEST_VERIFY:return Object.freeze({kind:'MANIFEST_VERIFY',accepted:sameRelease(record),passed:record?.valid===true});
    default:return Object.freeze({kind:'UNKNOWN',accepted:false,reason:'UNKNOWN_EVIDENCE_KIND'});
  }
}

export function evaluateRc1Evidence(recordsInput=[]){
  const records=asArray(recordsInput);
  const runtime=statusFromEvidence(records,r=>r?.evidenceKind===EVIDENCE_KINDS.RUNTIME,validRuntime);
  const state=statusFromEvidence(records,r=>physicalCase(r,'STATE_SOLVED'),r=>physicalPass(r,'STATE_SOLVED'));
  const ritual=statusFromEvidence(records,r=>physicalCase(r,'RITUAL32_OFFICIAL'),r=>physicalPass(r,'RITUAL32_OFFICIAL'));
  const camera=statusFromEvidence(records,r=>r?.evidenceKind===EVIDENCE_KINDS.CAMERA,validCamera);
  const crossDevice=crossDeviceManifest(records);

  const gates=Object.freeze([
    gate('runtimeSelfTest','Runtime self-test',runtime.status,runtime.status==='PASS'?'Vetor RC1 reproduzido no runtime carregado.':'Importe uma evidência PASS de /oraculum/qa.',runtime.count),
    gate('physicalState','Physical QA · STATE',state.status,state.status==='PASS'?'Cubo resolvido físico reproduziu legalidade, commit e seed oficiais.':'Execute STATE_SOLVED com cubo real.',state.count),
    gate('physicalRitual','Physical QA · RITUAL_32',ritual.status,ritual.status==='PASS'?'RITUAL_32 físico reproduziu o estado final V0.9 oficial.':'Execute o vetor físico de 32 movimentos.',ritual.count),
    gate('cameraDevice','Camera / device QA',camera.status,camera.status==='PASS'?'Fluxo de câmera passou no dispositivo registrado.':'Execute /oraculum/qa/camera e importe a evidência.',camera.count),
    gate('crossDeviceManifest','Manifest cross-device',crossDevice.status,crossDevice.status==='PASS'?`Mesmo manifesto validado em ${crossDevice.deviceLabels.length} labels de dispositivo.`:'São necessárias duas evidências válidas do mesmo sessionId/checksum com labels de dispositivo diferentes.',crossDevice.count),
    gate('ciBuild','CI / typecheck / build',STATUS.BLOCKED,'GitHub Actions permanece bloqueado pela Issue #6 (jobs steps=null); este gate não pode ser promovido por evidência local.',0),
    gate('manualFinalDocs','Manual final reconciliado',STATUS.PENDING,'DOCX/PDF final ainda precisa ser reconciliado com V0.8–V0.10 e RC1 QA.',0),
    gate('humanPromotion','Aprovação humana V1.0',STATUS.PENDING,'Somente uma decisão humana explícita pode promover RC1 → V1.0.',0),
  ]);

  const counts=Object.freeze({
    pass:gates.filter(item=>item.status===STATUS.PASS).length,
    pending:gates.filter(item=>item.status===STATUS.PENDING).length,
    blocked:gates.filter(item=>item.status===STATUS.BLOCKED).length,
  });
  const overall=counts.blocked>0?'BLOCKED':counts.pending>0?'PENDING':'PASS';

  return Object.freeze({
    version:RC1_EVIDENCE_LEDGER_VERSION,
    releaseId:RC1_RELEASE_ID,
    overall,
    counts,
    importedRecords:records.length,
    acceptedRecords:records.filter(record=>classifyRc1Evidence(record).accepted).length,
    crossDevice:Object.freeze(crossDevice),
    gates,
  });
}
