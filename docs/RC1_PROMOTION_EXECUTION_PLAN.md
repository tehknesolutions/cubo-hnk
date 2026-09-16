# HOC V1.0 RC1 — Promotion Execution Plan V1

Protocol: `HOC-RC1-PROMOTION-EXECUTION-PLAN/V1`  
Authority: `PROMOTION_EXECUTION_PLAN_NOT_EXECUTION_AUTHORITY`  
Mode: `DRY_RUN_ONLY`

## Purpose

A valid future `APPROVE_V1_0` decision plus the parent-first Stack Landing Plan produces a non-executable runbook bound by `HOC-RC1-PROMOTION-PLAN-FINGERPRINT/V1`.

Every step remains `executable=false` and requires separate technical authorization.

## Current Stack V16

`HOC-V1.0-RC1-STACK-LANDING/V16` contains **33 parent-first PR landing steps**. The generated Promotion Execution Plan contains **41 total steps**.

## Operational chain

```text
QA evidence
  -> Release Evidence Ledger
  -> Promotion Readiness V1
  -> Human Promotion Decision V1
  -> Promotion Execution Plan V1
  -> Technical Execution Authorization V1
  -> Completed Prefix State V1
  -> Pre-Mutation Guard V2 (state-bound fingerprinted ALLOW / DENY)
  -> external/manual technical action
  -> Technical Mutation Receipt V1 (preserves state + guard fingerprints)
  -> Mutation Evidence Verification V1
  -> Completed-Prefix Transition V2 (revalidates exact Guard V2/currentState binding)
  -> next Completed Prefix State V1
```

Transition V2 closes the state-swap gap: the receipt's Guard V2 must validate against the same current state being advanced. The transition fingerprint also binds `sourceGuard.guardFingerprint`.

## CLI

`pnpm plan:rc1:promotion -- --decision <approved-decision.json> [--stack <path>] [--out <path>]`

The CLI reads/writes local JSON only and has no process/network mutation surface.

## Governance

Human approval is not execution authorization. Guard V2 ALLOW is policy, not action. Receipt SUCCESS is a reported result, not proof. Evidence verification is not state mutation. Transition V2 advances only the local fingerprinted logical state and has no GitHub/Vercel/database executor. `HNK_CANON` remains outside this pipeline.
