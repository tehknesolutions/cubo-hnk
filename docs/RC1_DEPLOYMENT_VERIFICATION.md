# HOC V1.0 RC1 — Deployment Verification Runner

Evidence protocol:

`HOC-RC1-DEPLOYMENT-VERIFY-EVIDENCE/V1`

Command:

```bash
pnpm verify:rc1:deployment -- --url https://preview.example
```

ou:

```bash
HOC_DEPLOY_URL=https://preview.example pnpm verify:rc1:deployment
```

## Objetivo

Verificar o comportamento **real do deployment**, separando configuração source-level de comportamento efetivamente servido pelo host.

O runner não cria deployment e não publica nada. Ele só opera quando uma URL é fornecida explicitamente.

## Gate 0 — Release Attestation V1

Antes de aceitar self-test, headers, seed ou manifesto, o runner consulta:

`GET /api/oraculum/release`

E exige:

- HTTP 200;
- `HOC-RC1-RELEASE-ATTESTATION/V1`;
- release ID `HOC-V1.0-RC1`;
- fingerprint exatamente `08e003a28185fcd31a806549588547994bcc3075a256bc6cbe6d79d9558f3e90`;
- `matchesExpected === true`;
- headers `X-HOC-Release-Id` e `X-HOC-Release-Fingerprint` coerentes;
- `Cache-Control: no-store`.

Esse gate impede que um deployment stale/estranho receba PASS apenas porque reproduz uma saída parcial.

Contrato detalhado:

`docs/RC1_RELEASE_ATTESTATION.md`

## Checks de runtime

Após a identidade RC1 ser confirmada, o runner verifica:

1. `GET /api/oraculum/rc1-selftest` retorna HTTP 200 e PASS;
2. self-test response tem `Cache-Control: no-store`;
3. `/oraculum` está acessível;
4. headers defensivos reais do host:
   - `X-Content-Type-Options: nosniff`;
   - `X-Frame-Options: DENY`;
   - `Referrer-Policy: no-referrer`;
   - `Cross-Origin-Opener-Policy: same-origin`;
   - Permissions Policy com `camera=(self)`, microfone e geolocalização desabilitados;
5. POST STATE com o vetor dourado reproduz exatamente o seed RAW V0.4 congelado;
6. `X-HOC-Session-Id` e `X-HOC-Manifest-SHA256` conferem com o manifesto retornado;
7. o mesmo manifesto é revalidado por `/api/oraculum/manifest/verify`;
8. o verificador de manifesto também responde `no-store`;
9. payload oracular malformado falha com HTTP 400;
10. a resposta de erro também é `no-store`.

## Golden vector remoto

Intent:

`Qual padrão precisa se manifestar?`

Solved cube:

`000000000111111111222222222333333333444444444555555555`

Expected seed:

`df6bcd1bfd58288fb8f7d7e0f22b69d7e305a24429ba4445c242efc000e3b6fc`

## Evidence artifact

Output:

`dist/rc1-deployment-validation/HOC-RC1-DEPLOYMENT-VERIFY-EVIDENCE.json`

O artefato registra:

- origem do deployment;
- HTTPS yes/no;
- versão da Release Attestation;
- fingerprint esperado/observado e resultado da comparação;
- seed esperado e observado;
- Session ID e checksum;
- cada check individual;
- status HTTP;
- hashes SHA-256 das respostas;
- contagem PASS/FAIL.

O corpo completo do manifesto não é persistido na evidência.

## URL policy

HTTPS é obrigatório para URLs remotas.

HTTP só é aceito para `localhost`, `127.0.0.1` ou `::1`.

## Autoridade

A evidência declara:

`DEPLOYMENT_RUNTIME_EVIDENCE_NOT_PRODUCTION_PROMOTION`

E mantém:

- `promotesStable=false`;
- `promotesHnkCanon=false`;
- `replacesGitHubCI=false`;
- `replacesPhysicalQa=false`.

Portanto, um PASS prova apenas que **aquela URL** serviu a identidade RC1 congelada e passou os checks de runtime naquele momento. Não promove a release e não substitui QA físico nem CI.
