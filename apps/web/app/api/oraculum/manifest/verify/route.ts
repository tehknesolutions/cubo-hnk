import { verifySessionManifest } from '@hnk/oraculum-engine/manifest';
import {hocErrorStatus,hocJson,readBoundedJson} from '../../../../../lib/oraculum-http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_MANIFEST_VERIFY_PAYLOAD_BYTES=512*1024;

type ManifestVerifyBody={manifest?:unknown;[key:string]:unknown};

export async function POST(request: Request) {
  try {
    const body=await readBoundedJson<ManifestVerifyBody>(request,MAX_MANIFEST_VERIFY_PAYLOAD_BYTES);
    const manifest=body?.manifest ?? body;
    const valid = verifySessionManifest(manifest);
    const record=manifest&&typeof manifest==='object'?manifest as Record<string,any>:null;
    return hocJson({
      ok: true,
      valid,
      manifestVersion: record?.manifestVersion ?? null,
      sessionId: record?.audit?.sessionId ?? null,
      checksum: record?.audit?.checksum ?? null,
    }, { status: valid ? 200 : 422 });
  } catch (error) {
    return hocJson({
      ok: false,
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid manifest payload',
    }, { status: hocErrorStatus(error,400) });
  }
}
