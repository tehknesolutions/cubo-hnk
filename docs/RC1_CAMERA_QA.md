# HOC V1.0 RC1 — Camera / Device QA

Status: **QA INSTRUMENTATION / DEVICE EVIDENCE**

Route:

```text
/oraculum/qa/camera
```

## Purpose

The camera QA page records whether a real browser/device can execute the camera-assisted path required by the HOC RC1 without granting camera classification protocol authority.

It combines two evidence classes:

1. programmatic browser/camera capability;
2. human-confirmed end-to-end behavior.

A PASS requires both.

## Programmatic capability checks

The page records:

- secure context availability;
- `navigator.mediaDevices.getUserMedia` availability;
- camera permission result;
- live video dimensions;
- six captured faces U/R/F/D/L/B;
- nine RGB samples per face;
- center-derived prototype HEX values;
- candidate color counts;
- average classifier confidence;
- low-confidence cells.

The page does not interpret a non-9/9 automatic classification as protocol failure. Camera output remains candidate data subject to manual correction.

## Human checklist

The operator must explicitly confirm all of the following only after observing them on the tested device:

1. U/R/F/D/L/B were captured in canonical HOC-FACELET-SCAN-V1 orientation.
2. Candidate cell classification can be manually corrected in `/oraculum/camera` before hashing.
3. The camera consultation does not generate a hash without human review of all 54 cells.
4. A reviewed STATE camera flow passes V0.8.
5. RITUAL_32 camera flow requires separate human review of initial and final states.
6. A camera-generated session manifest can be downloaded and revalidated in `/oraculum/verify`.

The UI does not auto-check these statements.

## Privacy constraints

Camera QA evidence intentionally excludes:

- captured image bytes;
- canvas image serialization;
- camera `deviceId`;
- geolocation;
- persisted video.

The exported evidence may include:

- secure-context status;
- media API capability;
- permission result;
- video width/height;
- viewport dimensions;
- browser user-agent string;
- sampled prototype HEX values;
- candidate color counts;
- low-confidence cell labels;
- average confidence;
- human checklist booleans.

## Evidence export

The page exports:

```text
HOC-RC1-CAMERA-QA-PASS.json
```

or

```text
HOC-RC1-CAMERA-QA-INCOMPLETE.json
```

The file is human/device QA evidence only. It is not a cryptographic signature and does not replace repository CI, typecheck or production build validation.

## PASS conditions

### Programmatic PASS

Requires:

- secure context;
- camera API available;
- camera permission granted;
- non-zero video dimensions;
- all six faces captured with nine samples each.

### Human PASS

Requires all manual checklist items to be checked by the operator after real observation.

### Full Camera QA PASS

```text
programmatic capability PASS
AND
human checklist PASS
```

## Release interpretation

A Camera QA PASS can satisfy the device/camera evidence gate for the tested browser/device only.

It does not imply:

- all browsers are supported;
- Android and iOS are both verified;
- CI is green;
- V1.0 is production-approved;
- camera classification becomes canonical or authoritative.
