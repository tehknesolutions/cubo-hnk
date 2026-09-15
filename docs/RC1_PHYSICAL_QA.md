# HOC V1.0 RC1 — Physical QA Wizard

Status: **QA INSTRUMENTATION / HUMAN EVIDENCE**

Route:

```text
/oraculum/qa/physical
```

API:

```text
POST /api/oraculum/qa/physical
```

## Purpose

The physical QA wizard validates the RC1 implementation against a real 3×3 cube without generating a new symbolic reading.

It answers two concrete questions:

1. Does a physically solved cube transcribed through `HOC-FACELET-SCAN-V1` reproduce the frozen STATE vector?
2. Does a real cube taken through the official 32-move ritual reproduce the frozen V0.9 final state?

## Case 1 — STATE_SOLVED

Procedure:

1. Start with a physically solved 3×3 cube.
2. Choose U and F and keep that frame fixed.
3. Map center faces U/R/F/D/L/B to digits 0/1/2/3/4/5.
4. Read each face left→right and top→bottom.
5. Concatenate faces in U R F D L B order.
6. Submit the observed 54-digit transcript.
7. Explicitly confirm that the transcript came from a real physical cube.

The server verifies:

- exact 54-facelet transcript;
- V0.8 legality;
- exact frozen RAW commit;
- exact frozen SHA-256 seed.

A legal but non-solved cube fails this test because the case specifically validates the solved physical reference vector.

## Case 2 — RITUAL32_OFFICIAL

Start from a physically solved cube using the same U/F reference.

Execute exactly:

```text
U R F D L B U' R' F2 D2 L2 B2 U2 R2 F' D' L' B' U F R B L D U' F' R' B' L' D' U2 F2
```

After move 32:

1. preserve the original U/F reference;
2. scan U R F D L B using `HOC-FACELET-SCAN-V1`;
3. enter the observed 54-digit transcript;
4. confirm physical transcription;
5. submit.

The UI intentionally does not reveal the frozen expected final state before submission.

The server verifies:

- V0.8 final-state legality;
- V0.9 integrity from solved initial state + official 32 moves;
- exact equality with the frozen expected final state;
- facelet-level mismatch positions when different.

## Human confirmation gate

The API rejects evidence unless:

```text
physicalTranscriptionConfirmed = true
```

This does not cryptographically prove that a physical cube was used. It records an explicit human declaration and prevents accidental classification of pasted/demo data as physical evidence.

## Evidence export

The UI can export:

```text
HOC-RC1-<CASE>-PASS.json
```

or

```text
HOC-RC1-<CASE>-FAIL.json
```

The evidence contains:

- case ID;
- release ID;
- physical confirmation flag;
- actual transcript;
- expected transcript after evaluation;
- mismatch positions;
- V0.8 report;
- V0.9 report when applicable;
- RAW commit/seed audit for STATE;
- export timestamp added client-side.

The file is **not a cryptographic signature** and does not replace CI/build approval.

## PASS interpretation

### STATE_SOLVED PASS

Means the operator's physical solved-cube transcript:

- is mechanically valid;
- matches the frozen reference state;
- reproduces the frozen RAW commit;
- reproduces the frozen RAW seed.

### RITUAL32_OFFICIAL PASS

Means the operator's physical final transcript:

- is mechanically valid;
- is exactly reachable from the solved initial state through the official 32 moves;
- equals the frozen V0.9 expected final state.

## Remaining release gates

A physical QA PASS remains only one part of V1.0 promotion. The release still requires:

- executable repository tests;
- TypeScript PASS;
- Next.js production build PASS;
- camera/device QA;
- cross-device manifest verification;
- final manual reconciliation;
- explicit human promotion approval.
