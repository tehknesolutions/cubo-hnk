export declare const RC1_RUNTIME_SELFTEST_VERSION: 'HOC-RC1-RUNTIME-SELFTEST/V1';
export declare const RC1_RELEASE_ID: 'HOC-V1.0-RC1';

export declare const RC1_QA_VECTORS: Readonly<{
  stateSolved: Readonly<{
    caseId: 'STATE_SOLVED';
    intent: string;
    cubeState: string;
    commit: string;
    seed256: string;
  }>;
  ritual32: Readonly<{
    caseId: 'RITUAL32_OFFICIAL';
    initialCubeState: string;
    moves: readonly string[];
    expectedFinalState: string;
  }>;
  manifestSynthetic: Readonly<{
    checksum: string;
    sessionId: string;
  }>;
  hnk40: Readonly<{
    glyphSetSha256: string;
    status: 'PREPRODUCTION_NOT_OFFICIAL';
  }>;
}>;

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
