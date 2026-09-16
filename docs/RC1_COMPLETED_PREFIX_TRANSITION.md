# HOC V1.0 RC1 — Completed-Prefix State Transition V2

State contracts remain:

- `HOC-RC1-COMPLETED-PREFIX-STATE/V1`
- `HOC-RC1-COMPLETED-PREFIX-STATE-FINGERPRINT/V1`

Transition contracts are now:

- `HOC-RC1-COMPLETED-PREFIX-TRANSITION/V2`
- `HOC-RC1-COMPLETED-PREFIX-TRANSITION-FINGERPRINT/V2`

Authority remains `COMPLETED_PREFIX_TRANSITION_RECORD_NOT_TECHNICAL_EXECUTOR`.

## Purpose

Transition V2 advances the fingerprinted logical completed prefix from `N` to `N+1` only after the technical action was reported, independently verified, and proven to have been authorized by Guard V2 against the **same exact current state fingerprint**.

It does not execute the technical action itself.

## State contract remains V1

The state format did not change. It still binds the exact Promotion Execution Plan fingerprint, Stack Landing version, ordered completed step IDs, lineage, completed count, next step and governance.

Only transition semantics changed.

## Guard/state binding added in V2

Before any logical advancement, Transition V2 revalidates:

`receipt.preMutationGuard`

with the exact:

`currentState`

using the Guard V2 inspector.

Required equalities include:

- `receipt.preMutationGuard.completedPrefixStateFingerprint === currentState.stateFingerprint`;
- guard completed count equals current state completed count;
- guard `stepId` and `expectedNextStepId` equal `currentState.nextStepId`;
- guard plan fingerprint and authorization ID remain valid;
- `guardFingerprint` recalculates correctly.

This prevents a receipt authorized under one valid state from being replayed against another state that merely has a compatible-looking next step.

## Transition fingerprint V2

The Transition V2 fingerprint additionally binds `sourceGuard`:

- Guard V2 version;
- `guardFingerprint`;
- `completedPrefixStateFingerprint`;
- completed count;
- step ID;
- authorization ID.

Therefore changing the authorization-state context after transition creation invalidates the transition fingerprint.

## Exact N -> N+1 rules

A transition is accepted only when:

1. current Completed Prefix State V1 is valid;
2. Guard V2 snapshot inside the receipt validates against that exact state;
3. Mutation Evidence Verification is valid and `eligibleForCompletedPrefix=true`;
4. receipt and verification reference the exact `currentState.nextStepId`;
5. transition timestamp does not predate verification;
6. next state preserves the complete current prefix and appends exactly one step;
7. lineage appends the exact verification fingerprint;
8. next-state fingerprint and Transition V2 fingerprint validate.

State swap, step skip, replay and sourceGuard tampering fail closed.

## Result boundary

A valid transition records `COMPLETED_PREFIX_ADVANCED` but still freezes:

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

The generated `nextState` is a local logical state artifact. Transition V2 does not merge a PR, deploy code, change Git refs or write production state.

## CLI

The CLI remains:

```bash
pnpm advance:rc1:completed-prefix -- \
  --plan ./dist/HOC-RC1-PROMOTION-EXECUTION-PLAN.json \
  --authorization ./dist/HOC-RC1-TECHNICAL-EXECUTION-AUTHORIZATION.json \
  --receipt ./dist/HOC-RC1-TECHNICAL-MUTATION-RECEIPT.json \
  --verification ./dist/HOC-RC1-MUTATION-EVIDENCE-VERIFICATION.json \
  --state ./dist/HOC-RC1-COMPLETED-PREFIX-STATE.json
```

For the first transition, `--state` may be omitted and the deterministic genesis state is created locally.

## Pipeline

```text
Completed Prefix State V1
  -> Pre-Mutation Guard V2 (state-bound fingerprinted ALLOW)
  -> external/manual technical action
  -> Technical Mutation Receipt V1 (preserves guard/state binding)
  -> Mutation Evidence Verification V1
  -> Completed-Prefix Transition V2 (revalidates exact Guard V2/currentState binding)
  -> next Completed Prefix State V1
```

`HNK_CANON` remains outside this operational pipeline.
