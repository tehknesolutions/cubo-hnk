# GitHub Actions Support Packet — HNK Oraculum Cube

Repository: `tehknesolutions/cubo-hnk`

Tracking issue: #6 — `infra: GitHub Actions jobs terminate with steps=null before execution`

Status as of 2026-09-17: unresolved.

## Symptom

GitHub Actions discovers the workflow and creates jobs, but jobs terminate as `failure` before any repository step executes.

Observed API signature across repeated runs:

- job object exists;
- `status = completed`;
- `conclusion = failure`;
- `steps = null` / `steps = []`;
- `logs_url = null`;
- in the strongest raw reproduction, `runner_id = 0` and runner name/group are empty;
- no checkout, setup, shell command, dependency install, test, typecheck or build is reached.

Current classification:

`GITHUB_ACTIONS_PRE_STEP_RUNNER_DISPATCH_OR_PROVISIONING_FAILURE`

This is a failure-location classification, not a claim about the ultimate platform/account root cause.

## Zero-dependency isolation test

PR #19 introduced a diagnostic workflow with no product dependencies:

`.github/workflows/actions-runner-diagnostic.yml`

The diagnostic used both:

1. `ubuntu-latest`;
2. `windows-latest`.

Each job contained one local shell step that only prints a marker and runner OS/arch.

The workflow did not require:

- `actions/checkout`;
- any third-party action;
- pnpm;
- Node setup;
- repository files inside the job;
- secrets.

Both hosted-runner labels reproduced termination before the local probe step.

Historical diagnostic run:

- run id: `35036398248`;
- Ubuntu job: `104606368822`;
- Windows job: `104606368640`;
- both concluded `failure`;
- both exposed `steps = null`;
- both had `logs_url = null`.

This demonstrated that product dependencies and one specific runner image are not required to reproduce the failure.

## Strongest exact raw reproduction

Workflow Run #147:

- run id: `35240956725`;
- event: `pull_request`;
- conclusion: `failure`.

Job `validate`:

- job id: `105268960866`;
- requested label: `ubuntu-latest`;
- `steps = []`;
- `logs_url = null`;
- `runner_id = 0`;
- `runner_name = ""`;
- `runner_group_id = 0`;
- `runner_group_name = ""`.

Therefore Run #147 executed **zero repository commands** and no hosted runner was recorded as allocated to the job.

## Repeated recent reproductions on audit-only heads

The same pre-step signature continued to reproduce after the RC1 lockfile and preview-source work landed.

Recent examples:

| Run | Run ID | Job ID | Change type | Result |
| --- | --- | --- | --- | --- |
| #152 | `35246445024` | `105287747942` | PR #47, one JSON evidence file | `steps=null`, no logs |
| #154 | `35251329783` | `105304119196` | PR #47 evidence correction | `steps=null`, no logs |
| #155 | `35261847887` | `105339252378` | PR #48 audit/docs reconciliation | `steps=null`, no logs |
| #157 | `35264636479` | `105348610020` | PR #48 audit/docs/test-only head | `steps=null`, no logs |
| #158 | `35265065251` | `105350061227` | PR #49 manifest/test-only head | `steps=null`, no logs |

These heads do not introduce a common application/runtime change capable of explaining a failure before `Set up job` or any repository command.

The repeated behavior on evidence/docs/test-only PRs is useful because it separates the infrastructure symptom from normal application execution.

## Current RC1 command policy

The repository tracks the exact validated `pnpm-lock.yaml`.

Normal CI requires:

`pnpm install --frozen-lockfile`

The same frozen-install policy is used by the Preview bootstrap.

The affected GitHub Actions runs terminate before that command, so those failures are not evidence against the lockfile, pnpm install, tests, TypeScript, or Next.js build.

## Independent execution evidence

Separate Windows execution demonstrated on source/config head:

`74997fc18b4b4054b4f9a48068547acac8c50764`

using pnpm `10.17.1` and the exact lockfile later tracked byte-identically:

- `pnpm install --frozen-lockfile`: PASS;
- Oraculum Engine: `108/108` PASS;
- Web tests: `64/64` PASS;
- recursive TypeScript typecheck: PASS;
- Next.js `16.3.3` production build: PASS;
- static generation: `12/12` pages;
- tracked source/config tree: clean after build.

Tracked lockfile identity:

- SHA-256: `C84D832FE6BB264A041A93077FA0BD6402622508D1B083E695058C93300E72F3`;
- Git blob: `1d5c7cdca5b22ea02ba9b3952fd9ac580fafd428`.

This evidence is supplemental. It does **not** replace GitHub-hosted CI and it does not claim a fresh execution of the current landed RC1 head.

## What the evidence does and does not show

The evidence supports:

- the failure occurs before repository execution;
- it reproduces on Ubuntu and Windows diagnostic probes;
- it reproduces on application, evidence-only, docs-only and test-contract PR heads;
- product commands are not required to trigger the symptom;
- current independent install/test/typecheck/build evidence is separately healthy.

The evidence does **not** establish which server-side condition causes runner allocation to fail.

In particular, this packet does not assert that an account restriction, billing state, Actions policy or any specific GitHub backend condition is the cause.

## Account/platform checks requested from GitHub

Please verify server-side state for this repository/account, especially:

1. GitHub Actions policy and availability of GitHub-hosted runners;
2. account/repository billing, budgets or Actions spending entitlement, where applicable;
3. hosted-runner dispatch and provisioning state;
4. any repository, organization or account-level restriction capable of rejecting jobs before runner allocation;
5. whether there is a backend error or entitlement state associated with these run/job IDs.

If possible, please inspect the raw backend reason for Run #147 / Job `105268960866`, where the public API exposed `runner_id=0`, and compare it with Runs #152, #154, #155, #157 and #158.

## Desired resolution

A successful diagnostic run should:

1. allocate a hosted runner;
2. expose normal job steps;
3. reach the local probe marker `HOC_ACTIONS_RUNNER_PROBE=REACHED`.

After that, the normal `Cubo HNK CI` workflow can be executed and evaluated on its actual checkout/install/test/typecheck/build results.

## Governance

Until a hosted runner executes real steps:

- GitHub CI remains `BLOCKED`, not PASS;
- empty combined commit statuses are not interpreted as CI success;
- these pre-step failures are not classified as application test failures;
- independent execution evidence remains separate from GitHub CI;
- no Stable, production or HNK_CANON promotion is implied.

Preview/runtime deployment remains tracked separately under Issue #45.
