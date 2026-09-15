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

## C. Automated validation — obrigatória antes de V1.0 final

- [ ] GitHub Actions recebe runner real.
- [ ] `pnpm install --no-frozen-lockfile` PASS.
- [ ] `pnpm test` PASS.
- [ ] `pnpm typecheck` PASS.
- [ ] `pnpm check` PASS.
- [ ] `pnpm --filter @hnk/cubo-web build` PASS.
- [ ] Nenhum warning de build que altere comportamento de runtime.

Estado conhecido na RC1: GitHub Actions continua encerrando jobs com `steps=null`; isso é bloqueio de infraestrutura registrado na Issue #6, não evidência de PASS ou FAIL do código.

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
- [ ] Confirmar headers reais no deployment/build final.
- [ ] Revisar access logs/retention do host de produção.
- [ ] Definir rate-limit/abuse strategy se a API ficar pública em escala.
- [ ] Avaliar CSP após existir build/deploy verificável.

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

1. todas as validações automatizadas C estiverem verdes em executor real;
2. runtime self-test executado e preservado como evidência;
3. QA físico STATE e RITUAL_32 estiver fechado;
4. QA câmera mínimo estiver fechado ou câmera for explicitamente marcada experimental;
5. cross-device Manifest V0.10 estiver fechado;
6. deployed headers/log-retention e abuso/rate-limit estiverem revisados para o ambiente de produção escolhido;
7. diff RC1 → V1.0 não alterar contratos congelados sem nova revisão;
8. revisão humana autorizar promoção.

Gate documental visual: **PASS**. Os arquivos revisados são identificados pelos hashes em `VISUAL_MANUAL_ARTIFACTS.json`.

Até lá: `RELEASE_CANDIDATE`, não `STABLE`, não `HNK_CANON`.

Princípio de auditoria RC1:

`IMPLEMENTADO ≠ INSTRUMENTADO ≠ EXECUTADO ≠ APROVADO`.
