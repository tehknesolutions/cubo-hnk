import { runOracle,type OraculumMode } from '@hnk/oraculum-engine';
import { interpretOracle } from '@hnk/oraculum-engine/interpretation';
import { analyzeCubeLegality } from '@hnk/oraculum-engine/legality';
import { analyzeRitualIntegrity } from '@hnk/oraculum-engine/ritual';
import { buildSessionManifest, verifySessionManifest } from '@hnk/oraculum-engine/manifest';
import {hocErrorStatus,hocJson,readBoundedJson} from '../../../lib/oraculum-http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_ORACLE_PAYLOAD_BYTES=32*1024;
const MAX_INTENT_CHARS=4096;
const MAX_MOVES_TEXT_CHARS=2048;

type OracleRequestBody={
  intent?:unknown;
  cubeState?:unknown;
  mode?:unknown;
  moves?:unknown;
  initialCubeState?:unknown;
  profileId?:unknown;
  includeResultingIChing?:unknown;
};

type ValidOracleRequest={
  intent:string;
  cubeState:string;
  mode:OraculumMode;
  moves?:string|string[];
  initialCubeState?:string;
  profileId?:string;
  includeResultingIChing?:boolean;
};

function validateOracleRequest(body:OracleRequestBody):ValidOracleRequest{
  if(typeof body.intent!=='string'||body.intent.length===0)throw new Error('intent must be a non-empty string');
  if(body.intent.length>MAX_INTENT_CHARS)throw new Error(`intent exceeds ${MAX_INTENT_CHARS} characters`);
  if(typeof body.cubeState!=='string')throw new Error('cubeState must be a string');
  if(body.mode!=='STATE'&&body.mode!=='RITUAL_32')throw new Error('mode must be STATE or RITUAL_32');
  if(body.profileId!==undefined&&typeof body.profileId!=='string')throw new Error('profileId must be a string when provided');
  if(body.initialCubeState!==undefined&&typeof body.initialCubeState!=='string')throw new Error('initialCubeState must be a string when provided');
  if(body.includeResultingIChing!==undefined&&typeof body.includeResultingIChing!=='boolean')throw new Error('includeResultingIChing must be boolean when provided');

  let moves:string|string[]|undefined;
  if(body.moves!==undefined&&body.moves!==null){
    if(typeof body.moves==='string'){
      if(body.moves.length>MAX_MOVES_TEXT_CHARS)throw new Error(`moves exceeds ${MAX_MOVES_TEXT_CHARS} characters`);
      moves=body.moves;
    }else if(Array.isArray(body.moves)&&body.moves.every(item=>typeof item==='string')){
      if(body.moves.length>64)throw new Error('moves array exceeds 64 tokens');
      moves=body.moves as string[];
    }else throw new Error('moves must be a string or string array when provided');
  }

  return {
    intent:body.intent,
    cubeState:body.cubeState,
    mode:body.mode,
    moves,
    initialCubeState:body.initialCubeState as string|undefined,
    profileId:body.profileId as string|undefined,
    includeResultingIChing:body.includeResultingIChing as boolean|undefined,
  };
}

export async function POST(request: Request) {
  try {
    const input=validateOracleRequest(await readBoundedJson<OracleRequestBody>(request,MAX_ORACLE_PAYLOAD_BYTES));
    const legality = analyzeCubeLegality(input.cubeState);
    if (!legality.valid) {
      return hocJson(
        {
          ok: false,
          error: `Estado impossível para um cubo 3×3 físico: ${legality.errors.map(item => item.code).join(', ')}`,
          scanProfile: 'HOC-FACELET-SCAN-V1',
          legality,
          ritualIntegrity: null,
          manifest: null,
        },
        { status: 422 },
      );
    }

    let ritualIntegrity = null;
    if (input.mode === 'RITUAL_32') {
      ritualIntegrity = analyzeRitualIntegrity({
        initialCubeState: input.initialCubeState,
        finalCubeState: input.cubeState,
        moves: input.moves,
      });
      if (!ritualIntegrity.valid) {
        return hocJson(
          {
            ok: false,
            error: `Integridade RITUAL_32 não confirmada: ${ritualIntegrity.errors.map(item => item.code).join(', ')}`,
            scanProfile: 'HOC-FACELET-SCAN-V1',
            legality,
            ritualIntegrity,
            manifest: null,
          },
          { status: 422 },
        );
      }
    }

    const raw = runOracle({
      intent: input.intent,
      cubeState: input.cubeState,
      mode: input.mode,
      moves: input.moves,
      profileId: input.profileId,
    });
    const interpretation = interpretOracle(raw, {
      profileId: input.profileId,
      includeResultingIChing: Boolean(input.includeResultingIChing),
    });
    const manifest = buildSessionManifest({
      scanProfile: 'HOC-FACELET-SCAN-V1',
      legality,
      ritualIntegrity,
      raw,
      interpretation,
    });
    if (!verifySessionManifest(manifest)) throw new Error('Internal V0.10 manifest verification failed');

    return hocJson({
      ok: true,
      scanProfile: 'HOC-FACELET-SCAN-V1',
      legality,
      ritualIntegrity,
      raw,
      interpretation,
      manifest,
    }, {
      headers: {
        'X-HOC-Session-Id': manifest.audit.sessionId,
        'X-HOC-Manifest-SHA256': manifest.audit.checksum,
      },
    });
  } catch (error) {
    return hocJson({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown Oraculum error',
    }, { status: hocErrorStatus(error,400) });
  }
}
