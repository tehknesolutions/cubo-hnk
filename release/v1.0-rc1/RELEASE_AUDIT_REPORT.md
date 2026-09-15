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

No RC1 documentation change authorizes mutation of these protocol identities.

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
| CI / typecheck / build | workflow IMPLEMENTED | runner configured | GitHub jobs terminate with `steps=null`; no command executed | BLOCKED |
| Markdown manual reconciliation | IMPLEMENTED | N/A | this audit branch reconciles V0.8–V0.10 + RC1 QA docs | PASS |
| DOCX/PDF manual reconciliation | historical artifacts exist | N/A | not regenerated against RC1 | PENDING |
| Human V1.0 promotion | N/A | N/A | no explicit promotion decision | PENDING |

Overall: `NOT_READY_FOR_STABLE`.

## 5. Runtime QA

Route:

`/oraculum/qa`

API:

`GET /api/oraculum/rc1-selftest`

The runtime self-test checks protocol identities, STATE golden vector, interpretation invariants, V0.8, V0.9, V0.10 and HNK40 structural identity.

Current audit conclusion:

- QA mechanism: **INSTRUMENTED**;
- source contract: present;
- release promotion evidence: still requires real runtime execution in an environment accepted for release evidence.

A source-level implementation is not equivalent to an executed PASS.

## 6. Physical QA

Wizard:

`/oraculum/qa/physical`

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

Route:

`/oraculum/qa/camera`

Evidence type:

`HOC-RC1-CAMERA-QA-EVIDENCE/V1`

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

Verifier:

`/oraculum/verify`

Verification evidence:

`HOC-RC1-MANIFEST-VERIFY-EVIDENCE/V1`

Cross-device PASS requires at least two valid evidence records with:

- same `sessionId`;
- same checksum;
- distinct non-empty human device labels.

Device labels are operator-declared QA context, not cryptographic hardware identities.

Current audit conclusion:

- mechanism: **INSTRUMENTED**;
- two-device evidence: **PENDING**.

## 9. Release Evidence Ledger

Route:

`/oraculum/qa/evidence`

Protocol:

`HOC-RC1-EVIDENCE-LEDGER/V1`

Recognized evidence classes:

- Runtime QA;
- Physical QA;
- Camera QA;
- Manifest Verify evidence.

The ledger processes evidence locally in browser memory and cannot promote the CI gate.

Consolidated export:

`HOC-RC1-RELEASE-EVIDENCE-LEDGER/V1`

This export is an operational audit package, not a cryptographic signature of the release.

## 10. CI / build blocker

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

This has reproduced through multiple PR layers, including RC1 QA work.

Audit conclusion:

`CI / TYPECHECK / BUILD = BLOCKED`

Do not classify these runs as application failures or as PASS. No application command has executed.

## 11. Documentation reconciliation

New consolidated source of truth:

`docs/MANUAL_V1_RC1.md`

It reconciles:

- base physical manual;
- V0.8 addendum;
- V0.9 addendum;
- V0.10 addendum;
- Runtime QA;
- Physical QA;
- Camera QA;
- Evidence Ledger;
- protocol matrix.

Audit conclusion:

`MARKDOWN_DOCUMENTATION = PASS`

However:

`DOCX_PDF_FINAL = PENDING`

The previously generated visual DOCX/PDF must be regenerated or reconciled against the RC1 content before stable V1.0.

## 12. Required evidence before stable V1.0

The release may not be promoted merely because all mechanisms exist. Required remaining evidence includes:

1. clean dependency installation;
2. repository tests executed;
3. TypeScript typecheck executed;
4. Next.js production build executed;
5. runtime self-test executed in accepted runtime;
6. Physical STATE evidence PASS;
7. Physical RITUAL_32 evidence PASS;
8. Camera QA PASS on at least one target device, or explicit experimental downgrade;
9. same Manifest V0.10 validated on at least two distinct labeled environments;
10. final DOCX/PDF manual reconciliation;
11. review of security/cache/logging production settings;
12. explicit human approval for V1.0 promotion.

## 13. Current release conclusion

The HOC V1.0 RC1 architecture is substantially consolidated and has dedicated instrumentation for the major release gates.

The correct current statement is:

`PROTOCOLS FROZEN + QA INSTRUMENTED + DOCUMENTATION RECONCILED (MARKDOWN) + EXECUTION EVIDENCE INCOMPLETE + CI BLOCKED`

Therefore:

`HOC V1.0 RC1 = NOT READY FOR STABLE PROMOTION`

No merge, stable tag, production promotion or HNK_CANON promotion should be inferred from this audit report.