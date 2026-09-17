# HOC V1.0 RC1 — Release / Promotion Checklist

Release candidate: `1.0.0-rc.1`

Nenhum item pendente deve ser reinterpretado como aprovado. A promoção para V1.0 final exige evidência executada.

## A. Protocol freeze

- [x] `HOC-FACELET-SCAN-V1` documentado.
- [x] RAW permanece `HNK-ORACULUM-CUBE/V0.4`.
- [x] Interpretation permanece V0.5 profile-governed.
- [x] Legality permanece `HOC-CUBE-LEGALITY/V0.8`.
- [x] Ritual permanece `HOC-RITUAL-INTEGRITY/V0.9`.
- [x] Manifest permanece `HOC-SESSION-MANIFEST/V0.10`.
- [x] Canonical JSON permanece `HOC-CANONICAL-JSON/V1`.
- [x] HNK40 glyph-set SHA congelado.
- [x] HNK40 semantic layer continua candidate/non-canonical.

## B. Golden vectors

- [x] STATE seed congelado em `df6bcd1bfd58288fb8f7d7e0f22b69d7e305a24429ba4445c242efc000e3b6fc`.
- [x] STATE decoded fields registrados em `OFFICIAL_VECTORS.json`.
- [x] RITUAL_32 vetor de 32 movimentos congelado.
- [x] RITUAL_32 final esperado congelado em `513004512451013254000425014533433235324540121221251340`.
- [x] Manifest synthetic checksum congelado.
- [x] RC1 contract test lê os arquivos oficiais e compara com o engine.

## C. Automated validation + independent executor reconciliation

### GitHub-hosted CI — obrigatória antes de V1.0 final

- [ ] GitHub Actions recebe runner real.
- [ ] `pnpm install --frozen-lockfile` PASS em GitHub-hosted CI.
- [ ] `pnpm test` PASS em GitHub-hosted CI.
- [ ] `pnpm typecheck` PASS em GitHub-hosted CI.
- [ ] `pnpm check` PASS em GitHub-hosted CI.
- [ ] `pnpm --filter @hnk/cubo-web build` PASS em GitHub-hosted CI.
- [ ] Nenhum warning de build que altere comportamento de runtime.

Estado conhecido na RC1: GitHub Actions continua encerrando jobs com `steps=null`; isso é bloqueio de infraestrutura registrado na Issue #6, não evidência de PASS ou FAIL do código.

### Independent frozen validation — evidência já executada, não substitui CI

- [x] Clean checkout do source/config head `74997fc18b4b4054b4f9a48068547acac8c50764` validado em Windows com pnpm `10.17.1`.
- [x] `pnpm install --frozen-lockfile` PASS com lockfile SHA-256 `C84D832FE6BB264A041A93077FA0BD6402622508D1B083E695058C93300E72F3`.
- [x] Engine `108/108` PASS.
- [x] Web `64/64` PASS.
- [x] `pnpm typecheck` PASS para engine + web.
- [x] Next.js `16.3.3` production build PASS, `12/12` páginas estáticas.
- [x] O lockfile depois tracked no GitHub é byte-identical ao lockfile usado nessa execução (`git blob 1d5c7cdca5b22ea02ba9b3952fd9ac580fafd428`).
- [ ] Fresh clean rerun no head RC1 landed atual com o lockfile já tracked; pendente porque o executor autorizado está offline.

Fontes: `RC1_FROZEN_INSTALL_RECONCILIATION_EVIDENCE.json` e `RC1_TRACKED_LOCKFILE_EVIDENCE.json`.

## D. Runtime QA

- [x] `HOC-RC1-RUNTIME-SELFTEST/V1` implementado.
- [x] Painel `/oraculum/qa` implementado.
- [x] Export `HOC-RC1-RUNTIME-QA-EVIDENCE/V1` implementado.
- [ ] Runtime self-test executado em ambiente aceito para promoção e evidência PASS preservada.

## E. QA físico manual

### STATE

- [x] Wizard `/oraculum/qa/physical` implementado.
- [ ] Cubo resolvido transcrito de hardware real é aceito pela V0.8.
- [ ] Estado legal embaralhado digitado manualmente é aceito.
- [ ] Uma aresta artificialmente invertida é bloqueada.
- [ ] Um canto artificialmente torcido é bloqueado.
- [ ] Estado com paridade impossível é bloqueado.
- [ ] Consulta válida gera manifesto V0.10.
- [ ] Manifesto baixado valida em `/oraculum/verify`.
- [ ] Evidência `HOC-RC1-PHYSICAL-QA-EVIDENCE/V1` de STATE PASS preservada.

### RITUAL_32

- [ ] Estado inicial real é capturado e fixado.
- [ ] Os 32 movimentos do vetor oficial são executados fisicamente.
- [ ] Estado final transcrito coincide com o simulador V0.9.
- [ ] Alterar uma casa do final produz `FINAL_STATE_MISMATCH` ou ilegalidade.
- [ ] Manifesto RITUAL_32 registra initial/expected/reported final.
- [ ] Manifesto RITUAL_32 salvo valida novamente.
- [ ] Evidência `HOC-RC1-PHYSICAL-QA-EVIDENCE/V1` de RITUAL32 PASS preservada.

## F. QA câmera / dispositivo

- [x] Painel `/oraculum/qa/camera` implementado.
- [x] Evidência `HOC-RC1-CAMERA-QA-EVIDENCE/V1` implementada.
- [ ] Permissão de câmera funciona em dispositivo móvel compatível.
- [ ] U/R/F/D/L/B são capturadas na orientação oficial.
- [ ] Centros geram protótipos cromáticos corretos.
- [ ] Baixa confiança é sinalizada.
- [ ] Revisão manual altera classificação candidata corretamente.
- [ ] Hash não é gerado sem confirmação humana.
- [ ] STATE via câmera passa V0.8.
- [ ] RITUAL_32 via câmera exige revisão humana inicial e final.
- [ ] Manifesto via câmera pode ser baixado e revalidado.
- [ ] Camera QA PASS real preservado ou câmera explicitamente marcada experimental antes da promoção.

## G. Cross-device QA

- [x] Export `HOC-RC1-MANIFEST-VERIFY-EVIDENCE/V1` implementado.
- [x] Evidence Ledger `/oraculum/qa/evidence` implementado.
- [x] Regra cross-device exige mesmo `sessionId` + checksum + labels distintos.
- [ ] Desktop Chromium validado.
- [ ] Android Chromium validado.
- [ ] iOS/Safari quando disponível.
- [ ] Layout sem clipping nas seis faces.
- [ ] JSON manifest download funciona.
- [ ] Verificador aceita arquivo exportado em outro dispositivo.
- [ ] Mesma consulta canônica produz mesmo RAW seed e mesmo V0.10 checksum.
- [ ] Duas evidências válidas distintas satisfazem o gate `manifestCrossDevice` no ledger.

## H. Security / integrity review

- [x] SHA-256 RAW calculado server-side.
- [x] V0.10 checksum recalculado server-side no verificador.
- [x] Falha V0.8 retorna sem manifesto.
- [x] Falha V0.9 retorna sem manifesto.
- [x] Camera image não recebe autoridade protocolar.
- [x] Camera QA evidence exclui imagem, `deviceId` e localização.
- [x] Manifest verify evidence exclui o corpo do manifesto, `deviceId` e geolocalização.
- [x] Limites de payload implementados: Oraculum 32 KiB, Physical QA 16 KiB, Manifest Verify 512 KiB.
- [x] Cache source policy implementada: HOC APIs `no-store` + `Pragma: no-cache`.
- [x] Headers defensivos source-level implementados em `next.config.ts`.
- [x] Logging source review fechado: rotas HOC protegidas sem `console.*` de payload/manifesto.
- [x] Contract test `production-hardening-contract.test.mjs` adicionado.
- [x] Next.js production build já executado com PASS no frozen-validation head reconciliado; isso não prova runtime/deployment.
- [ ] Confirmar headers reais no deployment/build final servido.
- [ ] Revisar access logs/retention do host de produção.
- [ ] Definir rate-limit/abuse strategy se a API ficar pública em escala.
- [ ] Avaliar CSP após existir deployment verificável.

Documentação: `docs/RC1_PRODUCTION_HARDENING.md`.

## I. Documentation

- [x] Manual base de cubo real preservado.
- [x] Addendum V0.8 preservado.
- [x] Addendum V0.9 preservado.
- [x] Addendum V0.10 preservado.
- [x] Matriz de protocolos RC1.
- [x] Runtime QA documentado.
- [x] Physical QA documentado.
- [x] Camera QA documentado.
- [x] Evidence Ledger documentado.
- [x] Production Hardening documentado.
- [x] Manual Markdown consolidado: `docs/MANUAL_V1_RC1.md`.
- [x] Release Audit Report: `release/v1.0-rc1/RELEASE_AUDIT_REPORT.md`.
- [x] Audit status machine-readable: `release/v1.0-rc1/AUDIT_STATUS.json`.
- [x] Release manifest machine-readable.
- [x] Official vectors machine-readable.
- [x] Manual visual DOCX/PDF RC1 regenerado em 36 páginas e QA visual concluído.
- [x] Hashes exatos dos artefatos registrados em `release/v1.0-rc1/VISUAL_MANUAL_ARTIFACTS.json`.

## J. Promotion gate

V1.0 final só pode ser marcada quando:

1. GitHub-hosted CI (ou caminho automatizado explicitamente aprovado pela política de release) executar e fechar install/test/typecheck/build sem o blocker pré-step;
2. fresh clean rerun do head RC1 landed atual confirmar a cadeia frozen já reconciliada, salvo decisão explícita de governança que aceite a evidência byte-identical existente;
3. runtime self-test executado e preservado como evidência;
4. QA físico STATE e RITUAL_32 estiver fechado;
5. QA câmera mínimo estiver fechado ou câmera for explicitamente marcada experimental;
6. cross-device Manifest V0.10 estiver fechado;
7. deployed headers/log-retention e abuso/rate-limit estiverem revisados para o ambiente de produção escolhido;
8. diff RC1 → V1.0 não alterar contratos congelados sem nova revisão;
9. revisão humana autorizar promoção.

Gate documental visual: **PASS**. Os arquivos revisados são identificados pelos hashes em `VISUAL_MANUAL_ARTIFACTS.json`.

Até lá: `RELEASE_CANDIDATE`, não `STABLE`, não `HNK_CANON`.

Princípio de auditoria RC1:

`IMPLEMENTADO ≠ INSTRUMENTADO ≠ EXECUTADO ≠ APROVADO`.
