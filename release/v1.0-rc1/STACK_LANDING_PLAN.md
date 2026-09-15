# HOC V1.0 RC1 — Stack Landing Plan

Plan: `HOC-V1.0-RC1-STACK-LANDING/V1`

Estado atual:

`STACK_READY_FOR_ORDERED_REVIEW_NOT_AUTHORIZED_TO_LAND`

Este documento organiza a sequência dos PRs empilhados. Ele **não autoriza merge**, não promove V1.0 estável e não promove `HNK_CANON`.

## Topologia

A cadeia atual é linear:

`#1 → #2 → #3 → #4 → #5 → #7 → #8 → #9 → #10 → #11 → #12 → #13 → #14 → #15`

Não existe PR #6 nesta cadeia. O número #6 é a Issue de infraestrutura que rastreia os jobs GitHub Actions encerrando com `steps=null` antes de qualquer comando.

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

## Regra de parent first

Nenhum child PR deve ser aterrissado antes do parent correspondente.

Depois que um parent for mergeado:

1. atualizar a base do próximo PR para a nova branch de destino adequada;
2. conferir o merge-base;
3. revisar novamente o diff incremental;
4. confirmar que os vetores congelados continuam idênticos;
5. só então considerar o próximo merge.

Isso evita que um PR empilhado carregue acidentalmente commits já aterrissados ou perca parte da história durante retarget/rebase.

## O que `mergeable=true` significa — e o que não significa

Hoje os PRs da stack têm aparecido como mergeáveis pelo GitHub.

Isso significa apenas que o GitHub consegue construir um merge commit sem conflito textual naquele momento.

Não significa:

- testes PASS;
- build PASS;
- QA físico PASS;
- aprovação humana;
- permissão para merge;
- V1.0 estável;
- `HNK_CANON`.

## Gates antes de qualquer aterrissagem

O plano machine-readable mantém:

`mergeAuthorized = false`

Para iniciar a aterrissagem é necessária, no mínimo:

- autorização humana explícita para merge;
- evidência de execução automatizada real conforme a governança vigente;
- integridade dos contratos/vetores congelados.

Enquanto a Issue #6 continuar impedindo o GitHub Actions de executar steps, o gate oficial de CI permanece `BLOCKED`.

O Independent Validation Runner pode produzir evidência suplementar real, mas não converte o CI oficial em PASS.

## Gates de stable continuam separados

Mesmo que a stack RC1 seja futuramente aterrissada como código de release candidate, isso não equivale à promoção V1.0 estável.

A promoção stable continua exigindo os gates definidos no Release Audit, incluindo:

- Runtime Self-Test executado;
- Physical STATE;
- Physical RITUAL_32;
- Camera/Device QA ou downgrade experimental explícito;
- Manifest V0.10 cross-device;
- hardening verificado em deployment real;
- CI/typecheck/build conforme governança;
- aprovação humana V1.0.

## Estratégia de merge

Quando houver autorização e gates suficientes, a estratégia recomendada é **parent-first, um PR por vez**, preservando rastreabilidade.

Após cada merge:

- confirmar o SHA resultante;
- verificar a próxima base;
- atualizar/retargetar o próximo PR se necessário;
- recalcular a comparação incremental;
- parar imediatamente se qualquer vetor, protocolo ou contrato aparecer fora do escopo esperado.

Não usar merge em massa ou auto-merge da stack enquanto a RC1 estiver sob auditoria.

## Fonte machine-readable

`release/v1.0-rc1/STACK_LANDING_PLAN.json`

Esse arquivo é a referência estruturada da topologia e contém explicitamente as flags de não-autorização.
