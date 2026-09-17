# HOC V1.0 RC1 — Vercel Preview Bootstrap

Status: source configuration ready; dedicated `cubo-hnk` preview project/deployment still pending.

## Goal

Provide a reproducible **preview-only** path for `tehknesolutions/cubo-hnk` without promoting production.

The connected Vercel team is reachable, but no `cubo-hnk` project is present in the currently returned project set. A dedicated project therefore still needs to be created/linked from a real checkout or through the Vercel dashboard/Git integration before runtime verification can execute.

Deployment/runtime verification is tracked by Issue #45.

## Monorepo layout

Workspace root:

- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `apps/*`
- `packages/*`

Web app:

- `apps/web`

Local engine dependency:

- `packages/oraculum-engine`

`apps/web/package.json` consumes:

`@hnk/oraculum-engine = workspace:*`

Therefore the preview build must install from the workspace root even though the Vercel project Root Directory is `apps/web`.

## Frozen dependency policy

RC1 requires the repository-declared package manager and tracked dependency graph:

- package manager: `pnpm@10.17.1`;
- tracked lockfile: `pnpm-lock.yaml`;
- lockfile format: `9.0`;
- install command: `pnpm install --frozen-lockfile`.

Preview bootstrap must not fall back to `--no-frozen-lockfile`.

## Vercel project settings

Create/link a Vercel project for repository:

`tehknesolutions/cubo-hnk`

Use:

- Environment: Preview
- Framework: Next.js
- Root Directory: `apps/web`

`apps/web/vercel.json` freezes:

- install: `cd ../.. && pnpm install --frozen-lockfile`
- build: `cd ../.. && pnpm --filter @hnk/cubo-web build`

This preserves the workspace engine dependency while binding the preview to the tracked RC1 dependency graph.

## Local/executor preflight

From repository root:

`pnpm preview:preflight`

The preflight verifies:

- RC1 version identity;
- `pnpm@10.17.1` package-manager identity;
- tracked pnpm lockfile format V9;
- workspace paths;
- `workspace:*` engine dependency;
- Vercel framework/config;
- root-workspace frozen install/build commands;
- explicit rejection of `--no-frozen-lockfile`;
- absence of `--prod` in bootstrap commands.

## Preview creation

After a real checkout and Vercel login/link:

1. run `pnpm preview:preflight`;
2. run the independent validator when possible: `pnpm validate:rc1:independent`;
3. create/link the Vercel project with Root Directory `apps/web`;
4. create a preview deployment only;
5. preserve the preview URL, deployment ID, Git ref and Git commit SHA;
6. verify `GET /api/oraculum/release` and its RC1 Release Attestation;
7. run `pnpm verify:rc1:deployment -- --url <preview-url>`;
8. inspect defensive HTTP headers/cache behavior and runtime errors;
9. import the deployment evidence into `/oraculum/qa/evidence`.

Do not use `vercel --prod`, `vercel deploy --prod` or `vercel promote` during RC1 bootstrap.

## What a preview PASS proves

A deployment verification PASS proves the tested preview/runtime reproduced the frozen RC1 behavior and hardening checks at that time.

It does not replace:

- GitHub CI;
- Physical STATE QA;
- Physical RITUAL_32 QA;
- Camera/device QA;
- cross-device Manifest verification;
- human stable promotion approval.

## Current connector boundary

The connected Vercel integration can list teams/projects/deployments and inspect logs. Its available deployment write is scoped only as `deploy current project` and does not accept an explicit GitHub repository/ref/path argument. Because this chat does not currently have an authenticated `cubo-hnk` checkout linked as the Vercel current project, that write action is not used: avoiding an ambiguous deployment target is part of the RC1 safety boundary.

Current classification:

`PREVIEW_PROJECT_BOOTSTRAP_PENDING`

not a build failure.

## Governance

Preview configuration is an implementation artifact only.

No production alias, stable tag, merge authorization or HNK_CANON promotion is granted by this bootstrap.
