# RC1 Build Provenance — Checklist

- [x] Duplicate helper path removed.
- [x] Shared helper lives under `apps/web/lib`.
- [x] Release endpoint returns provenance separately from attestation.
- [x] Provenance is explicitly unhashed.
- [x] Deployment verifier supports optional `--commit` pinning.
- [x] Evidence Ledger requires valid Build Provenance V1.
- [x] Audit and release manifest preserve the boundary.
- [ ] Real deployment provenance observed.
- [ ] Optional expected-commit pin verified against a real preview.

The final two items remain execution gates, not implementation gates.
