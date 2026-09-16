import {buildRc1ReleaseAttestation} from '@hnk/oraculum-engine/release-attestation';
import {hocJson} from '../../../../lib/oraculum-http';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(){
  const attestation=buildRc1ReleaseAttestation();
  if(!attestation.audit.matchesExpected){
    return hocJson({ok:false,error:'RC1 release attestation fingerprint mismatch',attestation},{status:503});
  }
  return hocJson({ok:true,attestation},{
    headers:{
      'X-HOC-Release-Id':attestation.core.releaseId,
      'X-HOC-Release-Fingerprint':attestation.audit.fingerprint,
    },
  });
}
