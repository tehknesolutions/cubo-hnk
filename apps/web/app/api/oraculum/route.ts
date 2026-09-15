import { runOracle } from '@hnk/oraculum-engine';
import { interpretOracle } from '@hnk/oraculum-engine/interpretation';
import { analyzeCubeLegality } from '@hnk/oraculum-engine/legality';
import { analyzeRitualIntegrity } from '@hnk/oraculum-engine/ritual';
import { buildSessionManifest, verifySessionManifest } from '@hnk/oraculum-engine/manifest';
import {hocErrorStatus,hocJson,readBoundedJson} from '../../../lib/oraculum-http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_ORACLE_PAYLOAD_BYTES=32*1024;

type OracleRequestBody={
  intent?:unknown;
  cubeState?:unknown;
  mode?:unknown;
  moves?:unknown;
  initialCubeState?:unknown;
  profileId?:unknown;
  includeResultingIChing?:unknown;
};

export async function POST(request: Request) {
  try {
    const body=await readBoundedJson<OracleRequestBody>(request,MAX_ORACLE_PAYLOAD_BYTES);
    const legality = analyzeCubeLegality(body.cubeState);
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
    if (body.mode === 'RITUAL_32') {
      ritualIntegrity = analyzeRitualIntegrity({
        initialCubeState: body.initialCubeState,
        finalCubeState: body.cubeState,
        moves: body.moves,
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
      intent: body.intent,
      cubeState: body.cubeState,
      mode: body.mode,
      moves: body.moves,
      profileId: body.profileId,
    });
    const interpretation = interpretOracle(raw, {
      profileId: body.profileId,
      includeResultingIChing: Boolean(body.includeResultingIChing),
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
