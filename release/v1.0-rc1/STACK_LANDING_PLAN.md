# HOC V1.0 RC1 — Stack Landing Plan

Plan: `HOC-V1.0-RC1-STACK-LANDING/V2`

Estado atual:

`STACK_READY_FOR_ORDERED_REVIEW_NOT_AUTHORIZED_TO_LAND`

Este documento organiza a sequência dos PRs empilhados. Ele **não autoriza merge**, não promove V1.0 estável e não promove `HNK_CANON`.

## Topologia atual

A cadeia é linear:

`#1 → #2 → #3 → #4 → #5 → #7 → #8 → #9 → #10 → #11 → #12 → #13 → #14 → #15 → #16 → #17 → #18 → #19 → #20`

Não existe PR #6 nesta cadeia. O número #6 é a Issue de infraestrutura que rastreia o bloqueio GitHub Actions.

## Ordem de aterrissagem

| Ordem | PR | Base | Head | Papel |
| ---: | ---: | --- | --- | --- |
| 1 | #1 | `main` | `feat/bootstrap-hoc-v1` | bootstrap do repo dedicado |
| 2 | #2 | `feat/bootstrap-hoc-v1` | `feat/v08-cube-legality` | legalidade V0.8 |
| 3 | #3 | `feat/v08-cube-legality` | `feat/v09-ritual-integrity` | integridade V0.9 |
| 4 | #4 | `feat/v09-ritual-integrity` | `feat/v010-session-manifest` | manifesto V0.10 |
| 5 | #5 | `feat/v010-session-manifest` | `release/v1.0-rc1` | freeze RC1 |
| 6 | #7 | `release/v1.0-rc1` | `feat/v1-rc1-runtime-selftest` | runtime self-test |
| 7 | #8 | `feat/v1-rc1-runtime-selftest` | `feat/v1-rc1-physical-qa` | Physical QA |
| 8 | #9 | `feat/v1-rc1-physical-qa` | `feat/v1-rc1-camera-qa` | Camera/Device QA |
| 9 | #10 | `feat/v1-rc1-camera-qa` | `feat/v1-rc1-evidence-ledger` | Evidence Ledger |
| 10 | #11 | `feat/v1-rc1-evidence-ledger` | `docs/v1-rc1-manual-audit` | manual + audit |
| 11 | #12 | `docs/v1-rc1-manual-audit` | `feat/v1-rc1-production-hardening` | hardening de produção |
| 12 | #13 | `feat/v1-rc1-production-hardening` | `docs/v1-rc1-visual-manual` | manual visual DOCX/PDF |
| 13 | #14 | `docs/v1-rc1-visual-manual` | `feat/v1-rc1-independent-validation` | runner independente |
| 14 | #15 | `feat/v1-rc1-independent-validation` | `feat/v1-rc1-independent-ledger` | evidência independente no ledger |
| 15 | #16 | `feat/v1-rc1-independent-ledger` | `docs/v1-rc1-stack-landing` | landing governance V1 |
| 16 | #17 | `docs/v1-rc1-stack-landing` | `feat/v1-rc1-deployment-verification` | deployment verifier |
| 17 | #18 | `feat/v1-rc1-deployment-verification` | `feat/v1-rc1-deployment-ledger` | deployment evidence no ledger |
| 18 | #19 | `feat/v1-rc1-deployment-ledger` | `infra/actions-runner-diagnostic` | diagnóstico pre-runner + pacote Support |
| 19 | #20 | `infra/actions-runner-diagnostic` | `docs/v1-rc1-stack-landing-v2` | reconciliação da topologia V2 |

## Diagnóstico do blocker

O PR #19 executou um workflow deliberadamente sem dependências do projeto em dois labels GitHub-hosted:

- `ubuntu-latest`;
- `windows-latest`.

Ambos criaram job objects e terminaram em `failure` com:

- `steps = null`;
- `logs_url = null`;
- nenhum `echo`/`Write-Output` executado.

Isso localiza a condição atual antes dos steps de workflow e retira checkout, pnpm, Node, Next.js, HOC tests/build e um problema exclusivo de Ubuntu da lista de causas necessárias.

O gate oficial de CI continua `BLOCKED`; diagnóstico não equivale a PASS.

## Regra parent-first

Nenhum child PR deve aterrissar antes do parent correspondente.

Depois que um parent for mergeado:

1. atualizar/retargetar a base do próximo PR;
2. conferir merge-base;
3. revisar novamente o diff incremental;
4. confirmar que os vetores congelados continuam idênticos;
5. só então considerar o próximo merge.

## `mergeable=true` não é autorização

O GitHub dizer que um PR é mergeável significa apenas ausência de conflito textual impeditivo naquele instante.

Não significa:

- CI PASS;
- build PASS;
- QA físico PASS;
- aprovação humana;
- autorização de merge;
- V1.0 estável;
- `HNK_CANON`.

O plano machine-readable continua com:

`mergeAuthorized = false`

## Evidências alternativas continuam separadas

### Independent executor

`pnpm validate:rc1:independent`

Pode produzir install/test/typecheck/build/self-test reais em outra máquina, mas não transforma GitHub CI em PASS.

### Deployment runtime

`pnpm verify:rc1:deployment -- --url <URL>`

Pode comprovar self-test, headers, seed dourado e manifesto em um host real, mas não substitui CI nem Physical QA.

## Gates de stable continuam separados

Mesmo que a stack RC1 seja futuramente aterrissada como código de release candidate, isso não equivale à promoção V1.0 estável.

Continuam independentes:

- Runtime Self-Test executado;
- Physical STATE;
- Physical RITUAL_32;
- Camera/Device QA ou downgrade experimental explícito;
- Manifest V0.10 cross-device;
- deployment runtime verification;
- host logging/retention e estratégia de abuso/rate limit;
- GitHub CI/typecheck/build;
- aprovação humana V1.0.

## Estratégia futura de merge

Quando houver autorização humana e gates suficientes, usar **parent-first, um PR por vez**.

Após cada merge:

- confirmar SHA resultante;
- verificar próxima base;
- retargetar/rebasear se necessário;
- recalcular diff incremental;
- interromper se qualquer vetor, protocolo ou contrato sair do escopo esperado.

Não usar merge em massa ou auto-merge da stack enquanto a RC1 estiver sob auditoria.

## Fontes

Machine-readable:

`release/v1.0-rc1/STACK_LANDING_PLAN.json`

Diagnóstico de Actions:

- `release/v1.0-rc1/ACTIONS_RUNNER_DIAGNOSTIC_EVIDENCE.json`
- `docs/GITHUB_ACTIONS_SUPPORT_PACKET.md`
