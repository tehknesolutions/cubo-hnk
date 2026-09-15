# HOC V1.0 RC1 — Release Evidence Ledger

Status: QA instrumentation only.

Protocol de agregação:

`HOC-RC1-EVIDENCE-LEDGER/V1`

O ledger não altera nenhum protocolo oracular e não promove automaticamente a RC1.

## Objetivo

Reunir, numa mesma matriz, evidências geradas pelos fluxos de QA da RC1:

- runtime self-test;
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

A evidência contém apenas:

- resultado válido/inválido;
- versão do manifesto;
- `sessionId`;
- checksum SHA-256;
- label humano do dispositivo;
- secure context, viewport e user-agent;
- timestamp de exportação.

Não contém o corpo do manifesto.

Não contém:

- imagem;
- `deviceId`;
- geolocalização;
- fingerprint de hardware.

## Gate cross-device

O gate só recebe PASS quando há pelo menos duas evidências válidas de verificação que possuem:

1. mesmo `sessionId`;
2. mesmo checksum SHA-256;
3. labels humanos de dispositivo diferentes.

Exemplo:

- `Desktop Edge`;
- `Android Chrome`.

O label é uma declaração operacional humana, não uma identidade criptográfica do hardware.

Duas evidências com o mesmo label não contam como cross-device.

Duas evidências com checksums diferentes não contam como cross-device.

## CI / build

Na criação deste protocolo, o gate permanece:

`BLOCKED`

Motivo:

GitHub Issue #6 — os jobs do Actions estão terminando com `steps=null` antes de checkout, instalação, testes ou build.

Nenhuma evidência local pode promover esse gate para PASS.

Quando a infraestrutura for resolvida, esta camada deverá ser revisada com um contrato específico de evidência executada de CI/build.

## Gates finais

Mesmo com todas as evidências de runtime, físico, câmera e cross-device em PASS, continuam independentes:

- manual DOCX/PDF final reconciliado;
- CI/typecheck/build real;
- decisão humana explícita de promoção RC1 → V1.0.

## Artifact consolidado

A tela pode exportar:

`HOC-RC1-RELEASE-EVIDENCE-LEDGER/V1`

Esse JSON inclui:

- relatório de gates;
- lista dos arquivos importados;
- classificações;
- evidências originais importadas.

Ele é um pacote de auditoria operacional.

Ele **não é assinatura criptográfica da release**.

A autenticação criptográfica continua limitada ao Session Manifest V0.10 e ao SHA-256 de seus dados canônicos.

## Governança

O Evidence Ledger não altera:

- `HNK-ORACULUM-CUBE/V0.4`;
- Interpretation V0.5;
- `HOC-CUBE-LEGALITY/V0.8`;
- `HOC-RITUAL-INTEGRITY/V0.9`;
- `HOC-SESSION-MANIFEST/V0.10`;
- HNK40;
- vetores congelados da RC1.

O ledger existe somente para evidência de promoção de release.
