# HOC V1.0 RC1 — Mutation Evidence Verification V1

Contract: `HOC-RC1-TECHNICAL-MUTATION-EVIDENCE-VERIFICATION/V1`

Fingerprint: `HOC-RC1-MUTATION-EVIDENCE-VERIFICATION-FINGERPRINT/V1`

Authority: `MUTATION_EVIDENCE_VERIFICATION_RECORD_NOT_STATE_MUTATOR`

## Purpose

A Technical Mutation Receipt records a reported external/manual result, but always remains `UNVERIFIED_EXTERNAL_RESULT`. This layer records an independent review of every evidence reference attached to a successful receipt.

It does **not** execute the mutation and does **not** mutate the completed-step prefix.

## Preconditions

Verification requires:

1. structurally valid Promotion Execution Plan;
2. valid Technical Execution Authorization bound to that plan;
3. structurally valid Technical Mutation Receipt bound to both;
4. receipt result `SUCCESS`;
5. one verification observation for every receipt evidence reference;
6. explicit verifier acknowledgement.

FAILED/CANCELLED receipts cannot become completed-prefix eligible.

## Evidence observations

Each observation binds:

- `evidenceIndex`;
- exact evidence `kind`;
- exact evidence `value`;
- 64-hex `observedSha256`;
- `observedAt` timestamp;
- `verified=true`.

Observations must cover indexes `0..N-1` exactly once. `observedAt` cannot predate receipt completion. When the receipt already carries an expected SHA-256, the observed hash must match it exactly.

## Verified result

A valid record freezes:

```json
{
  "result": {
    "status": "VERIFIED_EXTERNAL_EVIDENCE",
    "eligibleForCompletedPrefix": true
  },
  "governance": {
    "executesAction": false,
    "mutatesCompletedPrefix": false,
    "automaticPromotion": false,
    "promotesHnkCanon": false,
    "authority": "MUTATION_EVIDENCE_VERIFICATION_RECORD_NOT_STATE_MUTATOR"
  }
}
```

`eligibleForCompletedPrefix=true` means only that a later state-update layer may consider the step verified. This record itself does not edit state.

## Verification fingerprint

The record carries `verificationFingerprint`, SHA-256 over its canonical verification core. This detects any later change to source receipt identity, observations, result, acknowledgements or governance.

The fingerprint is operational metadata and does not enter the HOC RC1 Release Attestation fingerprint.

## CLI

```bash
pnpm verify:rc1:mutation-evidence -- \
  --plan ./dist/HOC-RC1-PROMOTION-EXECUTION-PLAN.json \
  --authorization ./dist/HOC-RC1-TECHNICAL-EXECUTION-AUTHORIZATION.json \
  --receipt ./dist/HOC-RC1-TECHNICAL-MUTATION-RECEIPT.json \
  --observations ./verification-observations.json \
  --verifier "Independent Reviewer" \
  --method "provider/hash/content review" \
  --ack
```

Optional: `--verified-at <timestamp>` and `--out <path>`.

The CLI reads local JSON and writes a local verification record. It does not query GitHub/Vercel or execute shell mutations; the observations represent checks performed by the verifier outside this recorder.

## Boundary

A verification record is tamper-evident and makes a successful receipt eligible for later prefix advancement. It is **not** the prefix mutation itself. A separate state-transition layer must verify this record again before accepting the step as completed.

`HNK_CANON` remains outside this operational pipeline.
