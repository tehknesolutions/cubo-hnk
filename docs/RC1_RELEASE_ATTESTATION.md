# HOC V1.0 RC1 — Release Attestation

Protocol:

`HOC-RC1-RELEASE-ATTESTATION/V1`

Frozen fingerprint:

`08e003a28185fcd31a806549588547994bcc3075a256bc6cbe6d79d9558f3e90`

## Purpose

Identify the exact frozen RC1 runtime contract served by an environment.

A deployment can be reachable and still be stale, partially updated or built from another branch. The Release Attestation gives the deployment verifier a deterministic identity to check before accepting the rest of the runtime evidence.

It is not a signature from an external authority and it is not a stable-promotion token. It is a deterministic SHA-256 identity of the frozen RC1 contract.

## Attested core

The fingerprint binds:

- release ID `HOC-V1.0-RC1`;
- package version `1.0.0-rc.1`;
- RAW `HNK-ORACULUM-CUBE/V0.4`;
- legality `HOC-CUBE-LEGALITY/V0.8`;
- ritual `HOC-RITUAL-INTEGRITY/V0.9`;
- manifest `HOC-SESSION-MANIFEST/V0.10`;
- canonical JSON `HOC-CANONICAL-JSON/V1`;
- runtime self-test `HOC-RC1-RUNTIME-SELFTEST/V1`;
- official STATE seed;
- official RITUAL_32 final state;
- synthetic Manifest checksum + Session ID;
- HNK40 structural glyph-set hash;
- HNK40 status `PREPRODUCTION_NOT_OFFICIAL`.

## Fingerprint rule

Objects are recursively serialized with keys in lexical order and compact JSON representation.

The fingerprint is:

`SHA256("HOC-RC1-RELEASE-ATTESTATION/V1|" + CANONICAL_CORE_JSON)`

Expected result:

`08e003a28185fcd31a806549588547994bcc3075a256bc6cbe6d79d9558f3e90`

The value was independently cross-checked outside the implementation before promotion of this source gate to PASS.

## Engine API

Module:

`@hnk/oraculum-engine/release-attestation`

Function:

`buildRc1ReleaseAttestation()`

The returned object contains:

- attestation protocol version;
- bound core;
- SHA-256 fingerprint;
- expected fingerprint;
- `matchesExpected`;
- explicit governance limits.

## HTTP API

`GET /api/oraculum/release`

Successful response includes:

- `X-HOC-Release-Id: HOC-V1.0-RC1`;
- `X-HOC-Release-Fingerprint: 08e003...f3e90`;
- no-store cache policy through the shared HOC response helper.

If the calculated fingerprint does not equal the frozen expected fingerprint, the route fails closed with HTTP 503.

## Deployment gate

`pnpm verify:rc1:deployment` checks this endpoint before self-test, page, oracle and manifest checks.

A deployment evidence artifact is not accepted as PASS by the Release Evidence Ledger unless it records:

- attestation version exactly `HOC-RC1-RELEASE-ATTESTATION/V1`;
- expected fingerprint exactly the frozen RC1 fingerprint;
- actual fingerprint equal to the same value;
- `matchesExpected === true`.

Therefore a stale or foreign deployment cannot satisfy the deployment gate merely by reproducing one golden oracle seed.

## Governance

Attestation authority:

`RC1_RUNTIME_IDENTITY_ATTESTATION_NOT_STABLE_PROMOTION`

It always preserves:

- `promotesStable=false`;
- `promotesHnkCanon=false`;
- `replacesGitHubCI=false`;
- `replacesPhysicalQa=false`.

A valid release fingerprint proves runtime identity against the frozen RC1 contract only. It does not prove supernatural claims, production readiness, CI execution, physical-cube QA or human approval.
