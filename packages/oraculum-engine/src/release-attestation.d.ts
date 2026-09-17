export declare const RC1_RELEASE_ATTESTATION_VERSION:'HOC-RC1-RELEASE-ATTESTATION/V1';
export declare const RC1_PACKAGE_VERSION:'1.0.0-rc.1';
export declare const RC1_RELEASE_FINGERPRINT:'08e003a28185fcd31a806549588547994bcc3075a256bc6cbe6d79d9558f3e90';

export interface Rc1ReleaseAttestation{
  readonly version:typeof RC1_RELEASE_ATTESTATION_VERSION;
  readonly core:Readonly<{
    releaseId:'HOC-V1.0-RC1';
    packageVersion:typeof RC1_PACKAGE_VERSION;
    protocols:Readonly<Record<string,string>>;
    vectors:Readonly<Record<string,string>>;
    hnk40Status:string;
  }>;
  readonly audit:Readonly<{
    algorithm:'SHA-256';
    fingerprint:string;
    expectedFingerprint:typeof RC1_RELEASE_FINGERPRINT;
    matchesExpected:boolean;
  }>;
  readonly authority:'RC1_RUNTIME_IDENTITY_ATTESTATION_NOT_STABLE_PROMOTION';
  readonly governance:Readonly<{
    promotesStable:false;
    promotesHnkCanon:false;
    replacesGitHubCI:false;
    replacesPhysicalQa:false;
  }>;
}

export declare function buildRc1ReleaseAttestation():Rc1ReleaseAttestation;
