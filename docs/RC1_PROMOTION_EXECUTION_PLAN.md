# HOC V1.0 RC1 — Promotion Execution Plan V1

Protocol: `HOC-RC1-PROMOTION-EXECUTION-PLAN/V1`  
Authority: `PROMOTION_EXECUTION_PLAN_NOT_EXECUTION_AUTHORITY`  
Mode: `DRY_RUN_ONLY`

## Purpose

A valid future `APPROVE_V1_0` decision plus the parent-first Stack Landing Plan produces a non-executable runbook. The runbook is bound by `HOC-RC1-PROMOTION-PLAN-FINGERPRINT/V1`; `generatedAt` is excluded from that operational fingerprint.

Every step freezes `executable=false` and `requiresSeparateExecutionAuthorization=true`. The plan cannot merge, version, tag, release, deploy or promote `HNK_CANON`.

## Current Stack V15

`HOC-V1.0-RC1-STACK-LANDING/V15` contains **32 parent-first PR landing steps**. The generated Promotion Execution Plan contains **40 total steps**.

The major phases remain evidence freeze, gate reconfirmation, parent-first stack review, post-main verification, stable-version preparation, tag/release preparation, production preparation, production verification and final archive.

## Operational chain

```text
QA evidence
  -> Release Evidence Ledger
  -> Promotion Readiness V1
  -> Human Promotion Decision V1
  -> Promotion Execution Plan V1 (DRY_RUN_ONLY + planFingerprint)
  -> Technical Execution Authorization V1 (STEP_SCOPED)
  -> Completed Prefix State V1 (fingerprinted logical state)
  -> Pre-Mutation Guard V2 (fingerprinted ALLOW / DENY)
  -> external/manual technical action
  -> Technical Mutation Receipt V1 (Guard V2 + state-bound, UNVERIFIED_EXTERNAL_RESULT)
  -> Mutation Evidence Verification V1 (VERIFIED_EXTERNAL_EVIDENCE)
  -> Completed-Prefix State Transition V1 (logical N -> N+1)
  -> next fingerprinted Completed Prefix State
  -> next Pre-Mutation Guard V2 evaluation
```

The boundaries remain intentionally separate. Guard V2 consumes only a fingerprint-valid state artifact; it no longer accepts a caller-supplied completed-step list. Receipt SUCCESS is still a reported result, evidence verification is still not a state transition, and Completed-Prefix Transition still changes only the local logical release-state artifact.

## CLI

`pnpm plan:rc1:promotion -- --decision <approved-decision.json> [--stack <path>] [--out <path>]`

The CLI reads/writes local JSON only and has no process/network mutation surface.

## Governance

Human approval is not execution authorization. Technical authorization is step-scoped. Guard V2 ALLOW is a fingerprinted policy record, not an action. Receipt SUCCESS is a reported result, not proof. Evidence verification is not a state transition. Completed-Prefix Transition advances only the fingerprinted logical release state by one exact next step and has no GitHub/Vercel/database executor. `HNK_CANON` remains outside this pipeline.
