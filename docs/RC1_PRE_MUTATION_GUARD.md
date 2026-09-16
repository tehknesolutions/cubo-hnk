# HOC V1.0 RC1 — Pre-Mutation Guard V2

Contract:

`HOC-RC1-PRE-MUTATION-GUARD/V2`

Decision fingerprint:

`HOC-RC1-PRE-MUTATION-GUARD-FINGERPRINT/V1`

Authority:

`PRE_MUTATION_GUARD_DECISION_NOT_ACTION_EXECUTOR`

## Purpose

The Pre-Mutation Guard is the last pure policy check before a technical action.

V2 removes the free-form `completedStepIds` input. It now consumes the exact fingerprint-bound:

`HOC-RC1-COMPLETED-PREFIX-STATE/V1`

Inputs:

- exact Promotion Execution Plan;
- Technical Execution Authorization bound to that plan fingerprint;
- fingerprint-valid Completed Prefix State;
- requested step ID.

It returns only `ALLOW` or `DENY`. It never executes the requested action.

## Why V2 exists

V1 accepted a caller-supplied ordered list of completed step IDs. It validated that the list was a strict runbook prefix, but the list itself was not a persistent tamper-evident state artifact.

V2 replaces that manual input with the state created by Completed-Prefix State Transition V1. The guard therefore consumes:

- `completedCount`;
- exact `nextStepId`;
- state lineage;
- `stateFingerprint`;
- source Stack Landing version;
- exact Promotion Plan fingerprint.

A modified state fails closed as:

`DENY / INVALID_COMPLETED_PREFIX_STATE`

## Exact next-step rule

The requested step must equal:

`completedPrefixState.nextStepId`

The state itself must validate as the exact ordered prefix of `plan.steps`.

Therefore a caller cannot skip, reorder or duplicate prior steps by constructing a new `completedStepIds` CLI argument; that argument no longer exists.

## Authorization rule

Even with a valid state and exact next step, that step must be present in the exact Technical Execution Authorization record.

Sequence and authorization remain independent gates.

## Decision fingerprint

Every verdict carries `guardFingerprint` calculated with:

`HOC-RC1-PRE-MUTATION-GUARD-FINGERPRINT/V1`

It binds:

- decision and code;
- requested and expected step IDs;
- completed count;
- Completed Prefix State fingerprint;
- source Stack Landing version;
- Promotion Plan fingerprint;
- Technical Authorization ID;
- detail and governance.

Changing any bound field invalidates the guard fingerprint.

## Receipt binding

Technical Mutation Receipt V1 now requires Guard V2.

The receipt stores the full Guard V2 snapshot, including:

- `completedPrefixStateFingerprint`;
- `guardFingerprint`;
- `completedCount`;
- `sourceStackPlanVersion`.

This prevents a later receipt from silently dropping the state context under which `ALLOW` was granted.

## Decision codes

Current codes:

- `AUTHORIZED_NEXT_STEP`
- `INVALID_PLAN`
- `INVALID_AUTHORIZATION`
- `INVALID_COMPLETED_PREFIX_STATE`
- `UNKNOWN_STEP`
- `PLAN_ALREADY_COMPLETE`
- `OUT_OF_SEQUENCE`
- `STEP_NOT_AUTHORIZED`

Only `AUTHORIZED_NEXT_STEP` produces `decision=ALLOW`.

## CLI

```bash
pnpm guard:rc1:mutation -- \
  --plan ./dist/HOC-RC1-PROMOTION-EXECUTION-PLAN.json \
  --authorization ./dist/HOC-RC1-TECHNICAL-EXECUTION-AUTHORIZATION.json \
  --state ./dist/HOC-RC1-COMPLETED-PREFIX-STATE.json \
  --step LAND_PR_1
```

`--completed` was removed.

Exit codes:

- `0` = `ALLOW`;
- `2` = structured `DENY`;
- `1` = CLI/input failure.

## No execution surface

The guard reads local JSON and emits a policy decision. It cannot run shell/git, call GitHub/Vercel, merge, version, tag, release, deploy or promote `HNK_CANON`.

Every verdict freezes:

```json
{
  "governance": {
    "executesAction": false,
    "automaticExecution": false,
    "requiresExecutorRevalidation": true,
    "consumesFingerprintBoundCompletedState": true,
    "promotesHnkCanon": false,
    "authority": "PRE_MUTATION_GUARD_DECISION_NOT_ACTION_EXECUTOR"
  }
}
```

## Pipeline

```text
Completed Prefix State V1
  -> Pre-Mutation Guard V2 (fingerprinted ALLOW / DENY)
  -> external/manual technical action
  -> Technical Mutation Receipt V1 (Guard V2 state-bound snapshot)
  -> Mutation Evidence Verification V1
  -> Completed-Prefix State Transition V1
  -> next fingerprint-bound Completed Prefix State
```

No guard decision performs the technical mutation itself.
