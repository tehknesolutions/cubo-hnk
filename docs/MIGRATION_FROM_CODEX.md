# Migração preservation-first — codex-hnk → cubo-hnk

## Objetivo

`tehknesolutions/cubo-hnk` passa a ser a casa dedicada do HNK Oraculum Cube. O `codex-hnk` permanece intacto como origem histórica até a validação e promoção deste repositório.

## Baseline importado

- V0.3 — Cube40 + camada HNK40 authored-candidate.
- V0.4 — RAW determinístico HOC-256.
- V0.5 — profiles, provenance, convergências e tensões.
- V0.6 — captura manual de cubo físico (`HOC-FACELET-SCAN-V1`).
- V0.7 — captura assistida por câmera com revisão humana obrigatória.

## Invariantes de preservação

1. O protocolo RAW continua `HNK-ORACULUM-CUBE/V0.4`.
2. O profile interpretativo continua fora do hash RAW.
3. Vetor dourado: intenção `Qual padrão precisa se manifestar?` + cubo resolvido deve gerar `df6bcd1bfd58288fb8f7d7e0f22b69d7e305a24429ba4445c242efc000e3b6fc`.
4. O vetor deve continuar produzindo Path 24, G39, Tarot 71, Sagitário, Marte, Ar, Salt/Citrinitas, I Ching 30 → 23 e cores `#447DC7 / #BB8238 / #7DC744`.
5. HNK40 permanece 40/40 G01–G40; a migração não cria um segundo alfabeto.
6. Semântica oracular HNK40 continua `HNK_AUTHORED_CANDIDATE_AWAITING_HUMAN_PROMOTION`.
7. A captura por câmera nunca pode hashear sem confirmação humana da transcrição final.

## Mudança arquitetural deliberada

No `codex-hnk`, `@hnk/oraculum-engine` dependia de `@hnk/glyphs` via workspace. No repo dedicado foi criado `hnk40-runtime.mjs`, um adapter mínimo com G01–G40, IPA, worldId e estado visual. O adapter declara o mesmo glyph-set SHA-256 do runtime original: `78668df0f707952b7c280de52526abaa2b7900597fb8ff362a3a08641fd1bce5`.

A autoridade continua sendo o runtime HNK40 de origem; o adapter existe apenas para tornar este repositório autônomo.

## Gate de promoção

Este bootstrap só pode ir para `main` após:

- golden tests do engine PASS;
- interpretation tests PASS;
- camera classifier tests PASS;
- TypeScript PASS;
- Next.js build PASS;
- QA desktop/mobile com cubo real;
- revisão humana da governança.

Nenhum merge do repo novo autoriza apagar ou modificar a origem no `codex-hnk` automaticamente.
