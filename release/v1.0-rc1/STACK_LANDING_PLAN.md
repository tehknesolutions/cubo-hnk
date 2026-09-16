# HOC V1.0 RC1 — Stack Landing Plan

Plan: `HOC-V1.0-RC1-STACK-LANDING/V12`

Estado: `STACK_READY_FOR_ORDERED_REVIEW_NOT_AUTHORIZED_TO_LAND`

Este documento organiza a stack. Ele não autoriza merge, V1.0 estável ou `HNK_CANON`.

## Topologia

`#1 → #2 → #3 → #4 → #5 → #7 → #8 → #9 → #10 → #11 → #12 → #13 → #14 → #15 → #16 → #17 → #18 → #19 → #20 → #21 → #22 → #23 → #24 → #25 → #26 → #27 → #28 → #29 → #30`

Não existe PR #6; #6 é a Issue de infraestrutura do GitHub Actions.

## Camadas finais de governança

- **PR #25 — Promotion Readiness V1:** classifica os gates sem autoridade de promoção.
- **PR #26 — Human Promotion Decision V1:** registra APPROVE/DEFER/REJECT; APPROVE não executa nada.
- **PR #27 — Promotion Execution Plan V1:** runbook `DRY_RUN_ONLY` vinculado por `planFingerprint`.
- **PR #28 — Technical Execution Authorization V1:** autorização `STEP_SCOPED` ligada ao fingerprint exato; não contém executor.
- **PR #29 — Pre-Mutation Guard V1:** só retorna `ALLOW` ao próximo step autorizado após prefixo concluído válido; `ALLOW` não é ação.
- **PR #30 — Technical Mutation Receipt V1:** registra resultado externo/manual após `ALLOW`, mas todo receipt nasce como `UNVERIFIED_EXTERNAL_RESULT`, `externalEvidenceVerified=false` e `advancesCompletedPrefix=false`.

## Ordem de aterrissagem

A fonte machine-readable contém os 29 PRs parent-first. A cauda atual é:

| Ordem | PR | Base | Head | Papel |
| ---: | ---: | --- | --- | --- |
| 25 | #26 | `feat/v1-rc1-promotion-readiness` | `feat/v1-rc1-human-promotion-decision` | decisão humana |
| 26 | #27 | `feat/v1-rc1-human-promotion-decision` | `feat/v1-rc1-promotion-execution-plan` | runbook dry-run |
| 27 | #28 | `feat/v1-rc1-promotion-execution-plan` | `feat/v1-rc1-technical-execution-authorization` | autorização step-scoped |
| 28 | #29 | `feat/v1-rc1-technical-execution-authorization` | `feat/v1-rc1-pre-mutation-guard` | guard ALLOW/DENY |
| 29 | #30 | `feat/v1-rc1-pre-mutation-guard` | `feat/v1-rc1-mutation-receipt` | receipt externo não verificado |

## GitHub Actions

O blocker continua localizado antes do primeiro step. O gate oficial de CI permanece `BLOCKED`; diagnóstico ou controles de recuperação não equivalem a PASS.

## Regra parent-first

Depois de cada parent landing:

1. atualizar/retargetar a base do próximo PR;
2. conferir merge-base;
3. revisar novamente o diff incremental;
4. confirmar vetores/protocolos congelados;
5. só então considerar o próximo merge.

`mergeable=true` significa apenas ausência de conflito textual naquele instante. Não é autorização de merge, CI PASS, QA PASS, stable ou `HNK_CANON`.

## Gates de stable continuam separados

Permanecem independentes: Runtime Self-Test real; Physical STATE; Physical RITUAL_32; Camera/Device; Manifest cross-device; deployment/runtime verification; hardening runtime; GitHub CI/typecheck/build; readiness `READY_FOR_HUMAN_REVIEW`; decisão humana `APPROVE_V1_0`; plan fingerprint válido; Technical Execution Authorization para os steps pretendidos; Pre-Mutation Guard `ALLOW` para o próximo step; ação externa/manual efetivamente executada; e evidência dessa ação independentemente verificada antes de avançar o completed prefix.

## Estratégia futura de execução

Antes de cada mutação:

1. revalidar `planFingerprint`;
2. validar authorization record;
3. confirmar `completedStepIds` como prefixo exato;
4. pedir guard do step atual;
5. exigir `ALLOW / AUTHORIZED_NEXT_STEP`;
6. revalidar estado real do alvo;
7. executar somente aquela mutação externamente/manual;
8. registrar Technical Mutation Receipt;
9. verificar independentemente a evidência do receipt;
10. somente após verificação aceitar o step como concluído.

Não usar merge em massa, auto-merge ou interpretar authorization/ALLOW/receipt como autorização global ou prova automática.

## Fontes

- `release/v1.0-rc1/STACK_LANDING_PLAN.json`
- `docs/RC1_PROMOTION_READINESS.md`
- `docs/RC1_HUMAN_PROMOTION_DECISION.md`
- `docs/RC1_PROMOTION_EXECUTION_PLAN.md`
- `docs/RC1_TECHNICAL_EXECUTION_AUTHORIZATION.md`
- `docs/RC1_PRE_MUTATION_GUARD.md`
- `docs/RC1_TECHNICAL_MUTATION_RECEIPT.md`
- `release/v1.0-rc1/RELEASE_MANIFEST.json`
- `release/v1.0-rc1/AUDIT_STATUS.json`
