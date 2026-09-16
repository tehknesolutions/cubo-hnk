import { NextResponse } from 'next/server';
import { verifySessionManifest } from '@hnk/oraculum-engine/manifest';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const manifest = body?.manifest ?? body;
    const valid = verifySessionManifest(manifest);
    return NextResponse.json({
      ok: true,
      valid,
      manifestVersion: manifest?.manifestVersion ?? null,
      sessionId: manifest?.audit?.sessionId ?? null,
      checksum: manifest?.audit?.checksum ?? null,
    }, { status: valid ? 200 : 422 });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid manifest payload',
    }, { status: 400 });
  }
}
