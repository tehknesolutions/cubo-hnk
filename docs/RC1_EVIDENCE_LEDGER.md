# HOC V1.0 RC1 — Release Evidence Ledger

Status: QA instrumentation only.

Protocol de agregação:

`HOC-RC1-EVIDENCE-LEDGER/V1`

O ledger não altera nenhum protocolo oracular e não promove automaticamente a RC1.

## Objetivo

Reunir, numa mesma matriz, evidências geradas pelos fluxos de QA da RC1:

- runtime self-test;
- independent executor validation;
- deployment/runtime verification;
- physical QA STATE;
- physical QA RITUAL_32;
- camera/device QA;
- verificação de Session Manifest em dispositivos/ambientes diferentes.

O resultado é apresentado por gate como:

- `PASS` — existe evidência suficiente para aquele gate;
- `PENDING` — evidência ainda ausente ou incompleta;
- `BLOCKED` — o gate depende de uma condição externa atualmente bloqueada.

## Interface

`/oraculum/qa/evidence`

Os arquivos JSON são processados somente no navegador e permanecem em memória enquanto a página estiver aberta. Não há upload para API.

## Evidências reconhecidas

### Runtime

`HOC-RC1-RUNTIME-QA-EVIDENCE/V1`

Exportada em `/oraculum/qa`.

PASS exige release `HOC-V1.0-RC1` e `report.passed === true`.

### Independent executor

`HOC-RC1-INDEPENDENT-VALIDATION-EVIDENCE/V1`

Gerada por:

`pnpm validate:rc1:independent`

PASS exige simultaneamente:

- release RC1;
- `passed === true`;
- autoridade `INDEPENDENT_EXECUTOR_EVIDENCE_NOT_GITHUB_CI`;
- zero comandos obrigatórios falhos;
- `replacesGitHubCI === false`;
- `promotesStable === false`;
- `promotesHnkCanon === false`.

Esse gate prova execução real naquele executor, mas não transforma GitHub CI em PASS.

### Deployment runtime

`HOC-RC1-DEPLOYMENT-VERIFY-EVIDENCE/V1`

Gerada por:

`pnpm verify:rc1:deployment -- --url <URL_APROVADA>`

PASS exige simultaneamente:

- release RC1;
- `passed === true`;
- autoridade `DEPLOYMENT_RUNTIME_EVIDENCE_NOT_PRODUCTION_PROMOTION`;
- zero checks falhos;
- seed RAW observado exatamente igual ao seed dourado esperado;
- `promotesStable === false`;
- `promotesHnkCanon === false`;
- `replacesGitHubCI === false`;
- `replacesPhysicalQa === false`.

O runner remoto verifica self-test, headers reais do host, `no-store`, vetor STATE dourado, Session Manifest headers e revalidação V0.10. Um PASS vale somente para a URL/runtime testados e não constitui promoção de produção.

### Physical QA

`HOC-RC1-PHYSICAL-QA-EVIDENCE/V1`

Exportada em `/oraculum/qa/physical`.

Os casos `STATE_SOLVED` e `RITUAL32_OFFICIAL` são independentes. PASS exige `report.passed === true` e confirmação de transcrição física.

### Camera / Device QA

`HOC-RC1-CAMERA-QA-EVIDENCE/V1`

Exportada em `/oraculum/qa/camera`.

PASS exige simultaneamente `fullQaPass`, `capabilityPass` e `manualPass`.

### Manifest verification

`HOC-RC1-MANIFEST-VERIFY-EVIDENCE/V1`

Exportada em `/oraculum/verify` após o servidor recalcular o manifesto V0.10.

A evidência contém apenas identidade/resultados necessários ao QA e não contém corpo do manifesto, imagem, `deviceId`, geolocalização ou fingerprint de hardware.

## Gate cross-device

O gate só recebe PASS quando há pelo menos duas evidências válidas de verificação com mesmo `sessionId`, mesmo checksum SHA-256 e labels humanos de dispositivo diferentes.

## Executor / deployment versus GitHub CI

Esses gates são deliberadamente distintos.

Independent Executor PASS pode provar install/test/typecheck/build/self-test em uma máquina real.

Deployment Runtime PASS pode provar que um host real serve a aplicação com os headers, seed e verificação V0.10 esperados.

Mesmo com ambos em PASS, enquanto a Issue #6 continuar produzindo jobs GitHub Actions com `steps=null`, o gate:

`GitHub CI / typecheck / build`

permanece:

`BLOCKED`

Nenhuma dessas evidências substitui Physical QA.

## Gates fixos refletidos pelo ledger

O estado atual também registra:

- Production hardening source: `PASS`;
- Manual Markdown + DOCX/PDF final: `PASS`;
- Aprovação humana V1.0: `PENDING`;
- GitHub CI: `BLOCKED` enquanto Issue #6 persistir.

## Artifact consolidado

A tela pode exportar:

`HOC-RC1-RELEASE-EVIDENCE-LEDGER/V1`

Esse JSON inclui relatório de gates, lista dos arquivos importados, classificações e evidências originais importadas.

Ele é um pacote de auditoria operacional e **não é assinatura criptográfica da release**. A autenticação criptográfica continua limitada ao Session Manifest V0.10 e ao SHA-256 de seus dados canônicos.

## Governança

O Evidence Ledger não altera RAW V0.4, Interpretation V0.5, V0.8, V0.9, V0.10, HNK40 nem vetores congelados da RC1.

O ledger existe somente para organizar evidência de promoção de release.
