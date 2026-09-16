# HOC V1.0 RC1 — Pre-Mutation Guard V1

Contract:

`HOC-RC1-PRE-MUTATION-GUARD/V1`

Authority:

`PRE_MUTATION_GUARD_DECISION_NOT_ACTION_EXECUTOR`

## Purpose

The Pre-Mutation Guard is the last pure policy check before a future technical action.

It receives:

- the exact Promotion Execution Plan;
- a Technical Execution Authorization record bound to that plan fingerprint;
- the requested plan step ID;
- the ordered list of plan steps already completed.

It returns only:

`ALLOW`

or

`DENY`

It never executes the requested action.

## Strict prefix rule

`completedStepIds` must be an exact prefix of `plan.steps`.

Examples:

Valid:

```text
FREEZE_APPROVED_EVIDENCE
RECONFIRM_CI_AND_RUNTIME
```

Invalid:

```text
RECONFIRM_CI_AND_RUNTIME
FREEZE_APPROVED_EVIDENCE
```

Invalid:

```text
FREEZE_APPROVED_EVIDENCE
LAND_PR_1
```

because the second runbook step was skipped.

Only the exact next step after the valid prefix can receive `ALLOW`.

## Authorization rule

Even when sequence is correct, the next step must be listed in the exact Technical Execution Authorization record.

Therefore:

- authorization cannot skip sequence;
- sequence cannot bypass authorization;
- a valid authorization for a future step remains denied until all prior runbook steps have been completed in order.

## Plan / authorization integrity

The guard first verifies:

1. `HOC-RC1-PROMOTION-EXECUTION-PLAN/V1` structure;
2. `HOC-RC1-PROMOTION-PLAN-FINGERPRINT/V1`;
3. `HOC-RC1-TECHNICAL-EXECUTION-AUTHORIZATION/V1` against that exact fingerprint.

Tampering with a bound plan field returns:

`DENY / INVALID_PLAN`

An authorization for another plan returns:

`DENY / INVALID_AUTHORIZATION`

## Decision codes

Current codes:

- `AUTHORIZED_NEXT_STEP`
- `INVALID_PLAN`
- `INVALID_AUTHORIZATION`
- `INVALID_COMPLETION_PREFIX`
- `UNKNOWN_STEP`
- `STEP_ALREADY_COMPLETED`
- `PLAN_ALREADY_COMPLETE`
- `OUT_OF_SEQUENCE`
- `STEP_NOT_AUTHORIZED`

Only `AUTHORIZED_NEXT_STEP` produces `decision=ALLOW`.

## CLI

```bash
pnpm guard:rc1:mutation -- \
  --plan ./dist/HOC-RC1-PROMOTION-EXECUTION-PLAN.json \
  --authorization ./dist/HOC-RC1-TECHNICAL-EXECUTION-AUTHORIZATION.json \
  --step LAND_PR_1 \
  --completed FREEZE_APPROVED_EVIDENCE,RECONFIRM_CI_AND_RUNTIME
```

Exit codes:

- `0` = `ALLOW`;
- `2` = structured `DENY`;
- `1` = CLI/input failure before policy evaluation.

## No execution surface

The guard CLI reads local JSON and prints a policy decision.

It does not:

- import `child_process`;
- run git commands;
- call GitHub APIs;
- call Vercel APIs;
- modify package versions;
- create tags/releases;
- deploy production;
- promote `HNK_CANON`.

Every verdict freezes:

```json
{
  "governance": {
    "executesAction": false,
    "automaticExecution": false,
    "requiresExecutorRevalidation": true,
    "promotesHnkCanon": false,
    "authority": "PRE_MUTATION_GUARD_DECISION_NOT_ACTION_EXECUTOR"
  }
}
```

## Future executor boundary

A future executor or manual operator must re-run this guard immediately before a technical mutation.

An earlier `ALLOW` is not a timeless permission because repository/deployment state may have changed afterward.

The executor remains outside this contract.

## Pipeline

```text
QA evidence
  -> Release Evidence Ledger
  -> Promotion Readiness V1
  -> Human Promotion Decision V1
  -> Promotion Execution Plan V1
  -> Technical Execution Authorization V1
  -> Pre-Mutation Guard V1 (ALLOW / DENY only)
  -> separately implemented technical executor/manual mutation
```

No component above the last arrow performs the mutation itself.
