# RC1 Build Provenance — Review Boundary

This file exists to make the incremental PR scope explicit.

Build Provenance V1 adds runtime traceability only. It does not modify the frozen RC1 oracle protocols or release fingerprint.

Incremental scope:

- runtime build metadata helper;
- `/api/oraculum/release` provenance payload/headers;
- optional deployment verifier `--commit` pin;
- deployment evidence/ledger provenance validation;
- audit/release documentation and source contracts.

Out of scope:

- RAW V0.4 changes;
- V0.8/V0.9/V0.10 changes;
- Release Attestation fingerprint changes;
- HNK40 semantic promotion;
- production deployment;
- merge/stable/HNK_CANON authorization.
