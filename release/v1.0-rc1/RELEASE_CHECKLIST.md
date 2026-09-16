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

Estado conhecido na criação da RC1: GitHub Actions vinha encerrando jobs com `steps=null`; isso é bloqueio de infraestrutura, não evidência de PASS ou FAIL do código.

## D. QA físico manual

### STATE

- [ ] Cubo resolvido digitado manualmente é aceito pela V0.8.
- [ ] Estado legal embaralhado digitado manualmente é aceito.
- [ ] Uma aresta artificialmente invertida é bloqueada.
- [ ] Um canto artificialmente torcido é bloqueado.
- [ ] Estado com paridade impossível é bloqueado.
- [ ] Consulta válida gera manifesto V0.10.
- [ ] Manifesto baixado valida em `/oraculum/verify`.

### RITUAL_32

- [ ] Estado inicial real é capturado e fixado.
- [ ] Os 32 movimentos do vetor oficial são executados fisicamente.
- [ ] Estado final transcrito coincide com o simulador V0.9.
- [ ] Alterar uma casa do final produz `FINAL_STATE_MISMATCH` ou ilegalidade.
- [ ] Manifesto RITUAL_32 registra initial/expected/reported final.
- [ ] Manifesto RITUAL_32 salvo valida novamente.

## E. QA câmera

- [ ] Permissão de câmera funciona em dispositivo móvel compatível.
- [ ] U/R/F/D/L/B são capturadas na orientação oficial.
- [ ] Centros geram protótipos cromáticos corretos.
- [ ] Baixa confiança é sinalizada.
- [ ] Revisão manual altera classificação candidata corretamente.
- [ ] Hash não é gerado sem confirmação humana.
- [ ] STATE via câmera passa V0.8.
- [ ] RITUAL_32 via câmera exige revisão humana inicial e final.
- [ ] Manifesto via câmera pode ser baixado e revalidado.

## F. Cross-device QA

- [ ] Desktop Chromium.
- [ ] Android Chromium.
- [ ] iOS/Safari quando disponível.
- [ ] Layout sem clipping nas seis faces.
- [ ] JSON manifest download funciona.
- [ ] Verificador aceita arquivo exportado em outro dispositivo.
- [ ] Mesma consulta canônica produz mesmo RAW seed e mesmo V0.10 checksum.

## G. Security / integrity review

- [x] SHA-256 RAW calculado server-side.
- [x] V0.10 checksum recalculado server-side no verificador.
- [x] Falha V0.8 retorna sem manifesto.
- [x] Falha V0.9 retorna sem manifesto.
- [x] Camera image não recebe autoridade protocolar.
- [ ] Revisar limites de tamanho do JSON na API de verificação.
- [ ] Revisar headers/cache antes de produção pública.
- [ ] Revisar logging para não persistir imagens ou dados não necessários.

## H. Documentation

- [x] Manual de cubo real.
- [x] Addendum V0.8.
- [x] Addendum V0.9.
- [x] Addendum V0.10.
- [x] Matriz de protocolos RC1.
- [x] Release manifest machine-readable.
- [x] Official vectors machine-readable.
- [ ] Manual DOCX/PDF deve ser reconciliado com V0.8–V0.10 antes de V1.0 final.

## I. Promotion gate

V1.0 final só pode ser marcada quando:

1. todas as validações automatizadas C estiverem verdes em executor real;
2. QA físico STATE e RITUAL_32 estiver fechado;
3. QA câmera mínimo estiver fechado ou câmera for explicitamente marcada experimental;
4. manual final estiver reconciliado;
5. diff RC1 → V1.0 não alterar contratos congelados sem nova revisão;
6. revisão humana autorizar promoção.

Até lá: `RELEASE_CANDIDATE`, não `STABLE`, não `HNK_CANON`.
