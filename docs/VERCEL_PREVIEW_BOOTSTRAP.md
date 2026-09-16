# HOC V1.0 RC1 — Vercel Preview Bootstrap

Status: source configuration ready; no Vercel project/deployment has been created by this document.

## Goal

Provide a reproducible **preview-only** path for `tehknesolutions/cubo-hnk` without promoting production.

The connected Vercel account currently has no project named `cubo-hnk`, so a project must be created/linked from a real checkout or through the Vercel dashboard/Git integration before runtime verification can execute.

## Monorepo layout

Workspace root:

- `pnpm-workspace.yaml`
- `apps/*`
- `packages/*`

Web app:

- `apps/web`

Local engine dependency:

- `packages/oraculum-engine`

`apps/web/package.json` consumes:

`@hnk/oraculum-engine = workspace:*`

Therefore the preview build must install from the workspace root even though the Vercel project Root Directory is `apps/web`.

## Vercel project settings

Create/link a Vercel project for repository:

`tehknesolutions/cubo-hnk`

Use:

- Environment: Preview
- Framework: Next.js
- Root Directory: `apps/web`

`apps/web/vercel.json` freezes:

- install: `cd ../.. && pnpm install --no-frozen-lockfile`
- build: `cd ../.. && pnpm --filter @hnk/cubo-web build`

This preserves the workspace engine dependency.

## Local/executor preflight

From repository root:

`pnpm preview:preflight`

The preflight verifies:

- RC1 version identity;
- workspace paths;
- `workspace:*` engine dependency;
- Vercel framework/config;
- root-workspace install/build commands;
- absence of `--prod` in bootstrap commands.

## Preview creation

After a real checkout and Vercel login/link:

1. run `pnpm preview:preflight`;
2. run the independent validator when possible: `pnpm validate:rc1:independent`;
3. create/link the Vercel project with Root Directory `apps/web`;
4. create a preview deployment only;
5. preserve the preview URL;
6. run `pnpm verify:rc1:deployment -- --url <preview-url>`;
7. import the deployment evidence into `/oraculum/qa/evidence`.

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

## Current connector limitation

The Vercel connector can list existing projects, but the current connected account has no `cubo-hnk` project. The direct deploy action also requires an explicit file payload/current checkout context; it cannot ingest the GitHub branch automatically from this chat session.

This is classified as:

`PREVIEW_PROJECT_BOOTSTRAP_PENDING`

not as a build failure.

## Governance

Preview configuration is an implementation artifact only.

No production alias, stable tag, merge authorization or HNK_CANON promotion is granted by this bootstrap.
