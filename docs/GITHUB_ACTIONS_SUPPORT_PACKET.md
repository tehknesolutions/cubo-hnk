# GitHub Actions Support Packet — HNK Oraculum Cube

Repository: `tehknesolutions/cubo-hnk`

Issue: #6

## Symptom

GitHub Actions discovers the workflow and creates jobs, but jobs terminate as `failure` before any step executes.

Observed API signature:

- job object exists;
- `status = completed`;
- `conclusion = failure`;
- `steps = null`;
- `logs_url = null`;
- no checkout, setup, shell command, test or build is reached.

## Zero-dependency isolation test

PR #19 introduced a diagnostic workflow with no product dependencies:

`.github/workflows/actions-runner-diagnostic.yml`

The diagnostic contains two jobs:

1. `ubuntu-probe` → `ubuntu-latest`;
2. `windows-probe` → `windows-latest`.

Each job contains one local shell step that only prints a marker and runner OS/arch.

The workflow does not use:

- `actions/checkout`;
- any third-party action;
- pnpm;
- Node setup;
- repository files inside the job;
- secrets.

## Diagnostic run

Run: `35036398248`

Created: `2026-09-15T23:36:10Z`

Updated: `2026-09-15T23:36:14Z`

Head SHA:

`6783013a6e3b0b9db133d39959f820913e40010f`

### Ubuntu

Job ID: `104606368822`

- name: `ubuntu-probe`
- runner label: `ubuntu-latest`
- conclusion: `failure`
- `steps = null`
- `logs_url = null`

### Windows

Job ID: `104606368640`

- name: `windows-probe`
- runner label: `windows-latest`
- conclusion: `failure`
- `steps = null`
- `logs_url = null`

Neither job reached its one `echo`/`Write-Output` step.

## Parallel normal CI run

The ordinary workflow ran on the same PR/head:

Run: `35036398152`

Job: `104606368616` (`validate`)

It produced the same result:

- conclusion `failure`;
- `steps = null`;
- `logs_url = null`.

## Previous reproductions

The same pre-step signature has reproduced across many independent PR heads and RC1 layers, including runs #16, #17, #18 and #20 documented in Issue #6.

The regular workflow itself is minimal and valid-looking:

- `runs-on: ubuntu-latest`;
- checkout;
- pnpm setup;
- Node 22 setup;
- install/check/build.

The zero-dependency test demonstrates that those actions and project commands are not required to reproduce the failure.

## Technical conclusion

Current evidence supports classification as:

`PRE_STEP_RUNNER_DISPATCH_OR_PROVISIONING_FAILURE`

The evidence does **not** support an HOC application bug, package-manager failure, Node/Next.js failure, test failure, checkout failure, or an Ubuntu-only runner-label failure.

GitHub documentation states that normal jobs contain GitHub-added `Set up job` and `Complete job` steps. These are absent here because the jobs expose no steps at all.

## Account-side checks requested

Please verify server-side/account state for this repository and account, especially:

1. Actions policy / allowed GitHub-hosted runners;
2. account or repository billing/budget/spending entitlement for Actions;
3. job dispatch / GitHub-hosted runner provisioning state;
4. any account-level restriction that can reject hosted jobs before runner allocation.

We cannot inspect those settings through the current repository API connection.

## Desired resolution

A successful diagnostic run should allocate a runner and execute the one local probe step on at least one supported GitHub-hosted label. After that, normal HOC CI can be re-run and evaluated on its actual test/build results.

## Governance

Until a runner executes real steps:

- CI remains `BLOCKED`, not PASS;
- these failures are not classified as application test failures;
- no merge/stable/HNK_CANON promotion is implied.
