import { runOracle } from '@hnk/oraculum-engine';
import { analyzeCubeLegality } from '@hnk/oraculum-engine/legality';
import { analyzeRitualIntegrity } from '@hnk/oraculum-engine/ritual';
import { RC1_QA_VECTORS, RC1_RELEASE_ID } from '@hnk/oraculum-engine/selftest';
import {hocErrorStatus,hocJson,readBoundedJson} from '../../../../../lib/oraculum-http';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const PHYSICAL_QA_VERSION='HOC-RC1-PHYSICAL-QA/V1';
const MAX_PHYSICAL_QA_PAYLOAD_BYTES=16*1024;
const FACE_ORDER=['U','R','F','D','L','B'] as const;

type CaseId='STATE_SOLVED'|'RITUAL32_OFFICIAL';
type PhysicalQaRequest={caseId?:unknown;cubeState?:unknown;physicalTranscriptionConfirmed?:unknown};

function compact(value:unknown){
  return String(value??'').replace(/\s+/gu,'');
}

function mismatchReport(expected:string,actual:string){
  const max=Math.max(expected.length,actual.length);
  return Array.from({length:max},(_,index)=>{
    const expectedValue=expected[index]??null;
    const actualValue=actual[index]??null;
    if(expectedValue===actualValue)return null;
    const faceIndex=Math.floor(index/9);
    const cell=(index%9)+1;
    return {
      index,
      face:FACE_ORDER[faceIndex]??null,
      cell,
      row:Math.floor((cell-1)/3)+1,
      column:((cell-1)%3)+1,
      expected:expectedValue,
      actual:actualValue,
    };
  }).filter(Boolean);
}

export async function POST(request:Request){
  try{
    const body=await readBoundedJson<PhysicalQaRequest>(request,MAX_PHYSICAL_QA_PAYLOAD_BYTES);
    const caseId=body.caseId as CaseId;
    const actualState=compact(body.cubeState);

    if(body.physicalTranscriptionConfirmed!==true){
      return hocJson({
        ok:false,
        error:'Confirme que a entrada foi transcrita de um cubo físico real antes de registrar este QA.',
        code:'PHYSICAL_CONFIRMATION_REQUIRED',
      },{status:422});
    }

    if(caseId==='STATE_SOLVED'){
      const vector=RC1_QA_VECTORS.stateSolved;
      const legality=analyzeCubeLegality(actualState);
      let rawSeed256:string|null=null;
      let rawCommit:string|null=null;
      if(legality.valid){
        const raw=runOracle({intent:vector.intent,cubeState:actualState,mode:'STATE'});
        rawSeed256=raw.raw.seed256;
        rawCommit=raw.commit;
      }
      const mismatches=mismatchReport(vector.cubeState,actualState);
      const passed=legality.valid&&mismatches.length===0&&rawSeed256===vector.seed256&&rawCommit===vector.commit;
      return hocJson({
        ok:true,
        report:{
          version:PHYSICAL_QA_VERSION,
          releaseId:RC1_RELEASE_ID,
          caseId,
          passed,
          physicalTranscriptionConfirmed:true,
          expectedState:vector.cubeState,
          actualState,
          mismatches,
          legality,
          rawAudit:{expectedCommit:vector.commit,actualCommit:rawCommit,expectedSeed256:vector.seed256,actualSeed256:rawSeed256},
        },
      },{status:passed?200:422});
    }

    if(caseId==='RITUAL32_OFFICIAL'){
      const vector=RC1_QA_VECTORS.ritual32;
      const legality=analyzeCubeLegality(actualState);
      const ritualIntegrity=analyzeRitualIntegrity({
        initialCubeState:vector.initialCubeState,
        finalCubeState:actualState,
        moves:vector.moves,
      });
      const mismatches=mismatchReport(vector.expectedFinalState,actualState);
      const passed=legality.valid&&ritualIntegrity.valid&&ritualIntegrity.integrityConfirmed===true&&mismatches.length===0;
      return hocJson({
        ok:true,
        report:{
          version:PHYSICAL_QA_VERSION,
          releaseId:RC1_RELEASE_ID,
          caseId,
          passed,
          physicalTranscriptionConfirmed:true,
          initialState:vector.initialCubeState,
          moves:vector.moves,
          expectedState:vector.expectedFinalState,
          actualState,
          mismatches,
          legality,
          ritualIntegrity,
        },
      },{status:passed?200:422});
    }

    return hocJson({ok:false,error:'Caso de QA físico desconhecido.',code:'UNKNOWN_QA_CASE'},{status:400});
  }catch(error){
    return hocJson({ok:false,error:error instanceof Error?error.message:'Falha desconhecida no QA físico.'},{status:hocErrorStatus(error,400)});
  }
}
