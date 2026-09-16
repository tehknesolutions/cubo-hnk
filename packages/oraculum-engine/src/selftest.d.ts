export declare const RC1_RUNTIME_SELFTEST_VERSION: 'HOC-RC1-RUNTIME-SELFTEST/V1';
export declare const RC1_RELEASE_ID: 'HOC-V1.0-RC1';

export interface Rc1RuntimeSelfTestCheck {
  readonly id: string;
  readonly passed: boolean;
  readonly actual: unknown;
  readonly expected: unknown;
}

export interface Rc1RuntimeSelfTestReport {
  readonly version: typeof RC1_RUNTIME_SELFTEST_VERSION;
  readonly releaseId: typeof RC1_RELEASE_ID;
  readonly passed: boolean;
  readonly totalChecks: number;
  readonly passedChecks: number;
  readonly failedChecks: number;
  readonly protocols: Readonly<{
    raw: string;
    legality: string;
    ritual: string;
    manifest: string;
    canonicalJson: string;
  }>;
  readonly checks: readonly Rc1RuntimeSelfTestCheck[];
}

export declare function runRc1RuntimeSelfTest(): Rc1RuntimeSelfTestReport;
