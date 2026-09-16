# HOC V1.0 RC1 — Completed-Prefix State Transition V1

Contracts:

- `HOC-RC1-COMPLETED-PREFIX-STATE/V1`
- `HOC-RC1-COMPLETED-PREFIX-STATE-FINGERPRINT/V1`
- `HOC-RC1-COMPLETED-PREFIX-TRANSITION/V1`
- `HOC-RC1-COMPLETED-PREFIX-TRANSITION-FINGERPRINT/V1`

Authorities:

- `COMPLETED_PREFIX_STATE_RECORD_NOT_TECHNICAL_EXECUTOR`
- `COMPLETED_PREFIX_TRANSITION_RECORD_NOT_TECHNICAL_EXECUTOR`

## Purpose

This layer closes the logical state transition after a successful technical action has already been reported and independently verified.

It transforms a valid completed-prefix state of length `N` into a new state of length `N+1` only when the exact next runbook step has a valid `VERIFIED_EXTERNAL_EVIDENCE` record.

It does **not** execute the technical action itself.

## Genesis state

The only implicit starting state is the empty prefix:

```text
completedStepIds = []
completedCount = 0
nextStepId = plan.steps[0].id
```

The genesis state is bound to the exact Promotion Execution Plan fingerprint and source Stack Landing version.

## State fingerprint

Each state carries:

`HOC-RC1-COMPLETED-PREFIX-STATE-FINGERPRINT/V1`

The state fingerprint binds:

- release ID;
- exact plan fingerprint;
- source Stack Landing version;
- ordered completed step IDs;
- ordered lineage entries;
- completed count;
- next step ID;
- non-execution governance.

The fingerprint makes accidental or silent edits detectable. It is **not** a digital signature or external trust anchor.

## Lineage

Each completed step adds exactly one lineage entry containing:

- zero-based prefix index;
- step ID;
- receipt ID;
- evidence-verification ID;
- evidence-verification fingerprint;
- transition timestamp.

This preserves which verified evidence justified each `N -> N+1` transition.

## Transition rules

A transition is accepted only when:

1. the current Completed Prefix State is valid for the exact plan;
2. its `completedStepIds` form the exact prefix of the runbook;
3. the plan is not already complete;
4. the Mutation Evidence Verification record is valid and `eligibleForCompletedPrefix=true`;
5. the verified receipt step equals the state's exact `nextStepId`;
6. `transitionedAt >= verification.verifiedAt`;
7. the next state appends exactly one step and preserves the full previous prefix;
8. the next state's lineage appends the exact verification fingerprint;
9. state and transition fingerprints both validate.

A verified step cannot be replayed to advance a later prefix, and no step can be skipped.

## Result boundary

A valid transition records:

```json
{
  "status": "COMPLETED_PREFIX_ADVANCED",
  "fromCount": 0,
  "toCount": 1,
  "appendedStepId": "...",
  "nextStepId": "...",
  "nextStateFingerprint": "..."
}
```

Governance freezes:

```json
{
  "executesTechnicalAction": false,
  "advancesLogicalCompletedPrefix": true,
  "persistsExternalState": false,
  "automaticPromotion": false,
  "promotesHnkCanon": false,
  "authority": "COMPLETED_PREFIX_TRANSITION_RECORD_NOT_TECHNICAL_EXECUTOR"
}
```

`advancesLogicalCompletedPrefix=true` means the generated `nextState` is the new logical state artifact. It does not mean the tool merged a PR, deployed code, changed a Git ref or mutated an external database.

## CLI

First transition (genesis is created automatically when `--state` is omitted):

```bash
pnpm advance:rc1:completed-prefix -- \
  --plan ./dist/HOC-RC1-PROMOTION-EXECUTION-PLAN.json \
  --authorization ./dist/HOC-RC1-TECHNICAL-EXECUTION-AUTHORIZATION.json \
  --receipt ./dist/HOC-RC1-TECHNICAL-MUTATION-RECEIPT.json \
  --verification ./dist/HOC-RC1-MUTATION-EVIDENCE-VERIFICATION.json
```

Subsequent transitions:

```bash
pnpm advance:rc1:completed-prefix -- \
  --plan ./dist/HOC-RC1-PROMOTION-EXECUTION-PLAN.json \
  --authorization ./dist/HOC-RC1-TECHNICAL-EXECUTION-AUTHORIZATION.json \
  --receipt ./dist/HOC-RC1-TECHNICAL-MUTATION-RECEIPT.json \
  --verification ./dist/HOC-RC1-MUTATION-EVIDENCE-VERIFICATION.json \
  --state ./dist/HOC-RC1-COMPLETED-PREFIX-STATE.json
```

Default outputs:

- `dist/HOC-RC1-COMPLETED-PREFIX-TRANSITION.json`
- `dist/HOC-RC1-COMPLETED-PREFIX-STATE.json`

The CLI reads local JSON and writes local JSON only. It has no process executor, GitHub/Vercel API mutation or network fetch.

## Pipeline

```text
Promotion Plan
  -> Technical Authorization
  -> Pre-Mutation Guard ALLOW
  -> external/manual technical action
  -> Technical Mutation Receipt (reported result)
  -> Mutation Evidence Verification (verified evidence)
  -> Completed-Prefix Transition (logical state N -> N+1)
  -> next Pre-Mutation Guard evaluation
```

`HNK_CANON` remains outside this operational pipeline.
