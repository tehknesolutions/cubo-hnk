# HOC V1.0 RC1 — Technical Mutation Receipt V1

Contract: `HOC-RC1-TECHNICAL-MUTATION-RECEIPT/V1`

Authority: `MUTATION_RECEIPT_RECORD_NOT_EXECUTION_PROOF`

## Purpose

This contract records the outcome reported by an external/manual executor after a valid Pre-Mutation Guard V2 `ALLOW`. It does not execute the action and does not independently verify that the action occurred.

The receipt now binds the reported outcome to:

- exact Promotion Execution Plan fingerprint;
- Technical Execution Authorization ID;
- Guard V2 `ALLOW / AUTHORIZED_NEXT_STEP` decision;
- Guard V2 fingerprint;
- exact Completed Prefix State fingerprint consumed by the guard;
- source Stack Landing version;
- exact runbook step ID.

A receipt cannot silently discard the logical-state context under which the action was authorized.

## Guard V2 requirement

Receipt generation requires:

`HOC-RC1-PRE-MUTATION-GUARD/V2`

and validates:

`HOC-RC1-PRE-MUTATION-GUARD-FINGERPRINT/V1`

The complete guard snapshot is stored inside `preMutationGuard`, including `completedPrefixStateFingerprint` and `guardFingerprint`.

Changing a bound guard field invalidates receipt inspection.

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

A reported `SUCCESS` requires at least one external evidence reference. Optional `sha256` must be 64 lowercase hex characters. The recorder validates shape only and does not independently verify the external reference.

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

Generation rejects an invalid plan, authorization, Guard V2 fingerprint, Completed Prefix State fingerprint binding, plan/authorization mismatch, unsupported result, malformed chronology or malformed evidence.

## Why receipt does not advance the prefix

The completed-step prefix controls which step Guard V2 may consider next. A reported `SUCCESS` is not enough to advance that security-sensitive state.

Every receipt therefore keeps `advancesCompletedPrefix=false`. Mutation Evidence Verification and Completed-Prefix State Transition remain separate downstream layers.

## Pipeline

```text
Completed Prefix State V1
  -> Pre-Mutation Guard V2 (fingerprinted ALLOW)
  -> external/manual mutation
  -> Technical Mutation Receipt V1 (state-bound, UNVERIFIED_EXTERNAL_RESULT)
  -> Mutation Evidence Verification V1
  -> Completed-Prefix State Transition V1
```

`HNK_CANON` remains outside this operational pipeline.
