# HNK Oraculum Cube

Repositório dedicado ao **HNK Oraculum Cube (HOC)**: protocolo determinístico, interface e esteira de auditoria para consultas com cubo físico 3×3.

## Release atual

**HOC V1.0 RC1 — `1.0.0-rc.1`**

Status: `RELEASE_CANDIDATE` — ainda não `STABLE` e sem promoção automática para `HNK_CANON`.

Princípio de auditoria:

`IMPLEMENTADO ≠ INSTRUMENTADO ≠ EXECUTADO ≠ APROVADO`

## Pipeline

`CUBO REAL → HOC-FACELET-SCAN-V1 → LEGALITY V0.8 → RITUAL V0.9 (quando aplicável) → RAW V0.4 → INTERPRETATION V0.5 → MALKUTH → SESSION MANIFEST V0.10`

Protocols congelados na RC1:

- Scan: `HOC-FACELET-SCAN-V1`
- RAW: `HNK-ORACULUM-CUBE/V0.4`
- Interpretation: `0.5.0-candidate`
- Legality: `HOC-CUBE-LEGALITY/V0.8`
- Ritual Integrity: `HOC-RITUAL-INTEGRITY/V0.9`
- Session Manifest: `HOC-SESSION-MANIFEST/V0.10`
- Canonical JSON: `HOC-CANONICAL-JSON/V1`

## Arquivos centrais da RC1

- `docs/MANUAL_V1_RC1.md` — manual operacional consolidado;
- `docs/RC1_PRODUCTION_HARDENING.md` — hardening HTTP source-level;
- `release/v1.0-rc1/RELEASE_AUDIT_REPORT.md` — relatório de auditoria;
- `release/v1.0-rc1/AUDIT_STATUS.json` — gates machine-readable;
- `release/v1.0-rc1/VISUAL_MANUAL_ARTIFACTS.json` — hashes do DOCX/PDF visualmente QA'd;
- `release/v1.0-rc1/RELEASE_CHECKLIST.md`;
- `release/v1.0-rc1/RELEASE_MANIFEST.json`;
- `release/v1.0-rc1/OFFICIAL_VECTORS.json`;
- `docs/PROTOCOL_MATRIX_V1_RC1.md`.

## QA Hub

- Runtime: `/oraculum/qa`
- Cubo físico: `/oraculum/qa/physical`
- Câmera/dispositivo: `/oraculum/qa/camera`
- Evidence Ledger: `/oraculum/qa/evidence`
- Verificador de manifesto: `/oraculum/verify`

O Evidence Ledger agrega evidências como `PASS`, `PENDING` ou `BLOCKED`, mas não pode promover artificialmente CI/build ou aprovação humana.

## Manual visual RC1

Os artefatos finais foram regenerados com base no layout anterior já QA'd e reconciliados com a RC1:

- `HNK_ORACULUM_CUBE_Manual_V1.0_RC1.docx`
- `HNK_ORACULUM_CUBE_Manual_V1.0_RC1.pdf`
- 36 páginas.

QA visual:

- páginas 2–32 verificadas pixel-idênticas ao manual anterior já aprovado;
- capa atualizada e inspecionada;
- páginas novas 33–36 inspecionadas individualmente;
- PDF renderizado novamente em renderer independente.

Hashes exatos estão em `release/v1.0-rc1/VISUAL_MANUAL_ARTIFACTS.json`.

Status do gate visual: **PASS**.

## Production hardening

Implementado em source:

- JSON bounded parsing;
- limites: Oraculum 32 KiB, Physical QA 16 KiB, Manifest Verify 512 KiB;
- request-shape guard antes do engine;
- HOC APIs `no-store` / `no-cache`;
- headers defensivos (`nosniff`, frame deny, no-referrer, COOP, Permissions Policy);
- `camera=(self)`, microfone e geolocalização desabilitados;
- contrato que impede `console.*` nas rotas HOC protegidas.

Status correto:

- source hardening: `PASS`;
- verificação em deploy real: `PENDING`.

## CI / build

O GitHub Actions permanece bloqueado pela Issue #6: jobs `validate` terminam com `steps=null` antes de checkout/install/test/typecheck/build.

Portanto:

`CI / TYPECHECK / BUILD = BLOCKED`

Isso não é evidência de falha da aplicação nem de PASS.

## Estado atual de promoção

PASS:

- protocol freeze;
- Markdown consolidado;
- DOCX/PDF visual RC1;
- source-level production hardening.

PENDING:

- runtime self-test executado em ambiente aceito;
- Physical STATE em cubo real;
- Physical RITUAL_32 em cubo real;
- Camera/Device QA real;
- Manifest V0.10 cross-device;
- hardening verificado no deploy;
- aprovação humana V1.0.

BLOCKED:

- CI / typecheck / production build, enquanto Issue #6 persistir.

## Comandos esperados

```bash
pnpm install --no-frozen-lockfile
pnpm check
pnpm --filter @hnk/cubo-web build
pnpm --filter @hnk/cubo-web dev
pnpm bundle:rc1
```

## Critério de V1.0 final

A RC1 só pode ser promovida depois de evidência real para build/testes, QA físico, QA de dispositivo, cross-device, hardening em deploy e aprovação humana explícita.

Até lá:

`RELEASE_CANDIDATE`, não `STABLE`, não `HNK_CANON`.

## Origem técnica

A implementação inicial foi incubada em `tehknesolutions/codex-hnk`. Este repositório é a casa dedicada do Cubo HNK, com migração preservation-first e auditoria antes de qualquer promoção canônica.
