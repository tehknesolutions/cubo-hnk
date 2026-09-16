export const RC1_BUILD_PROVENANCE_VERSION='HOC-RC1-BUILD-PROVENANCE/V1' as const;

function clean(value:unknown,max=256):string|null{
  if(typeof value!=='string')return null;
  const normalized=value.replace(/[\r\n\0]/g,'').trim();
  return normalized?normalized.slice(0,max):null;
}

export type Rc1BuildProvenance=Readonly<{
  version:typeof RC1_BUILD_PROVENANCE_VERSION;
  provider:string;
  environment:string|null;
  deployment:Readonly<{
    id:string|null;
    url:string|null;
    branchUrl:string|null;
  }>;
  git:Readonly<{
    provider:string|null;
    repoOwner:string|null;
    repoSlug:string|null;
    commitRef:string|null;
    commitSha:string|null;
    pullRequestId:string|null;
  }>;
  completeness:'COMMIT_AND_REF'|'PARTIAL'|'NONE';
  source:'RUNTIME_ENV_METADATA_UNHASHED';
  authority:'BUILD_PROVENANCE_METADATA_NOT_RELEASE_IDENTITY';
  governance:Readonly<{
    entersReleaseFingerprint:false;
    promotesStable:false;
    promotesHnkCanon:false;
    replacesGitHubCI:false;
  }>;
}>;

export function buildRc1BuildProvenance(env:Record<string,string|undefined>=process.env):Rc1BuildProvenance{
  const isVercel=env.VERCEL==='1';
  const commitSha=clean(env.VERCEL_GIT_COMMIT_SHA??env.HOC_BUILD_GIT_SHA,128);
  const commitRef=clean(env.VERCEL_GIT_COMMIT_REF??env.VERCEL_COMMIT_REF??env.HOC_BUILD_GIT_REF,256);
  const completeness=commitSha&&commitRef?'COMMIT_AND_REF':commitSha||commitRef?'PARTIAL':'NONE';
  return Object.freeze({
    version:RC1_BUILD_PROVENANCE_VERSION,
    provider:clean(isVercel?'VERCEL':env.HOC_BUILD_PROVIDER,64)??'LOCAL_OR_UNKNOWN',
    environment:clean(env.VERCEL_TARGET_ENV??env.VERCEL_ENV??env.HOC_BUILD_ENV,64),
    deployment:Object.freeze({
      id:clean(env.VERCEL_DEPLOYMENT_ID??env.HOC_BUILD_DEPLOYMENT_ID,160),
      url:clean(env.VERCEL_URL,256),
      branchUrl:clean(env.VERCEL_BRANCH_URL,256),
    }),
    git:Object.freeze({
      provider:clean(env.VERCEL_GIT_PROVIDER??env.HOC_BUILD_GIT_PROVIDER,64),
      repoOwner:clean(env.VERCEL_GIT_REPO_OWNER,160),
      repoSlug:clean(env.VERCEL_GIT_REPO_SLUG,160),
      commitRef,
      commitSha,
      pullRequestId:clean(env.VERCEL_GIT_PULL_REQUEST_ID,32),
    }),
    completeness,
    source:'RUNTIME_ENV_METADATA_UNHASHED',
    authority:'BUILD_PROVENANCE_METADATA_NOT_RELEASE_IDENTITY',
    governance:Object.freeze({
      entersReleaseFingerprint:false,
      promotesStable:false,
      promotesHnkCanon:false,
      replacesGitHubCI:false,
    }),
  });
}
