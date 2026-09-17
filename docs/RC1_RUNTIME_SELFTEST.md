# HOC V1.0 RC1 — Runtime Self-Test

Status: **QA INSTRUMENTATION / SUPPLEMENTARY EVIDENCE**  
Self-test protocol: `HOC-RC1-RUNTIME-SELFTEST/V1`  
Release under test: `HOC-V1.0-RC1`

## Purpose

The runtime self-test executes the frozen V1.0 RC1 vectors inside the same Node runtime used by the web application's server routes.

It exists to answer a narrow question:

> Does the currently loaded runtime reproduce the frozen RC1 contracts?

It does **not** replace:

- clean dependency installation;
- repository CI;
- TypeScript typecheck;
- Next.js production build;
- browser/device QA;
- camera QA;
- physical-cube STATE QA;
- physical RITUAL_32 QA;
- human release approval.

## Engine entrypoint

```text
@hnk/oraculum-engine/selftest
```

Function:

```text
runRc1RuntimeSelfTest()
```

The report is deterministic and contains:

- release ID;
- self-test protocol version;
- PASS/FAIL summary;
- frozen protocol IDs;
- one record per invariant with `actual` and `expected` values.

## Web API

```text
GET /api/oraculum/rc1-selftest
```

Behavior:

- HTTP 200 when every invariant passes;
- HTTP 503 when any invariant diverges;
- `Cache-Control: no-store`;
- `X-HOC-RC1-Self-Test: PASS|FAIL`;
- `X-HOC-RC1-Self-Test-Version: HOC-RC1-RUNTIME-SELFTEST/V1`.

## QA dashboard

```text
/oraculum/qa
```

The dashboard:

1. executes the self-test automatically;
2. can execute it again on demand;
3. displays PASS/FAIL totals;
4. shows frozen protocol IDs;
5. shows every invariant independently;
6. exposes expected vs actual values for failures.

## Frozen areas covered

### Protocol identity

- `HNK-ORACULUM-CUBE/V0.4`
- `HOC-CUBE-LEGALITY/V0.8`
- `HOC-RITUAL-INTEGRITY/V0.9`
- `HOC-SESSION-MANIFEST/V0.10`
- `HOC-CANONICAL-JSON/V1`

### STATE golden vector

The suite re-runs the official solved-cube STATE vector and verifies:

- exact RAW commit;
- exact SHA-256 seed;
- Path-32;
- HNK G-ID;
- Tarot index;
- zodiac;
- planet;
- raw element;
- Tria Prima;
- alchemical phase;
- numerology;
- three HEX colors;
- primary/resulting I Ching;
- moving lines;
- dominant independent convergence.

### Physical legality

The solved reference state must remain mechanically legal under V0.8.

### RITUAL_32

The official 32-move sequence is simulated from the solved state and must reproduce the frozen final state exactly. V0.9 must report integrity confirmed with move count 32.

### Manifest

The suite verifies:

- a real STATE manifest validates;
- tampering is rejected;
- the frozen synthetic checksum remains exact;
- the frozen session ID remains exact.

### HNK40 structural identity

The suite freezes:

- HNK40 glyph-set SHA-256;
- `PREPRODUCTION_NOT_OFFICIAL` status.

The self-test therefore cannot silently promote HNK40 visual/semantic candidates to canon.

## Interpretation of PASS

A full PASS means:

> The loaded server runtime reproduces the protocol/vector contracts covered by the RC1 self-test.

It does **not** mean:

> V1.0 is production-approved.

Production promotion remains governed by `release/v1.0-rc1/RELEASE_CHECKLIST.md`.
