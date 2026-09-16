# HOC V1.0 RC1 — Promotion Execution Plan V1

Protocol: `HOC-RC1-PROMOTION-EXECUTION-PLAN/V1`

Authority: `PROMOTION_EXECUTION_PLAN_NOT_EXECUTION_AUTHORITY`

Mode: `DRY_RUN_ONLY`

## Purpose

This layer converts a valid future `APPROVE_V1_0` human decision plus the current parent-first Stack Landing Plan into a structured operational runbook. The ordered steps are derived from the inputs; the exported artifact also carries `generatedAt` and is therefore not itself a timeless content hash.

It never executes those steps.

## Required inputs

1. `HOC-RC1-HUMAN-PROMOTION-DECISION/V1` with `decision=APPROVE_V1_0`;
2. coherent 9/9 mandatory readiness PASS matrix;
3. valid parent-first `release/v1.0-rc1/STACK_LANDING_PLAN.json` with merge/stable/HNK_CANON authorities false.

Malformed approval, DEFER/REJECT or unsafe stack fail closed.

## Operational fingerprint

Each plan carries `HOC-RC1-PROMOTION-PLAN-FINGERPRINT/V1` as `planFingerprint`.

The fingerprint excludes only `generatedAt` and binds release ID, human decision, Stack Landing identity, target stable version/tag, ordered step IDs/instructions, summary and non-execution governance. Equivalent plan generations at different timestamps match; any bound plan mutation invalidates the fingerprint.

This operational fingerprint does not enter the frozen HOC RC1 Release Attestation fingerprint.

## CLI

```bash
pnpm plan:rc1:promotion -- --decision ./path/to/HOC-V1.0-RC1-HUMAN-DECISION-APPROVE_V1_0.json
```

Optional: `--stack <path>` and `--out <path>`.

The CLI reads local JSON and writes local JSON only. It has no GitHub/Vercel/network/process mutation surface.

Every step freezes:

```json
{"executable":false,"requiresSeparateExecutionAuthorization":true}
```

Top-level governance freezes execution, merge, version change, release creation, deployment and HNK_CANON promotion to false.

## Current Stack V12

`HOC-V1.0-RC1-STACK-LANDING/V12` contains **29 parent-first PR landing steps** and the generated runbook contains **37 total steps**.

The phases remain:

1. freeze approved evidence;
2. reconfirm mandatory gates;
3. review/land each PR parent-first;
4. verify main after stack landing;
5. prepare stable version `1.0.0`;
6. prepare tag/release `v1.0.0`;
7. prepare production deployment;
8. verify production identity/runtime;
9. archive final release evidence.

## Governance boundary

A human APPROVE record is not technical authorization. A Promotion Execution Plan is not technical authorization. Technical authorization is step-scoped and still does not execute anything. Pre-Mutation Guard ALLOW is a policy decision, not an action. A Technical Mutation Receipt records only an externally/manual reported result and is not execution proof until a separate verification layer accepts its evidence.

## Relationship to the release pipeline

```text
QA evidence
  -> Release Evidence Ledger
  -> Promotion Readiness V1
  -> Human Promotion Decision V1
  -> Promotion Execution Plan V1 (DRY_RUN_ONLY + planFingerprint)
  -> Technical Execution Authorization V1 (STEP_SCOPED)
  -> Pre-Mutation Guard V1 (ALLOW / DENY)
  -> separately executed external/manual technical action
  -> Technical Mutation Receipt V1 (UNVERIFIED_EXTERNAL_RESULT)
  -> future independent evidence verification
```

No layer above the external/manual executor performs a technical mutation automatically, and no layer in this pipeline promotes `HNK_CANON`.
