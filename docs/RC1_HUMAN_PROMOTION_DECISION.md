# HOC V1.0 RC1 — Human Promotion Decision Record V1

Protocol:

`HOC-RC1-HUMAN-PROMOTION-DECISION/V1`

Authority:

`HUMAN_DECISION_RECORD_NOT_EXECUTION_AUTHORITY`

Route:

`/oraculum/qa/decision`

## Purpose

This layer records an explicit human decision about `RC1 → V1.0` after the Promotion Readiness assessment.

It is an audit record only.

It does not execute:

- merge;
- rebase/retarget;
- package version changes;
- Git tags or releases;
- deployment;
- HNK_CANON promotion.

## Input

The page accepts only a valid:

`HOC-RC1-PROMOTION-READINESS/V1`

for:

`HOC-V1.0-RC1`

The artifact is processed locally in the browser.

## Decisions

### `APPROVE_V1_0`

Available only when the imported readiness artifact reports:

`READY_FOR_HUMAN_REVIEW`

and `readyForHumanReview === true`.

A blocked, incomplete, malformed or foreign readiness artifact cannot generate an approval record.

### `DEFER`

Records a decision to postpone promotion.

A valid readiness artifact may be incomplete or blocked.

### `REJECT`

Records a decision not to promote the current RC1 package.

A valid readiness artifact may be incomplete or blocked.

## Human fields

Every record requires:

- reviewer/responsible label;
- rationale;
- explicit acknowledgement that the record performs no automatic technical action.

## Record contents

The exported JSON contains:

- decision protocol/version;
- release ID;
- record ID;
- timestamp;
- human reviewer label;
- rationale;
- source readiness status;
- acknowledgement flags;
- execution-governance flags.

## Governance

Every record states:

- `executesMerge=false`;
- `executesDeployment=false`;
- `changesPackageVersion=false`;
- `promotesHnkCanon=false`;
- `automaticPromotion=false`.

An `APPROVE_V1_0` record means the human decision has been documented. It still does not perform the promotion.

Any future technical promotion workflow must consume that decision under a separate, explicitly authorized process and must continue to preserve the distinction between V1.0 stable promotion and HNK_CANON governance.
