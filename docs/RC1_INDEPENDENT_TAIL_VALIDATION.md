# HOC V1.0 RC1 — Independent Tail Validation

Evidence kind: `HOC-RC1-INDEPENDENT-TAIL-REPOSITORY-TEST-EVIDENCE/V1`

Status: `PASS / EXECUTED_PARTIAL`

Source head: `41b62913a4f82ac1b3b61f087740840d7c1cee91`

Source branch: `feat/v1-rc1-completed-prefix-transition-v2`

Runtime: Node `v22.16.0`

## Purpose

This evidence records a real execution of the V16 operational tail outside the broken GitHub Actions runner.

The exact source files needed by the operational tail were fetched from the GitHub head above and reconstructed in an isolated local workspace. No network access was required during Node execution.

## Repository tests executed

The following repository test files were executed unchanged with `node --test`:

- `packages/oraculum-engine/test/pre-mutation-guard.test.mjs`
- `packages/oraculum-engine/test/technical-mutation-receipt.test.mjs`
- `packages/oraculum-engine/test/mutation-evidence-verification.test.mjs`
- `packages/oraculum-engine/test/completed-prefix-transition.test.mjs`

Result:

- total: 21
- pass: 21
- fail: 0
- cancelled: 0
- skipped: 0

A supplemental independent harness also ran 13 checks with 13 PASS / 0 FAIL.

## What this validates

The executed repository tests cover the operational chain introduced by the V16 stack tail, including:

- fingerprint-bound Completed Prefix State;
- Pre-Mutation Guard V2 sequence and authorization checks;
- Guard V2 fingerprint integrity;
- Technical Mutation Receipt V1 state/guard binding;
- evidence verification hash/timestamp checks;
- Completed-Prefix Transition V2;
- exact Guard V2/current-state binding;
- state-swap rejection;
- replay/order/chronology failure modes;
- CLI non-execution boundaries for the tested operational commands.

## What this does not validate

This execution is deliberately classified as partial independent evidence. It does **not** replace or imply:

- `pnpm install` on a full checkout;
- TypeScript typecheck;
- Next.js production build;
- full repository test suite;
- GitHub Actions CI;
- runtime self-test over the complete app;
- physical cube QA;
- camera/device QA;
- cross-device Manifest V0.10 QA;
- Vercel/deployment runtime verification;
- stable promotion or `HNK_CANON` promotion.

Therefore `independentValidation` remains PENDING and `ciTypecheckBuild` remains BLOCKED.

## Frozen evidence

JSON:

`release/v1.0-rc1/INDEPENDENT_TAIL_TEST_EVIDENCE.json`

SHA-256:

`3764a102ed07cdba9691c662e2d0aa7909fee1f2e3d2847fea1c71a59e68ee77`

TAP:

`release/v1.0-rc1/INDEPENDENT_TAIL_TESTS.tap`

SHA-256:

`3cff2579e07fa55cad211f50ef83eb85defc1c51f954056fedb0ea89ffb218ac`

## Governance

This evidence is supplementary executor evidence. It does not authorize merge, deployment, package-version changes, stable release, or `HNK_CANON` promotion.

The overall RC1 status remains `NOT_READY_FOR_STABLE`.
