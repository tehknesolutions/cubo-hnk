# HOC V1.0 RC1 — Release Audit Report

Release: `HOC-V1.0-RC1`  
Package version: `1.0.0-rc.1`  
Audit status: `NOT_READY_FOR_STABLE`  
Governance: `RELEASE_CANDIDATE`, not `STABLE`, not `HNK_CANON`.

## 1. Audit objective

This report distinguishes four states that must not be conflated:

- **IMPLEMENTED** — code/document exists;
- **INSTRUMENTED** — a QA mechanism exists;
- **EXECUTED** — the mechanism was actually run in the required environment;
- **APPROVED** — a human promotion decision was made.

A release gate is considered satisfied only by the level required for that gate.

## 2. Frozen protocol baseline

| Layer | Contract | RC1 status |
| --- | --- | --- |
| Facelet scan | `HOC-FACELET-SCAN-V1` | FROZEN |
| RAW | `HNK-ORACULUM-CUBE/V0.4` | FROZEN |
| Interpretation | `0.5.0-candidate` | FROZEN FOR RC1 |
| Cube legality | `HOC-CUBE-LEGALITY/V0.8` | FROZEN |
| Ritual integrity | `HOC-RITUAL-INTEGRITY/V0.9` | FROZEN |
| Session Manifest | `HOC-SESSION-MANIFEST/V0.10` | FROZEN |
| Canonical JSON | `HOC-CANONICAL-JSON/V1` | FROZEN |
| Runtime QA | `HOC-RC1-RUNTIME-SELFTEST/V1` | QA CONTRACT |
| Evidence ledger | `HOC-RC1-EVIDENCE-LEDGER/V1` | QA CONTRACT |

No RC1 documentation or HTTP-hardening change authorizes mutation of these protocol identities.

## 3. Frozen vectors

### RAW STATE seed

`df6bcd1bfd58288fb8f7d7e0f22b69d7e305a24429ba4445c242efc000e3b6fc`

### RITUAL_32 expected final state

`513004512451013254000425014533433235324540121221251340`

### Synthetic Manifest V0.10 checksum

`e8510e6f8eb299ef57ecc2481d7ac5e3e4b0dd754284c2c5728d48febbb60041`

### Synthetic Session ID

`HOC-E8510E6F8EB299EF57ECC248`

### HNK40 structural hash

`78668df0f707952b7c280de52526abaa2b7900597fb8ff362a3a08641fd1bce5`

HNK40 remains `PREPRODUCTION_NOT_OFFICIAL`.

## 4. Release gate matrix

| Gate | Implementation | Instrumentation | Execution evidence | Promotion state |
| --- | --- | --- | --- | --- |
| Protocol freeze | IMPLEMENTED | N/A | documented/frozen vectors | PASS |
| Runtime self-test | IMPLEMENTED | INSTRUMENTED | runtime execution still required on deploy/real executor | PENDING |
| Physical STATE | IMPLEMENTED | INSTRUMENTED | physical-cube evidence not yet recorded | PENDING |
| Physical RITUAL_32 | IMPLEMENTED | INSTRUMENTED | physical-cube evidence not yet recorded | PENDING |
| Camera/device | IMPLEMENTED | INSTRUMENTED | real-device evidence not yet recorded | PENDING |
| Cross-device manifest | IMPLEMENTED | INSTRUMENTED | two-device matching evidence not yet recorded | PENDING |
| Production hardening source contract | IMPLEMENTED | CONTRACT TEST ADDED | independent frozen Next.js 16.3.3 build PASS; served deployment verification still required | PASS (SOURCE) |
| Independent install/test/typecheck/build | N/A | evidence contract present | clean Windows frozen validation PASS on source/config head `74997fc...`; exact validated lockfile later tracked byte-identically | PASS (RECONCILED) |
| Fresh current-head independent rerun | N/A | runbook/evidence requirement present | authorized Windows executor offline | PENDING |
| GitHub CI / typecheck / build | workflow IMPLEMENTED | runner configured | jobs terminate with `steps=null`; no command executed | BLOCKED |
| Markdown manual reconciliation | IMPLEMENTED | N/A | V0.8–V0.10 + RC1 QA/hardening reconciled | PASS |
| DOCX/PDF manual reconciliation | REGENERATED | VISUAL QA | 36-page DOCX and PDF reviewed; exact hashes recorded | PASS |
| Human V1.0 promotion | N/A | N/A | no explicit promotion decision | PENDING |

Overall: `NOT_READY_FOR_STABLE`.

The independent executor row and the GitHub CI row are deliberately separate. A real independent PASS does not convert a pre-step GitHub-hosted infrastructure failure into CI PASS.

## 5. Runtime QA

Route: `/oraculum/qa`  
API: `GET /api/oraculum/rc1-selftest`

The runtime self-test checks protocol identities, STATE golden vector, interpretation invariants, V0.8, V0.9, V0.10 and HNK40 structural identity.

Current audit conclusion:

- QA mechanism: **INSTRUMENTED**;
- source contract: present;
- release promotion evidence: still requires real runtime execution in an environment accepted for release evidence.

A source-level implementation is not equivalent to an executed PASS.

## 6. Physical QA

Wizard: `/oraculum/qa/physical`

Cases:

- `STATE_SOLVED`;
- `RITUAL32_OFFICIAL`.

The wizard requires explicit confirmation that the transcript came from a physical cube.

Current audit conclusion:

- QA mechanism: **INSTRUMENTED**;
- official vectors: frozen;
- real physical evidence: **PENDING**.

The final RITUAL_32 state is intentionally hidden before evaluation.

## 7. Camera / Device QA

Route: `/oraculum/qa/camera`  
Evidence type: `HOC-RC1-CAMERA-QA-EVIDENCE/V1`

The panel records secure context, camera API capability, permission, video dimensions, six face samples, candidate color counts/confidence and a human end-to-end checklist.

Privacy guardrail:

- no persisted image bytes;
- no `deviceId` in evidence;
- no geolocation;
- no persisted video.

Current audit conclusion:

- QA mechanism: **INSTRUMENTED**;
- real-device PASS evidence: **PENDING**.

## 8. Cross-device manifest verification

Verifier: `/oraculum/verify`  
Verification evidence: `HOC-RC1-MANIFEST-VERIFY-EVIDENCE/V1`

Cross-device PASS requires at least two valid evidence records with:

- same `sessionId`;
- same checksum;
- distinct non-empty human device labels.

Device labels are operator-declared QA context, not cryptographic hardware identities.

Current audit conclusion:

- mechanism: **INSTRUMENTED**;
- two-device evidence: **PENDING**.

## 9. Release Evidence Ledger

Route: `/oraculum/qa/evidence`  
Protocol: `HOC-RC1-EVIDENCE-LEDGER/V1`

Recognized evidence classes:

- Runtime QA;
- Physical QA;
- Camera QA;
- Manifest Verify evidence.

The ledger processes evidence locally in browser memory and cannot promote the CI gate.

Consolidated export:

`HOC-RC1-RELEASE-EVIDENCE-LEDGER/V1`

This export is an operational audit package, not a cryptographic signature of the release.

## 10. Production hardening source review

Documentation:

`docs/RC1_PRODUCTION_HARDENING.md`

Implemented controls:

- bounded JSON parsing shared helper;
- 32 KiB cap for `POST /api/oraculum`;
- 16 KiB cap for Physical QA POST;
- 512 KiB cap for Manifest Verify POST;
- request-shape guard before engine execution;
- `no-store`/`no-cache` for HOC APIs;
- defensive global headers (`nosniff`, frame deny, no-referrer, COOP, permissions policy);
- camera allowed only same-origin by permissions policy;
- microphone and geolocation disabled by permissions policy;
- protected HOC API source contract forbids `console.*` logging of payload/manifests;
- production hardening contract test added.

Audit conclusion:

`PRODUCTION_HARDENING_SOURCE = PASS`

A real Next.js `16.3.3` production build already completed successfully during the independent frozen validation (`12/12` static pages). That build was executed on source/config head `74997fc18b4b4054b4f9a48068547acac8c50764` with the exact lockfile bytes later tracked in GitHub. It is valid build evidence, but it is not a fresh execution of the current landed RC1 head and it is not deployment/runtime evidence.

Still pending:

- fresh current-landed-head frozen rerun while the authorized executor is offline;
- deployed response-header inspection;
- host access-log/retention review;
- public abuse/rate-limit strategy if needed;
- CSP evaluation after a verifiable deployment exists.

Therefore:

`PRODUCTION_HARDENING_RUNTIME = PENDING`

## 11. Independent validation and GitHub CI blocker

### Independent frozen validation — PASS, reconciled evidence

The Windows executor completed a clean frozen validation on source/config head `74997fc18b4b4054b4f9a48068547acac8c50764` using pnpm `10.17.1` and lockfile SHA-256:

`C84D832FE6BB264A041A93077FA0BD6402622508D1B083E695058C93300E72F3`

Results:

- `pnpm install --frozen-lockfile`: PASS;
- engine: `108/108` PASS;
- web: `64/64` PASS;
- TypeScript engine + web: PASS;
- Next.js `16.3.3` production build: PASS, `12/12` static pages;
- tracked source/config diff after build: CLEAN, with only the intentionally untracked lockfile present at that historical validation point.

The lockfile subsequently tracked in GitHub is byte-identical to the validated file (`git blob 1d5c7cdca5b22ea02ba9b3952fd9ac580fafd428`). These facts are preserved in:

- `RC1_FROZEN_INSTALL_RECONCILIATION_EVIDENCE.json`;
- `RC1_TRACKED_LOCKFILE_EVIDENCE.json`.

A fresh clean rerun on the current landed RC1 head remains pending because the authorized Windows executor is offline. This limitation must stay explicit.

### GitHub-hosted CI — BLOCKED

GitHub Issue #6 tracks a recurring infrastructure condition:

- workflow run is created;
- `validate` job reaches `failure`;
- `steps=null`;
- no checkout;
- no dependency installation;
- no tests;
- no typecheck;
- no Next.js build;
- logs unavailable or non-executed.

This has reproduced through multiple PR layers, including minimal evidence-only changes.

Audit conclusion:

`INDEPENDENT_FROZEN_VALIDATION = PASS_RECONCILED`

`GITHUB_CI / TYPECHECK / BUILD = BLOCKED`

Do not classify the hosted runs as application failures or as PASS. Do not classify the independent executor PASS as GitHub CI PASS.

## 12. Documentation reconciliation

Markdown source of truth:

`docs/MANUAL_V1_RC1.md`

It reconciles the base manual, V0.8/V0.9/V0.10, Runtime QA, Physical QA, Camera QA, Evidence Ledger and protocol matrix. Production hardening is separately documented and referenced by release governance.

Markdown audit conclusion:

`MARKDOWN_DOCUMENTATION = PASS`

Visual release artifacts were regenerated from the previously QA'd manual layout and reconciled with RC1 content:

- `HNK_ORACULUM_CUBE_Manual_V1.0_RC1.docx`
- `HNK_ORACULUM_CUBE_Manual_V1.0_RC1.pdf`
- 36 pages each.

QA method:

- pages 2–32 verified pixel-identical to the previously visually QA'd manual in both DOCX and PDF render pipelines;
- updated cover page 1 individually inspected;
- appended RC1 pages 33–36 individually inspected after final render;
- PDF re-rendered independently after conversion.

Exact artifact hashes and sizes are recorded in:

`release/v1.0-rc1/VISUAL_MANUAL_ARTIFACTS.json`

Visual audit conclusion:

`DOCX_PDF_FINAL = PASS`

The binary files are release artifacts and are not implied to be committed to the source repository by the metadata record.

## 13. Required evidence before stable V1.0

The release may not be promoted merely because all mechanisms exist. Required remaining evidence includes:

1. GitHub-hosted CI receives a real runner and executes the configured frozen install/test/typecheck/build chain, or release governance explicitly approves an alternative automated path;
2. fresh current-landed-head frozen confirmation is executed when the authorized executor becomes available, unless explicit governance accepts the existing byte-identical reconciliation as sufficient;
3. runtime self-test executed in accepted runtime;
4. Physical STATE evidence PASS;
5. Physical RITUAL_32 evidence PASS;
6. Camera QA PASS on at least one target device, or explicit experimental downgrade;
7. same Manifest V0.10 validated on at least two distinct labeled environments;
8. deployed hardening headers verified;
9. host logging/retention and public abuse strategy reviewed for the selected production environment;
10. explicit human approval for V1.0 promotion.

The historical frozen install/test/typecheck/build execution is already real PASS evidence and must not be relabeled as pending. Its limitation is scope/head freshness and its separation from GitHub-hosted CI.

## 14. Current release conclusion

The HOC V1.0 RC1 architecture is substantially consolidated and has dedicated instrumentation for the major release gates, source-level production hardening, reconciled visual/manual artifacts, and real independent frozen install/test/typecheck/build evidence whose lockfile is tracked byte-identically.

The correct current statement is:

`PROTOCOLS FROZEN + INDEPENDENT FROZEN VALIDATION PASS (RECONCILED) + TRACKED LOCKFILE BYTE-IDENTICAL + QA INSTRUMENTED + SOURCE HARDENING PASS + MARKDOWN/DOCX/PDF DOCUMENTATION PASS + GITHUB CI BLOCKED + FRESH LANDED-HEAD CONFIRMATION PENDING + PREVIEW/PHYSICAL/DEVICE EVIDENCE PENDING`

Therefore:

`HOC V1.0 RC1 = NOT READY FOR STABLE PROMOTION`

No merge, stable tag, production promotion or HNK_CANON promotion should be inferred from this audit report.
