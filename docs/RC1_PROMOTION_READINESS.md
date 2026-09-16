# HOC V1.0 RC1 — Promotion Readiness V1

Protocol:

`HOC-RC1-PROMOTION-READINESS/V1`

Authority:

`READINESS_ASSESSMENT_NOT_PROMOTION_AUTHORITY`

Route:

`/oraculum/qa/readiness`

## Purpose

Promotion Readiness receives an exported `HOC-RC1-RELEASE-EVIDENCE-LEDGER/V1` and converts the ledger into a final pre-promotion assessment.

It answers:

- which mandatory gates are PASS;
- which mandatory gates remain PENDING;
- which mandatory gates are BLOCKED;
- which evidence is supplemental rather than mandatory;
- whether the package is ready to be submitted to an explicit human V1.0 decision.

It does **not** promote the release.

## Required pre-human gates

The following gates must be PASS before the evaluator may return `READY_FOR_HUMAN_REVIEW`:

1. `runtimeSelfTest`;
2. `deploymentVerification`;
3. `physicalState`;
4. `physicalRitual`;
5. `cameraDevice`;
6. `crossDeviceManifest`;
7. `productionHardeningSource`;
8. `ciBuild`;
9. `manualFinalDocs`.

The human decision gate is intentionally outside this list.

## Supplemental evidence

`independentValidation` is supplemental.

A PASS strengthens the evidence package, especially while the GitHub Actions account/platform blocker exists, but it never replaces `ciBuild` and does not block future readiness if the required CI gate is independently PASS.

## Status model

### `INVALID_LEDGER`

The imported ledger has the wrong protocol/release or is missing a mandatory gate.

### `BLOCKED`

At least one mandatory pre-human gate is `BLOCKED`.

### `EVIDENCE_INCOMPLETE`

There are no mandatory blockers, but one or more mandatory gates remain `PENDING`.

### `READY_FOR_HUMAN_REVIEW`

All mandatory pre-human gates are PASS.

This status means only that the evidence package is ready to be presented for a human decision. It does not mean `V1.0 stable`, merge authorization or `HNK_CANON` promotion.

## Output artifact

The browser can export:

`HOC-RC1-PROMOTION-READINESS/V1`

The artifact contains:

- source ledger summary;
- required gate counts;
- blockers;
- pending mandatory evidence;
- missing mandatory gates;
- supplemental evidence state;
- human decision state;
- ordered next actions;
- governance flags.

The artifact is not cryptographically signed.

## Governance

The assessment always declares:

- `automaticPromotion=false`;
- `mergeAuthorized=false`;
- `stablePromotionAuthorized=false`;
- `hnkCanonPromotionAuthorized=false`.

There is intentionally no automatic promotion path.

Even after `READY_FOR_HUMAN_REVIEW`, promotion requires a separate explicit human decision.

## Current RC1 implication

While GitHub Actions Issue #6 leaves `ciBuild=BLOCKED`, Promotion Readiness must remain `BLOCKED` regardless of any supplemental Independent Executor evidence.

Physical STATE, physical RITUAL_32, Camera/Device, cross-device Manifest and deployment evidence also remain independently required until executed.
