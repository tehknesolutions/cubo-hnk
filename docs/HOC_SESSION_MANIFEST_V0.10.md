# HOC Session Manifest V0.10

Protocol identifier:

`HOC-SESSION-MANIFEST/V0.10`

## Purpose

V0.10 wraps one completed HNK Oraculum Cube consultation in a deterministic, tamper-evident audit record.

It is downstream of every earlier gate:

`CUBE REAL → SCAN V1 → LEGALITY V0.8 → RITUAL INTEGRITY V0.9 (when applicable) → RAW V0.4 → INTERPRETATION V0.5 → SESSION MANIFEST V0.10`

The manifest never changes the RAW seed. It records and verifies what already happened.

## Two different hashes

### Oracle seed

`raw.raw.seed256`

This is SHA-256 of the V0.4 oracle commit. It determines the HOC-256 RAW output.

### Manifest checksum

`manifest.audit.checksum`

This is SHA-256 of the canonical V0.10 manifest core.

Changing an interpretation signal, physical audit, color output, sigil point or any other manifested field changes the manifest checksum but does not retroactively alter the original oracle seed.

## Canonicalization

Canonicalization identifier:

`HOC-CANONICAL-JSON/V1`

Rules:

1. object keys are sorted lexicographically at every depth;
2. array order is preserved;
3. properties whose value is `undefined` are omitted;
4. normal JSON primitive encoding is used;
5. no timestamp, device ID or UI-only metadata participates in the canonical core.

Checksum formula:

`SHA256("HOC-SESSION-MANIFEST/V0.10|" + CANONICAL_JSON(CORE))`

Session ID:

`HOC-` + first 24 hexadecimal checksum characters in uppercase.

The full 256-bit checksum remains authoritative. The shorter session ID is a convenient human reference.

## Required gates

A manifest MUST NOT be created unless:

- RAW protocol is exactly `HNK-ORACULUM-CUBE/V0.4`;
- V0.8 legality report has `valid=true`;
- interpretation references the exact same RAW seed;
- when mode is `RITUAL_32`, V0.9 integrity report has `valid=true`.

Failure is fail-closed.

## Core structure

```text
manifestVersion
scanProfile
oracle
  protocol
  engineVersion
  mode
  profileId
  intent
  finalCubeState
  moves
  commit
  seed256
physical
  legality
  ritualIntegrity
outputs
  iching
  path32
  hnk
  tarot
  astrology
  alchemy
  numerology
  colors
  synthesisVector
  derivationReservoir
  sigil
  provenance
interpretation
  version
  profileId
  path
  tarot
  signals
  convergences
  tensions
  dominantConvergence
  hnkOracleSemantics
  malkuth
audit
  canonicalization
  checksumAlgorithm
  checksum
  sessionId
```

`audit` is appended after hashing and is excluded from the core whose checksum it authenticates.

## Physical audit

The manifest includes a summarized V0.8 legality report with mechanical invariants.

For STATE sessions:

`ritualIntegrity = null`

For RITUAL_32 sessions it includes:

- V0.9 version;
- initial state;
- reported final state;
- simulator expected final state;
- move count;
- mismatches;
- integrity result.

The initial state remains an audit field only. It does not enter the RAW V0.4 oracle commit.

## Symbolic output audit

The manifest records RAW outputs rather than recomputing meanings from prose:

- I Ching state;
- Path-32;
- HNK G-ID;
- Tarot index;
- astrological selectors;
- alchemical selectors;
- numerology;
- Essence/Shadow/Manifestation colors;
- reserved synthesis/derivation fields;
- complete 16-point sigil;
- RAW provenance.

Interpretation V0.5 records its profile-scoped signals separately.

## Verification

Engine function:

`verifySessionManifest(manifest)`

Verification removes `audit`, canonicalizes the remaining core, recalculates SHA-256 and compares both:

- `audit.checksum`;
- `audit.sessionId`.

The web verifier is available at:

`/oraculum/verify`

API:

`POST /api/oraculum/manifest/verify`

The verifier never trusts a `valid` flag supplied by the document itself.

## API emission

A successful `POST /api/oraculum` returns:

- legality;
- ritualIntegrity when relevant;
- raw;
- interpretation;
- manifest.

It also returns response headers:

- `X-HOC-Session-Id`;
- `X-HOC-Manifest-SHA256`.

Invalid physical states or rituals return no manifest.

## Frozen synthetic checksum vector

The V0.10 canonicalization/checksum primitive is independently locked by a synthetic fixture.

Expected checksum:

`e8510e6f8eb299ef57ecc2481d7ac5e3e4b0dd754284c2c5728d48febbb60041`

Expected session ID:

`HOC-E8510E6F8EB299EF57ECC248`

This vector was independently recalculated with Node `crypto` outside the package test path.

## Governance

The manifest proves integrity and reproducibility of the recorded HOC computation under these protocol versions. It does not prove supernatural causation, divinatory certainty, theological truth or canonical status of HNK-authored symbolic correspondences.

No V0.10 manifest field may be used to silently redefine HNK language identity, phonology, glyph form or external historical sources.
