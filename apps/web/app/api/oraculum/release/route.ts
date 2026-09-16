import {buildRc1ReleaseAttestation} from '@hnk/oraculum-engine/release-attestation';
import {buildRc1BuildProvenance} from '../../../../lib/release-provenance';
import {hocJson} from '../../../../lib/oraculum-http';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(){
  const attestation=buildRc1ReleaseAttestation();
  const provenance=buildRc1BuildProvenance();
  if(!attestation.audit.matchesExpected){
    return hocJson({ok:false,error:'RC1 release attestation fingerprint mismatch',attestation,provenance},{status:503});
  }

  const headers:Record<string,string>={
    'X-HOC-Release-Id':attestation.core.releaseId,
    'X-HOC-Release-Fingerprint':attestation.audit.fingerprint,
    'X-HOC-Build-Provider':provenance.provider,
    'X-HOC-Build-Provenance':provenance.version,
  };
  if(provenance.git.commitSha)headers['X-HOC-Build-Commit']=provenance.git.commitSha;
  if(provenance.git.commitRef)headers['X-HOC-Build-Ref']=provenance.git.commitRef;
  if(provenance.deployment.id)headers['X-HOC-Deployment-Id']=provenance.deployment.id;

  return hocJson({ok:true,attestation,provenance},{headers});
}
