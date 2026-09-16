# HOC V1.0 RC1 — Promotion Execution Plan V1

Protocol:

`HOC-RC1-PROMOTION-EXECUTION-PLAN/V1`

Authority:

`PROMOTION_EXECUTION_PLAN_NOT_EXECUTION_AUTHORITY`

Mode:

`DRY_RUN_ONLY`

## Purpose

This layer converts a valid future `APPROVE_V1_0` human decision record plus the current parent-first Stack Landing Plan into a structured operational runbook. The ordered steps are derived deterministically from the inputs; the exported artifact also carries a `generatedAt` timestamp and therefore is not itself a timeless content hash.

It answers:

> If V1.0 promotion is later separately authorized, in what order should the technical actions be reviewed and executed?

It does **not** execute those actions.

## Required inputs

1. `HOC-RC1-HUMAN-PROMOTION-DECISION/V1` with `decision=APPROVE_V1_0`;
2. the approval must still carry a coherent readiness matrix of 9/9 mandatory PASS gates;
3. `release/v1.0-rc1/STACK_LANDING_PLAN.json` must be valid, parent-first and keep all merge/stable/HNK_CANON authorities false.

`DEFER`, `REJECT`, malformed approval records or reordered/unsafe stack plans fail closed.

## Operational plan fingerprint

Each generated plan carries `planFingerprint` using:

`HOC-RC1-PROMOTION-PLAN-FINGERPRINT/V1`

The fingerprint deliberately excludes `generatedAt`, but binds the release ID, source human decision, Stack Landing identity, target stable version/tag, ordered steps, step instructions, summary and non-execution governance.

Therefore two equivalent plan generations at different timestamps have the same fingerprint, while any bound plan mutation invalidates the fingerprint.

`verifyRc1PromotionExecutionPlan()` recalculates this fingerprint and fails closed on mismatch.

This fingerprint is operational metadata. It does not enter or alter the frozen HOC RC1 Release Attestation fingerprint.

## CLI

```bash
pnpm plan:rc1:promotion -- --decision ./path/to/HOC-V1.0-RC1-HUMAN-DECISION-APPROVE_V1_0.json
```

Optional parameters:

```bash
--stack ./release/v1.0-rc1/STACK_LANDING_PLAN.json
--out ./dist/HOC-RC1-PROMOTION-EXECUTION-PLAN.json
```

The default output is:

`dist/HOC-RC1-PROMOTION-EXECUTION-PLAN.json`

## No execution surface

The CLI only reads local JSON files, validates the approval record and stack topology, and writes a local JSON plan.

It does not import `child_process`, call GitHub/Vercel APIs or use `fetch`.

Every generated step freezes:

```json
{
  "executable": false,
  "requiresSeparateExecutionAuthorization": true
}
```

The top-level plan freezes:

```json
{
  "mode": "DRY_RUN_ONLY",
  "governance": {
    "executionAuthorized": false,
    "executesMerge": false,
    "executesVersionChange": false,
    "createsTagOrRelease": false,
    "executesDeployment": false,
    "promotesHnkCanon": false,
    "authority": "PROMOTION_EXECUTION_PLAN_NOT_EXECUTION_AUTHORITY"
  }
}
```

## Planned phases

The runbook is ordered as:

1. archive/freeze the approved evidence package;
2. reconfirm mandatory CI/runtime/physical/deployment evidence has not regressed;
3. review each stacked PR parent-first, one by one;
4. after stack landing, rerun clean install/tests/typecheck/build/self-test/vector checks on `main`;
5. prepare stable package version `1.0.0` as a separate reviewed change;
6. prepare tag/release `v1.0.0` as a separate reviewed action;
7. prepare production deployment from the exact approved stable commit;
8. verify production Release Attestation, Build Provenance, golden RAW seed, Manifest V0.10 and hardening behavior;
9. archive final V1.0 evidence.

For Stack Landing V11, the current runbook contains 28 PR landing steps and 36 total steps.

## Governance boundary

An approved human decision is still not execution authorization.

A generated Promotion Execution Plan is also not execution authorization.

Technical mutations remain separate actions requiring explicit authorization and a fresh pre-mutation guard decision. This layer cannot merge PRs, mark CI PASS, edit package versions, create tags/releases, deploy Vercel production, change the Release Attestation fingerprint or promote `HNK_CANON`.

## Relationship to the release pipeline

```text
QA evidence
  -> Release Evidence Ledger
  -> Promotion Readiness V1
  -> Human Promotion Decision V1
  -> Promotion Execution Plan V1 (DRY_RUN_ONLY + planFingerprint)
  -> Technical Execution Authorization V1 (STEP_SCOPED)
  -> Pre-Mutation Guard V1 (ALLOW / DENY)
  -> separately implemented/executed technical action
```

No arrow above the final executor performs a technical promotion automatically.
