# HOC V1.0 RC1 — Promotion Execution Plan V1

Protocol: `HOC-RC1-PROMOTION-EXECUTION-PLAN/V1`  
Authority: `PROMOTION_EXECUTION_PLAN_NOT_EXECUTION_AUTHORITY`  
Mode: `DRY_RUN_ONLY`

## Purpose

A valid future `APPROVE_V1_0` decision plus the parent-first Stack Landing Plan produces a non-executable runbook. The runbook is bound by `HOC-RC1-PROMOTION-PLAN-FINGERPRINT/V1`; `generatedAt` is excluded from that operational fingerprint.

Every step freezes `executable=false` and `requiresSeparateExecutionAuthorization=true`. The plan cannot merge, version, tag, release, deploy or promote `HNK_CANON`.

## Current Stack V13

`HOC-V1.0-RC1-STACK-LANDING/V13` contains **30 parent-first PR landing steps**. The generated Promotion Execution Plan contains **38 total steps**.

The major phases remain evidence freeze, gate reconfirmation, parent-first stack review, post-main verification, stable-version preparation, tag/release preparation, production preparation, production verification and final archive.

## Operational chain

```text
QA evidence
  -> Release Evidence Ledger
  -> Promotion Readiness V1
  -> Human Promotion Decision V1
  -> Promotion Execution Plan V1 (DRY_RUN_ONLY + planFingerprint)
  -> Technical Execution Authorization V1 (STEP_SCOPED)
  -> Pre-Mutation Guard V1 (ALLOW / DENY)
  -> external/manual technical action
  -> Technical Mutation Receipt V1 (UNVERIFIED_EXTERNAL_RESULT)
  -> Mutation Evidence Verification V1 (VERIFIED_EXTERNAL_EVIDENCE)
  -> future completed-prefix state transition
```

The final two boundaries are intentionally separate: a verification record may set `eligibleForCompletedPrefix=true`, but its governance always keeps `mutatesCompletedPrefix=false`. A future state-transition layer must verify the record again before altering completed-step state.

## CLI

`pnpm plan:rc1:promotion -- --decision <approved-decision.json> [--stack <path>] [--out <path>]`

The CLI reads/writes local JSON only and has no process/network mutation surface.

## Governance

Human approval is not execution authorization. Technical authorization is step-scoped. Guard ALLOW is policy, not action. Receipt SUCCESS is a reported result, not proof. Evidence verification makes a receipt eligible for state consideration but does not itself mutate state. `HNK_CANON` remains outside this pipeline.
