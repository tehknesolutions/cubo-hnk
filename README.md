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

## CI / validação independente

O GitHub Actions permanece bloqueado pela Issue #6: jobs `validate` terminam com `steps=null` antes de checkout/install/test/typecheck/build. Probes mínimos em `ubuntu-latest` e `windows-latest` também falharam antes do primeiro step, classificando o blocker como infraestrutura de runner/provisionamento e não como falha da aplicação.

Separadamente, a validação independente da pilha RC1 já demonstrou:

- `pnpm install --frozen-lockfile`: `PASS` com lockfile byte-verificado;
- engine: `108/108 PASS`;
- web: `64/64 PASS`;
- TypeScript engine + web: `PASS`;
- Next.js 16.3.3 production build: `PASS`, `12/12` páginas estáticas;
- árvore rastreada limpa após build.

Portanto:

`INDEPENDENT TEST / TYPECHECK / BUILD = PASS`

`GITHUB ACTIONS CI = BLOCKED (PRE-STEP RUNNER PROVISIONING)`

Um não substitui o outro e nenhum deles autoriza promoção automática.

## Estado atual de promoção

PASS:

- protocol freeze;
- Markdown consolidado;
- DOCX/PDF visual RC1;
- source-level production hardening;
- validação independente de install/test/typecheck/build com lockfile congelado.

PENDING:

- runtime self-test executado em ambiente aceito;
- Physical STATE em cubo real;
- Physical RITUAL_32 em cubo real;
- Camera/Device QA real;
- Manifest V0.10 cross-device;
- hardening verificado no deploy;
- aprovação humana V1.0.

BLOCKED:

- GitHub Actions CI enquanto Issue #6 persistir.

## Comandos esperados

```bash
pnpm install --frozen-lockfile
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
