# HOC V1.0 RC1 — Production Hardening Review

Status: `IMPLEMENTED / NOT YET BUILD-VERIFIED`

This document records the production-facing hardening changes applied after the RC1 manual/audit reconciliation.

## 1. Scope

The hardening layer does not modify:

- `HNK-ORACULUM-CUBE/V0.4`;
- Interpretation V0.5;
- `HOC-CUBE-LEGALITY/V0.8`;
- `HOC-RITUAL-INTEGRITY/V0.9`;
- `HOC-SESSION-MANIFEST/V0.10`;
- frozen RC1 vectors;
- HNK40 status.

It changes only HTTP/request handling, cache behavior and defensive headers in the web app.

## 2. Bounded JSON parsing

Shared helper:

`apps/web/lib/oraculum-http.ts`

`readBoundedJson()` checks both:

1. declared `Content-Length`, when present;
2. actual UTF-8 byte count after reading the body.

Oversized payloads return HTTP `413`.

Malformed/empty JSON returns HTTP `400`.

### Endpoint limits

- `POST /api/oraculum`: 32 KiB
- `POST /api/oraculum/qa/physical`: 16 KiB
- `POST /api/oraculum/manifest/verify`: 512 KiB

The manifest verifier receives the highest limit because a complete V0.10 manifest contains raw outputs, interpretation, provenance and sigil data.

## 3. Oraculum request-shape guard

Before physical gates or `runOracle`, the main route now verifies:

- non-empty string intention;
- intention ≤ 4096 characters;
- `cubeState` is a string;
- mode is exactly `STATE` or `RITUAL_32`;
- `profileId`, when present, is a string;
- `initialCubeState`, when present, is a string;
- `includeResultingIChing`, when present, is boolean;
- moves are string or string-array;
- string move input ≤ 2048 characters;
- move arrays ≤ 64 tokens.

Protocol-level validation remains the responsibility of the engine/V0.8/V0.9. These HTTP checks are an abuse/malformed-input boundary, not a new oracle protocol.

## 4. Cache policy

HOC API responses are explicitly `no-store`.

Response helper adds:

- `Cache-Control: no-store, max-age=0`
- `Pragma: no-cache`
- `X-Content-Type-Options: nosniff`

`next.config.ts` also applies `no-store` to `/api/oraculum/:path*` as a defense-in-depth route policy.

This reduces accidental persistence of intentions, cube transcripts, manifest data and QA reports in intermediary caches.

## 5. Browser security headers

Global web headers include:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- `X-DNS-Prefetch-Control: off`
- `Cross-Origin-Opener-Policy: same-origin`
- `Permissions-Policy: camera=(self), microphone=(), geolocation=()`

Camera remains available to the same-origin HOC camera workflow while microphone and geolocation are disabled by policy.

A strict CSP is intentionally not introduced in this RC1 hardening pass because Next.js runtime/script requirements need a build-tested policy rather than an unverified header that could break the UI.

## 6. Logging review

The HOC API routes covered by this review do not contain `console.log/info/debug/warn/error` calls for request bodies, cube states or manifests.

The camera workflow remains client-side and does not upload captured image bytes as QA evidence.

The contract test fails if console logging is added to the protected HOC route sources.

This is a source-level logging review. Platform-level request/access logging still requires deployment-environment review before public production.

## 7. Privacy boundary

The hardening layer preserves existing rules:

- camera image bytes are not protocol inputs;
- Camera QA evidence excludes image bytes, `deviceId` and geolocation;
- manifest verification evidence excludes the manifest body, `deviceId` and geolocation;
- HOC API responses should not be cached.

## 8. Contract test

`apps/web/test/production-hardening-contract.test.mjs`

The contract locks:

- bounded parsing on the three POST routes;
- byte-size checking;
- endpoint-specific limits;
- no direct `request.json()` on those routes;
- no console logging in protected HOC API sources;
- no-store cache policy;
- defensive headers;
- camera permission retained only for same origin;
- request-shape validation happens before engine execution.

## 9. Remaining production checks

This source review does **not** close the CI/build gate. Still required:

- real dependency installation;
- TypeScript typecheck;
- Next.js production build;
- deployment smoke test;
- verify actual response headers in deployed environment;
- inspect host/platform access logs and retention policy;
- rate-limit / abuse strategy if the endpoint becomes public at scale;
- CSP evaluation after a buildable deployment exists.

## 10. Audit conclusion

Production hardening implementation: `PASS` at source-contract level.

Runtime/build verification: `PENDING/BLOCKED` while Issue #6 prevents GitHub Actions steps from executing.

This hardening does not authorize stable V1.0 promotion by itself.
