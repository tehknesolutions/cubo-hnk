import { NextResponse } from 'next/server';
import { runOracle } from '@hnk/oraculum-engine';
import { interpretOracle } from '@hnk/oraculum-engine/interpretation';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const raw = runOracle({ intent: body.intent, cubeState: body.cubeState, mode: body.mode, moves: body.moves, profileId: body.profileId });
    const interpretation = interpretOracle(raw, { profileId: body.profileId, includeResultingIChing: Boolean(body.includeResultingIChing) });
    return NextResponse.json({ ok: true, scanProfile: 'HOC-FACELET-SCAN-V1', raw, interpretation });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown Oraculum error' }, { status: 400 });
  }
}
