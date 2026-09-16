# HOC V1.0 RC1 — Technical Mutation Receipt V1

Contract: `HOC-RC1-TECHNICAL-MUTATION-RECEIPT/V1`

Authority: `MUTATION_RECEIPT_RECORD_NOT_EXECUTION_PROOF`

## Purpose

This contract records the outcome reported by an external/manual executor after a valid Pre-Mutation Guard `ALLOW`. It does not execute the action and does not independently verify that the action occurred.

A receipt binds the reported outcome to the exact Promotion Execution Plan fingerprint, Technical Execution Authorization ID, Pre-Mutation Guard `ALLOW / AUTHORIZED_NEXT_STEP` decision and runbook step ID.

## Results

Supported reported outcomes are `SUCCESS`, `FAILED` and `CANCELLED`. They are externally reported results, not automatically verified facts.

Every receipt freezes:

```json
{
  "verification": {"status":"UNVERIFIED_EXTERNAL_RESULT","externalEvidenceVerified":false},
  "governance": {
    "executesAction":false,
    "advancesCompletedPrefix":false,
    "automaticPromotion":false,
    "promotesHnkCanon":false,
    "authority":"MUTATION_RECEIPT_RECORD_NOT_EXECUTION_PROOF"
  }
}
```

## SUCCESS evidence rule

A reported `SUCCESS` requires at least one external evidence reference. Evidence references require a non-empty `kind` and `value`; optional `sha256` must be 64 lowercase hex characters. The recorder validates shape only — it does not fetch or independently verify the reference.

`FAILED` and `CANCELLED` may be recorded without success evidence.

## Chronology

`startedAt` and `completedAt` must parse as timestamps and satisfy `completedAt >= startedAt`.

## CLI

```bash
pnpm record:rc1:mutation -- \
  --plan ./dist/HOC-RC1-PROMOTION-EXECUTION-PLAN.json \
  --authorization ./dist/HOC-RC1-TECHNICAL-EXECUTION-AUTHORIZATION.json \
  --guard ./dist/HOC-RC1-PRE-MUTATION-GUARD-ALLOW.json \
  --result SUCCESS \
  --executor "External Operator" \
  --summary "PR step reported as completed." \
  --started-at 2026-09-16T15:00:00.000Z \
  --evidence github-commit=<external-reference>
```

Default output: `dist/HOC-RC1-TECHNICAL-MUTATION-RECEIPT.json`.

## Fail-closed rules

Receipt generation rejects invalid plan fingerprint, invalid authorization, non-ALLOW guard, another plan/authorization, unauthorized step, unsupported result, missing operator/summary, invalid or reversed timestamps, SUCCESS without evidence, and malformed evidence/hash values.

## Why receipt does not advance the prefix

The completed-step prefix controls what Pre-Mutation Guard can consider next. A locally generated JSON cannot safely advance it merely because somebody typed `SUCCESS`.

Therefore every receipt freezes `advancesCompletedPrefix=false`. A separate independent evidence-verification layer must validate the external result before a successful receipt can become trusted completed-step evidence.

## Current Stack V12

`HOC-V1.0-RC1-STACK-LANDING/V12` includes PR #30 as order 29. The Promotion Execution Plan derived from V12 contains 29 PR landing steps and 37 total dry-run steps.

## Pipeline

```text
Promotion Execution Plan
  -> Technical Execution Authorization
  -> Pre-Mutation Guard ALLOW
  -> external/manual mutation
  -> Technical Mutation Receipt (UNVERIFIED_EXTERNAL_RESULT)
  -> future independent receipt/evidence verification
  -> only then eligibility to advance completed prefix
```

`HNK_CANON` remains outside this operational pipeline.
