# HOC V1.0 RC1 — Stack Landing Plan

Plan: `HOC-V1.0-RC1-STACK-LANDING/V15`

Estado: `STACK_READY_FOR_ORDERED_REVIEW_NOT_AUTHORIZED_TO_LAND`

A stack organiza revisão parent-first; não autoriza merge, stable ou `HNK_CANON`.

## Topologia

`#1 → #2 → #3 → #4 → #5 → #7 → #8 → #9 → #10 → #11 → #12 → #13 → #14 → #15 → #16 → #17 → #18 → #19 → #20 → #21 → #22 → #23 → #24 → #25 → #26 → #27 → #28 → #29 → #30 → #31 → #32 → #33`

#6 é a Issue do blocker do GitHub Actions, não um PR da stack.

## Cauda operacional

- **#27 Promotion Execution Plan:** `DRY_RUN_ONLY` + `planFingerprint`.
- **#28 Technical Execution Authorization:** autorização `STEP_SCOPED`, sem executor.
- **#29 Pre-Mutation Guard V1:** camada histórica que validava um prefixo informado pelo caller.
- **#30 Technical Mutation Receipt:** registra resultado externo/manual; SUCCESS continua `UNVERIFIED_EXTERNAL_RESULT`.
- **#31 Mutation Evidence Verification:** torna um SUCCESS receipt elegível para completed-prefix após verificação independente.
- **#32 Completed-Prefix State Transition:** cria estado lógico fingerprinted e permite apenas `N → N+1` após evidência verificada.
- **#33 Pre-Mutation Guard V2:** substitui a lista livre de steps concluídos pelo `HOC-RC1-COMPLETED-PREFIX-STATE/V1`, valida seu fingerprint e emite um `guardFingerprint` para cada ALLOW/DENY. Receipts V1 passam a preservar o state fingerprint e guard fingerprint exatos.

A fonte machine-readable contém **32 PRs parent-first**. O Promotion Execution Plan derivado de V15 contém **40 passos totais**.

## CI

O blocker continua antes do primeiro step do GitHub Actions. `mergeable=true` não significa CI PASS nem autorização de merge.

## Stable continua separado

Continuam necessários os gates reais de runtime/physical/camera/cross-device/deployment/CI, readiness humano, autorização técnica por step e execução real. Depois de uma execução, o fluxo operacional exige receipt, verificação da evidência e transição lógica do completed prefix. Nenhuma dessas camadas promove stable ou `HNK_CANON` automaticamente.

## Sequência futura por step

1. validar `planFingerprint`;
2. validar Technical Execution Authorization;
3. carregar e validar o Completed Prefix State fingerprinted;
4. executar Pre-Mutation Guard V2 para `state.nextStepId`;
5. exigir `ALLOW / AUTHORIZED_NEXT_STEP` com `guardFingerprint` válido;
6. executar a mutação externamente/manual;
7. registrar Technical Mutation Receipt V1, preservando `guardFingerprint` e `completedPrefixStateFingerprint`;
8. verificar independentemente todas as evidências do receipt;
9. gerar Completed-Prefix Transition `N → N+1`, vinculando o `verificationFingerprint` à lineage;
10. usar o `nextState` fingerprinted como estado de entrada do próximo Guard V2.

Não interpretar APPROVE, authorization, ALLOW, SUCCESS receipt, evidence verification ou completed-prefix transition como autorização global ou promoção automática.

## Fontes

- `release/v1.0-rc1/STACK_LANDING_PLAN.json`
- `docs/RC1_PROMOTION_EXECUTION_PLAN.md`
- `docs/RC1_TECHNICAL_EXECUTION_AUTHORIZATION.md`
- `docs/RC1_PRE_MUTATION_GUARD.md`
- `docs/RC1_TECHNICAL_MUTATION_RECEIPT.md`
- `docs/RC1_MUTATION_EVIDENCE_VERIFICATION.md`
- `docs/RC1_COMPLETED_PREFIX_TRANSITION.md`
- `release/v1.0-rc1/RELEASE_MANIFEST.json`
- `release/v1.0-rc1/AUDIT_STATUS.json`
