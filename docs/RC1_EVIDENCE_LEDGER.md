# HOC V1.0 RC1 — Release Evidence Ledger

Status: QA instrumentation only.

Protocol de agregação:

`HOC-RC1-EVIDENCE-LEDGER/V1`

O ledger não altera nenhum protocolo oracular e não promove automaticamente a RC1.

## Objetivo

Reunir, numa mesma matriz, evidências geradas pelos fluxos de QA da RC1:

- runtime self-test;
- independent executor validation;
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

PASS exige:

- release `HOC-V1.0-RC1`;
- `report.passed === true`.

### Independent executor

`HOC-RC1-INDEPENDENT-VALIDATION-EVIDENCE/V1`

Gerada por:

`pnpm validate:rc1:independent`

PASS exige simultaneamente:

- release `HOC-V1.0-RC1`;
- `passed === true`;
- `authority === INDEPENDENT_EXECUTOR_EVIDENCE_NOT_GITHUB_CI`;
- `summary.failedCommands === 0`;
- `governance.replacesGitHubCI === false`;
- `governance.promotesStable === false`;
- `governance.promotesHnkCanon === false`.

Esse gate prova execução real naquele executor quando o artefato foi produzido, mas **não transforma GitHub CI em PASS**.

### Physical QA

`HOC-RC1-PHYSICAL-QA-EVIDENCE/V1`

Exportada em `/oraculum/qa/physical`.

Os casos são independentes:

- `STATE_SOLVED`;
- `RITUAL32_OFFICIAL`.

PASS exige:

- release RC1;
- `report.passed === true`;
- `physicalTranscriptionConfirmed === true`.

### Camera / Device QA

`HOC-RC1-CAMERA-QA-EVIDENCE/V1`

Exportada em `/oraculum/qa/camera`.

PASS exige simultaneamente:

- `fullQaPass === true`;
- `capabilityPass === true`;
- `manualPass === true`.

### Manifest verification

`HOC-RC1-MANIFEST-VERIFY-EVIDENCE/V1`

Exportada em `/oraculum/verify` após o servidor recalcular o manifesto V0.10.

A evidência contém apenas resultado, versão do manifesto, `sessionId`, checksum SHA-256, label humano do dispositivo, contexto básico do navegador e timestamp. Não contém o corpo do manifesto, imagem, `deviceId`, geolocalização ou fingerprint de hardware.

## Gate cross-device

O gate só recebe PASS quando há pelo menos duas evidências válidas de verificação que possuem:

1. mesmo `sessionId`;
2. mesmo checksum SHA-256;
3. labels humanos de dispositivo diferentes.

O label é uma declaração operacional humana, não uma identidade criptográfica do hardware.

## Independent executor versus GitHub CI

Esses gates são deliberadamente distintos.

Um Independent Executor PASS pode demonstrar:

- instalação real;
- testes reais;
- typecheck real;
- `pnpm check` real;
- build Next.js real;
- Runtime Self-Test real.

Mesmo assim, enquanto a Issue #6 continuar produzindo jobs com `steps=null`, o gate:

`GitHub CI / typecheck / build`

permanece:

`BLOCKED`

O ledger nunca usa evidência local/independente para promover silenciosamente o CI oficial.

## Gates fixos refletidos pelo ledger

O estado atual também registra:

- Production hardening source: `PASS`;
- Manual Markdown + DOCX/PDF final: `PASS`;
- Aprovação humana V1.0: `PENDING`;
- GitHub CI: `BLOCKED` enquanto Issue #6 persistir.

Esses estados não dependem da quantidade de arquivos importados.

## Artifact consolidado

A tela pode exportar:

`HOC-RC1-RELEASE-EVIDENCE-LEDGER/V1`

Esse JSON inclui relatório de gates, lista dos arquivos importados, classificações e evidências originais importadas.

Ele é um pacote de auditoria operacional e **não é assinatura criptográfica da release**. A autenticação criptográfica continua limitada ao Session Manifest V0.10 e ao SHA-256 de seus dados canônicos.

## Governança

O Evidence Ledger não altera:

- `HNK-ORACULUM-CUBE/V0.4`;
- Interpretation V0.5;
- `HOC-CUBE-LEGALITY/V0.8`;
- `HOC-RITUAL-INTEGRITY/V0.9`;
- `HOC-SESSION-MANIFEST/V0.10`;
- HNK40;
- vetores congelados da RC1.

O ledger existe somente para organizar evidência de promoção de release.
