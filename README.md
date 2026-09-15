# HNK Oraculum Cube

Repositório dedicado ao **HNK Oraculum Cube (HOC)**: protocolo computacional e interface para consultas com cubo físico 3×3.

## Escopo

- captura manual reproduzível de um cubo físico;
- protocolo RAW determinístico HOC-256;
- registry/profile layer com provenance;
- interpretação por convergências e tensões;
- superfície web para uso com cubo real;
- captura assistida por câmera com revisão humana obrigatória;
- validação mecânica de estados 3×3 (`HOC-CUBE-LEGALITY/V0.8`);
- prova procedural do modo `RITUAL_32` (`HOC-RITUAL-INTEGRITY/V0.9`);
- documentação operacional e governança.

## Pipeline

`CUBO REAL → HOC-FACELET-SCAN-V1 → LEGALITY V0.8 → RITUAL V0.9 (quando aplicável) → RAW V0.4 → INTERPRETATION V0.5 → MALKUTH`

## Princípios

- o estado bruto do oráculo é determinístico e auditável;
- profiles interpretativos não alteram o RAW;
- correspondências históricas, profiles e síntese HNK permanecem separadas;
- semântica HNK candidata não redefine fonemas, glifos ou léxico;
- a câmera nunca gera hash sem revisão humana das 54 casas;
- estados fisicamente impossíveis são bloqueados antes do SHA;
- `RITUAL_32` exige que o estado final seja reproduzível a partir do estado inicial + 32 movimentos registrados;
- uso simbólico/contemplativo, sem alegação de previsão infalível.

## Compatibilidade RAW

V0.8 e V0.9 são gates físicos anteriores ao protocolo bruto. Eles não alteram `HNK-ORACULUM-CUBE/V0.4`, a seed SHA-256 ou o mapa B000–B255.

## Origem técnica

A implementação inicial foi incubada em `tehknesolutions/codex-hnk` nas versões HOC V0.3–V0.7. Este repositório passa a ser a casa dedicada do Cubo HNK, com migração preservation-first e auditoria antes de qualquer promoção canônica.
