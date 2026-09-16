# HOC V1.0 RC1 — Technical Mutation Receipt V1

Contract:

`HOC-RC1-TECHNICAL-MUTATION-RECEIPT/V1`

Authority:

`MUTATION_RECEIPT_RECORD_NOT_EXECUTION_PROOF`

## Purpose

This contract records the outcome reported by an external/manual executor after a valid Pre-Mutation Guard `ALLOW` decision.

It does **not** execute the action and does **not** independently verify that the action really occurred.

A receipt binds the reported outcome to:

- the exact Promotion Execution Plan fingerprint;
- the exact Technical Execution Authorization ID;
- the exact Pre-Mutation Guard `ALLOW / AUTHORIZED_NEXT_STEP` decision;
- the exact runbook step ID.

## Results

Supported reported outcomes:

- `SUCCESS`
- `FAILED`
- `CANCELLED`

These are externally reported results, not automatically verified facts.

Every receipt freezes:

```json
{
  "verification": {
    "status": "UNVERIFIED_EXTERNAL_RESULT",
    "externalEvidenceVerified": false
  },
  "governance": {
    "executesAction": false,
    "advancesCompletedPrefix": false,
    "automaticPromotion": false,
    "promotesHnkCanon": false,
    "authority": "MUTATION_RECEIPT_RECORD_NOT_EXECUTION_PROOF"
  }
}
```

## SUCCESS evidence rule

A reported `SUCCESS` requires at least one external evidence reference.

Example:

```json
{
  "kind": "github-commit",
  "value": "<external commit/ref/url or other identifier>",
  "sha256": null
}
```

Evidence references are normalized and structurally validated, but this recorder does not fetch or independently verify them.

Therefore an evidence reference is a pointer to future verification, not proof by itself.

`FAILED` and `CANCELLED` may be recorded without success evidence.

## Chronology

`startedAt` and `completedAt` must parse as timestamps and:

`completedAt >= startedAt`

A chronologically impossible receipt is rejected.

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

`--evidence kind=value` may be repeated.

Default output:

`dist/HOC-RC1-TECHNICAL-MUTATION-RECEIPT.json`

## Fail-closed rules

Receipt generation fails when:

- plan fingerprint is invalid;
- technical authorization is invalid for the plan;
- guard result is not `ALLOW / AUTHORIZED_NEXT_STEP`;
- guard references another plan fingerprint or authorization ID;
- guard step is not authorized;
- result is unsupported;
- executor or summary is missing;
- timestamps are invalid or reversed;
- SUCCESS has no evidence reference;
- evidence reference shape/hash is invalid.

## Why receipt does not advance the prefix

The completed-step prefix is security-sensitive because it determines the only step that may be considered next by Pre-Mutation Guard.

A locally generated receipt cannot safely advance that prefix merely because somebody typed `SUCCESS`.

For that reason:

`advancesCompletedPrefix=false`

A later independent evidence-verification layer must validate the external result before a successful receipt can be accepted as completed-step evidence.

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
