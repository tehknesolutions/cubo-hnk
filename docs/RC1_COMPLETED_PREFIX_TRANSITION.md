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

Each state carries `HOC-RC1-COMPLETED-PREFIX-STATE-FINGERPRINT/V1`, binding release ID, plan fingerprint, Stack Landing version, ordered completed steps, lineage, count, next step and non-execution governance.

The fingerprint makes accidental or silent edits detectable. It is **not** a digital signature or external trust anchor.

## Lineage

Each completed step adds one lineage entry containing its index, step ID, receipt ID, evidence-verification ID/fingerprint and transition timestamp.

## Transition rules

A transition is accepted only when:

1. current Completed Prefix State is valid for the exact plan;
2. `completedStepIds` form the exact runbook prefix;
3. plan is not already complete;
4. Mutation Evidence Verification is valid and `eligibleForCompletedPrefix=true`;
5. verified receipt step equals the state's exact `nextStepId`;
6. `transitionedAt >= verification.verifiedAt`;
7. next state appends exactly one step and preserves the previous prefix;
8. lineage appends the exact verification fingerprint;
9. state and transition fingerprints validate.

A verified step cannot be replayed to advance a later prefix, and no step can be skipped.

## Guard V2 handoff

The generated `nextState` is the required state artifact for the next:

`HOC-RC1-PRE-MUTATION-GUARD/V2`

Guard V2 validates this state and derives the only allowed candidate from `nextState.nextStepId`; callers no longer provide a free-form `completedStepIds` list.

The subsequent Technical Mutation Receipt preserves the exact Guard V2 `completedPrefixStateFingerprint` and `guardFingerprint` under which the next action was authorized.

## Result boundary

A valid transition records `COMPLETED_PREFIX_ADVANCED` and freezes:

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

`advancesLogicalCompletedPrefix=true` means the generated `nextState` is the new local logical state artifact. It does not mean the tool merged a PR, deployed code, changed a Git ref or mutated an external database.

## CLI

First transition, with genesis generated automatically when `--state` is omitted:

```bash
pnpm advance:rc1:completed-prefix -- \
  --plan ./dist/HOC-RC1-PROMOTION-EXECUTION-PLAN.json \
  --authorization ./dist/HOC-RC1-TECHNICAL-EXECUTION-AUTHORIZATION.json \
  --receipt ./dist/HOC-RC1-TECHNICAL-MUTATION-RECEIPT.json \
  --verification ./dist/HOC-RC1-MUTATION-EVIDENCE-VERIFICATION.json
```

Subsequent transitions additionally pass:

`--state ./dist/HOC-RC1-COMPLETED-PREFIX-STATE.json`

Default outputs:

- `dist/HOC-RC1-COMPLETED-PREFIX-TRANSITION.json`
- `dist/HOC-RC1-COMPLETED-PREFIX-STATE.json`

The CLI reads/writes local JSON only and has no process executor or GitHub/Vercel mutation surface.

## Pipeline

```text
Promotion Plan
  -> Technical Authorization
  -> fingerprinted Completed Prefix State
  -> Pre-Mutation Guard V2 ALLOW
  -> external/manual technical action
  -> Technical Mutation Receipt (state-bound reported result)
  -> Mutation Evidence Verification
  -> Completed-Prefix Transition (logical N -> N+1)
  -> next fingerprinted Completed Prefix State
  -> next Pre-Mutation Guard V2
```

`HNK_CANON` remains outside this operational pipeline.
