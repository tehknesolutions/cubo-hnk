# HOC V1.0 RC1 — Build Provenance V1

Protocol:

`HOC-RC1-BUILD-PROVENANCE/V1`

## Purpose

Build Provenance answers a different question from Release Attestation:

- Release Attestation: **is this runtime the frozen HOC V1.0 RC1 identity?**
- Build Provenance: **which build/deployment/commit served that runtime?**

The two must remain separate.

The frozen RC1 fingerprint must not change merely because the same release contract was built from a different branch name, deployment ID or commit that preserves the frozen identity.

## Authority

`BUILD_PROVENANCE_METADATA_NOT_RELEASE_IDENTITY`

Source class:

`RUNTIME_ENV_METADATA_UNHASHED`

Governance:

- `entersReleaseFingerprint=false`
- `promotesStable=false`
- `promotesHnkCanon=false`
- `replacesGitHubCI=false`

## Runtime metadata

The web runtime reads supported Vercel system metadata when available:

- `VERCEL_GIT_COMMIT_SHA`
- `VERCEL_GIT_COMMIT_REF`
- `VERCEL_GIT_PROVIDER`
- `VERCEL_GIT_REPO_OWNER`
- `VERCEL_GIT_REPO_SLUG`
- `VERCEL_GIT_PULL_REQUEST_ID`
- `VERCEL_DEPLOYMENT_ID`
- `VERCEL_URL`
- `VERCEL_BRANCH_URL`
- `VERCEL_TARGET_ENV` / `VERCEL_ENV`

For non-Vercel executors, explicit HOC fallbacks are supported for build SHA/ref/provider/environment/deployment ID.

No secret values are read or exposed by this contract.

## Release endpoint

`GET /api/oraculum/release`

returns:

- deterministic `attestation`;
- non-hashed `provenance`.

Headers include the release identity plus provenance markers. Commit/ref/deployment headers are emitted only when the corresponding metadata exists.

## Completeness

Build provenance is classified as:

- `COMMIT_AND_REF`
- `PARTIAL`
- `NONE`

`NONE` does not change the release fingerprint. It only means exact source-build traceability was unavailable in that runtime environment.

## Deployment verifier

Normal verification:

```bash
pnpm verify:rc1:deployment -- --url https://preview.example
```

Pinned commit verification:

```bash
pnpm verify:rc1:deployment -- --url https://preview.example --commit 6076efafe1f5
```

Environment alternative:

```bash
HOC_DEPLOY_URL=https://preview.example HOC_EXPECTED_COMMIT=6076efafe1f5 pnpm verify:rc1:deployment
```

`--commit` accepts a 7–64 hexadecimal Git SHA prefix.

When a commit is supplied, deployment verification fails unless the runtime provenance commit starts with that exact prefix.

When no commit is supplied, provenance is still recorded but commit pinning is explicitly marked `NOT_REQUESTED`.

## Evidence Ledger

Deployment evidence can reach PASS only if Build Provenance V1 is structurally valid and preserves its metadata-only authority.

If `expectedCommit` is present, the ledger also requires:

- `commitMatch=true`;
- a runtime `commitSha`;
- the runtime SHA to start with the expected prefix.

This prevents a handcrafted deployment evidence JSON from bypassing commit pinning.

## Boundary

Build Provenance does not:

- alter RAW V0.4;
- alter V0.8/V0.9/V0.10;
- alter the RC1 fingerprint;
- certify GitHub CI;
- certify physical QA;
- promote stable;
- promote HNK_CANON.

It is traceability metadata for a runtime that must still pass the independent release/runtime gates.
