# HOC V1.0 RC1 — Technical Execution Authorization V1

Contract:

`HOC-RC1-TECHNICAL-EXECUTION-AUTHORIZATION/V1`

Authority:

`TECHNICAL_EXECUTION_AUTHORIZATION_RECORD_NOT_EXECUTOR`

## Purpose

This layer is the explicit boundary between a dry-run promotion plan and later technical actions.

It records **which exact steps of which exact Promotion Execution Plan have been authorized**. It does not execute those steps.

The authorization is intentionally step-scoped. Permission for one step never implies permission for another step, phase, stable version change, tag/release, production deployment or `HNK_CANON`.

## Exact-plan binding

Promotion Execution Plan V1 now carries a deterministic operational fingerprint:

`HOC-RC1-PROMOTION-PLAN-FINGERPRINT/V1`

The fingerprint excludes `generatedAt`, but binds:

- plan protocol/version;
- release ID;
- source human decision record;
- Stack Landing plan version/count/tail;
- target stable version/tag;
- every ordered step and instruction;
- non-execution governance.

If any bound plan field changes, `verifyRc1PromotionExecutionPlan()` rejects the old fingerprint.

Technical authorization stores that exact `planFingerprint`. An authorization therefore cannot be moved silently to a changed plan.

## CLI

```bash
pnpm authorize:rc1:technical -- \
  --plan ./dist/HOC-RC1-PROMOTION-EXECUTION-PLAN.json \
  --steps LAND_PR_1,LAND_PR_2 \
  --authorizer "Release Operator" \
  --reason "Authorize only the first two parent-first landing steps." \
  --ack
```

Default output:

`dist/HOC-RC1-TECHNICAL-EXECUTION-AUTHORIZATION.json`

Optional:

```bash
--out ./path/to/authorization.json
```

## Stable and production boundaries

Any selected step in phase `STABLE_PREPARATION` requires:

```bash
--ack-stable
```

Any selected step in phase `DEPLOYMENT` or `POST_DEPLOYMENT` requires:

```bash
--ack-production
```

These acknowledgements do not execute the phase. They only make the intended scope explicit in the authorization record.

## Step-scoped semantics

A record contains:

```json
{
  "authorizedStepIds": ["LAND_PR_1"],
  "authorizedPhases": ["STACK_LANDING"],
  "authorizationScope": {
    "mode": "STEP_SCOPED",
    "authorizedStepCount": 1,
    "allPlanStepsAuthorized": false
  }
}
```

Only the listed step IDs are authorized.

For example, authorizing:

`LAND_PR_1`

does **not** authorize:

- `LAND_PR_2`;
- `PREPARE_STABLE_VERSION`;
- `PREPARE_V1_TAG_RELEASE`;
- `PREPARE_PRODUCTION_DEPLOYMENT`;
- `VERIFY_PRODUCTION_IDENTITY`;
- any other plan step.

## Even full-scope authorization is not an executor

Even if a human intentionally authorizes every step in a valid plan, the record still freezes:

```json
{
  "governance": {
    "executesActions": false,
    "automaticExecution": false,
    "authorizesOnlyListedSteps": true,
    "productionNotImpliedByNonProduction": true,
    "promotesHnkCanon": false,
    "authority": "TECHNICAL_EXECUTION_AUTHORIZATION_RECORD_NOT_EXECUTOR"
  }
}
```

No GitHub merge, package edit, tag, release, Vercel deployment or shell command is performed by the authorization generator.

## `HNK_CANON`

`HNK_CANON` is outside the scope of this contract.

There is no technical-authorization step that promotes HNK40, HNK linguistic semantics or spiritual/canonical claims. The record permanently keeps:

`promotesHnkCanon=false`

## Fail-closed rules

Authorization generation or verification fails when:

- the Promotion Execution Plan fingerprint is invalid;
- an unknown step ID is requested;
- a step ID is repeated;
- the authorization points to another plan fingerprint;
- stable steps lack stable-boundary acknowledgement;
- deployment/post-deployment steps lack production-boundary acknowledgement;
- required authorizer/rationale/general acknowledgement is missing;
- governance claims automatic execution or `HNK_CANON` promotion.

## Pipeline position

```text
QA evidence
  -> Release Evidence Ledger
  -> Promotion Readiness V1
  -> Human Promotion Decision V1
  -> Promotion Execution Plan V1 (DRY_RUN_ONLY)
  -> Technical Execution Authorization V1 (STEP_SCOPED)
  -> separately implemented/executed technical action
```

The last arrow is intentionally outside this contract.
