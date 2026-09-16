# HNK Oraculum Cube

Repositório dedicado ao **HNK Oraculum Cube (HOC)**: protocolo computacional e interface para consultas com cubo físico 3×3.

## Release atual

**HOC V1.0 RC1 — `1.0.0-rc.1`**

Status: `RELEASE_CANDIDATE` — ainda não `STABLE` e não implica promoção automática para `HNK_CANON`.

Arquivos de release:

- `release/v1.0-rc1/RELEASE_MANIFEST.json`
- `release/v1.0-rc1/OFFICIAL_VECTORS.json`
- `release/v1.0-rc1/RELEASE_CHECKLIST.md`
- `docs/PROTOCOL_MATRIX_V1_RC1.md`

## Escopo

- captura manual reproduzível de um cubo físico;
- protocolo RAW determinístico HOC-256;
- registry/profile layer com provenance;
- interpretação por convergências e tensões;
- superfície web para uso com cubo real;
- captura assistida por câmera com revisão humana obrigatória;
- validação mecânica de estados 3×3 (`HOC-CUBE-LEGALITY/V0.8`);
- prova procedural do modo `RITUAL_32` (`HOC-RITUAL-INTEGRITY/V0.9`);
- manifesto determinístico e verificável de sessão (`HOC-SESSION-MANIFEST/V0.10`);
- documentação operacional e governança.

## Pipeline

`CUBO REAL → HOC-FACELET-SCAN-V1 → LEGALITY V0.8 → RITUAL V0.9 (quando aplicável) → RAW V0.4 → INTERPRETATION V0.5 → MALKUTH → SESSION MANIFEST V0.10`

## Princípios

- o estado bruto do oráculo é determinístico e auditável;
- profiles interpretativos não alteram o RAW;
- correspondências históricas, profiles e síntese HNK permanecem separadas;
- semântica HNK candidata não redefine fonemas, glifos ou léxico;
- a câmera nunca gera hash sem revisão humana das 54 casas;
- estados fisicamente impossíveis são bloqueados antes do SHA;
- `RITUAL_32` exige que o estado final seja reproduzível a partir do estado inicial + 32 movimentos registrados;
- toda consulta aprovada pode ser envolvida por um manifesto V0.10 com checksum SHA-256 próprio;
- o manifesto autentica o registro, mas não altera o seed RAW V0.4;
- uso simbólico/contemplativo, sem alegação de previsão infalível.

## Compatibilidade RAW

V0.8 e V0.9 são gates físicos anteriores ao protocolo bruto. V0.10 é um envelope de auditoria posterior. Nenhuma dessas camadas altera `HNK-ORACULUM-CUBE/V0.4`, a seed SHA-256 ou o mapa B000–B255.

## Runtime QA da RC1

Self-test protocol:

`HOC-RC1-RUNTIME-SELFTEST/V1`

Painel:

`/oraculum/qa`

API:

`GET /api/oraculum/rc1-selftest`

O self-test executa no runtime Node os vetores congelados de RAW, interpretação, V0.8, V0.9, V0.10 e HNK40. Um PASS é evidência suplementar de consistência do runtime; não substitui CI, typecheck, build de produção ou QA físico.

Documentação:

`docs/RC1_RUNTIME_SELFTEST.md`

## Physical QA da RC1

Wizard:

`/oraculum/qa/physical`

API:

`POST /api/oraculum/qa/physical`

Casos oficiais:

- `STATE_SOLVED`: transcrição de um cubo físico resolvido precisa reproduzir legalidade V0.8, RAW commit e seed congelados;
- `RITUAL32_OFFICIAL`: a transcrição física após os 32 movimentos oficiais precisa reproduzir o estado final V0.9 congelado.

O RITUAL_32 não revela o estado esperado antes da avaliação. A API exige confirmação explícita de que a sequência foi transcrita de um cubo real. O resultado pode ser exportado como evidência JSON, mas esse arquivo não é uma assinatura criptográfica e não substitui CI/build.

Documentação:

`docs/RC1_PHYSICAL_QA.md`

## Camera / Device QA da RC1

Painel:

`/oraculum/qa/camera`

O painel registra evidência do dispositivo real sem persistir imagens. Ele verifica secure context, `getUserMedia`, permissão, resolução do vídeo, captura de U/R/F/D/L/B, protótipos de centro, contagens candidatas, confiança e células de baixa confiança.

O PASS completo exige também uma checklist humana observada no fluxo `/oraculum/camera`: correção manual, gate de revisão antes do hash, STATE passando V0.8, RITUAL_32 com revisão inicial/final e manifesto revalidável.

A evidência exportada exclui imagem, `deviceId` e localização. Camera QA continua não-autoritativo: classificação automática é apenas candidata.

Documentação:

`docs/RC1_CAMERA_QA.md`

## Verificação de manifesto

Interface:

`/oraculum/verify`

API:

`POST /api/oraculum/manifest/verify`

Canonicalização:

`HOC-CANONICAL-JSON/V1`

Cada manifesto válido possui:

- checksum SHA-256 completo;
- `sessionId` curto `HOC-XXXXXXXXXXXXXXXXXXXXXXXX`;
- RAW seed preservado;
- auditoria física V0.8/V0.9;
- outputs, provenance, sigilo, interpretação e Malkuth.

## Comandos RC1

```bash
pnpm install --no-frozen-lockfile
pnpm check
pnpm --filter @hnk/cubo-web build
pnpm --filter @hnk/cubo-web dev
```

Bundle portátil de QA:

```bash
pnpm bundle:rc1
```

Saída esperada:

`dist/HOC-V1.0-RC1-QA/`

O bundle inclui `SHA256SUMS.txt` para verificar os arquivos copiados.

## Critério de promoção

A RC1 só pode virar V1.0 final depois de:

1. testes/typecheck/build executarem em runner real;
2. QA físico STATE e RITUAL_32 passar;
3. QA câmera mínimo passar ou ser explicitamente marcado experimental;
4. manifesto baixado validar em outro dispositivo;
5. manual final ser reconciliado com V0.8–V0.10;
6. revisão humana autorizar a promoção.

Consulte `release/v1.0-rc1/RELEASE_CHECKLIST.md`.

## Origem técnica

A implementação inicial foi incubada em `tehknesolutions/codex-hnk` nas versões HOC V0.3–V0.7. Este repositório passa a ser a casa dedicada do Cubo HNK, com migração preservation-first e auditoria antes de qualquer promoção canônica.
