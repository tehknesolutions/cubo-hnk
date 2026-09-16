# HOC V1.0 RC1 — Stack Landing Plan

Plan: `HOC-V1.0-RC1-STACK-LANDING/V17`

Estado: `STACK_READY_FOR_ORDERED_REVIEW_NOT_AUTHORIZED_TO_LAND`

A stack organiza revisão parent-first; não autoriza merge, stable ou `HNK_CANON`.

## Topologia

`#1 → #2 → #3 → #4 → #5 → #7 → #8 → #9 → #10 → #11 → #12 → #13 → #14 → #15 → #16 → #17 → #18 → #19 → #20 → #21 → #22 → #23 → #24 → #25 → #26 → #27 → #28 → #29 → #30 → #31 → #32 → #33 → #34 → #35`

#6 é a Issue do blocker do GitHub Actions, não um PR da stack.

## Cauda operacional

- **#29 Pre-Mutation Guard V1:** camada histórica de prefixo informado pelo caller.
- **#30 Technical Mutation Receipt:** resultado externo/manual não verificado.
- **#31 Mutation Evidence Verification:** verifica as evidências do receipt.
- **#32 Completed-Prefix Transition V1:** introduziu o estado lógico fingerprinted e avanço `N → N+1`.
- **#33 Pre-Mutation Guard V2:** consome o Completed Prefix State fingerprinted, remove `completedStepIds` livre e emite `guardFingerprint`.
- **#34 Completed-Prefix Transition V2:** revalida o Guard V2 contra o `currentState` exato, inclui `sourceGuard.guardFingerprint` no Transition Fingerprint V2 e rejeita state swap entre autorização e avanço lógico.
- **#35 Independent Tail Evidence:** congela uma execução real fora do Actions do source subset V16: 21/21 testes reais do repositório PASS + 13/13 checks suplementares. É `PASS / EXECUTED_PARTIAL`, não CI completo.

A fonte machine-readable contém **34 PRs parent-first**. O Promotion Execution Plan derivado de V17 contém **42 passos totais**.

## Execução independente parcial

A evidência do #35 está em:

- `release/v1.0-rc1/INDEPENDENT_TAIL_TEST_EVIDENCE.json`
- `release/v1.0-rc1/INDEPENDENT_TAIL_TESTS.tap`
- `docs/RC1_INDEPENDENT_TAIL_VALIDATION.md`

Ela valida a cauda operacional Guard V2 → Receipt → Evidence Verification → Transition V2 sob Node `v22.16.0`, mas não substitui `pnpm install`, typecheck, Next.js build, GitHub CI, QA físico ou deployment verification.

## CI

O blocker continua antes do primeiro step do GitHub Actions. `mergeable=true` não significa CI PASS nem autorização de merge.

## Sequência futura por step

1. validar `planFingerprint`;
2. validar Technical Execution Authorization;
3. carregar e validar Completed Prefix State V1;
4. executar Pre-Mutation Guard V2 para `state.nextStepId`;
5. exigir `ALLOW / AUTHORIZED_NEXT_STEP` com `guardFingerprint` válido;
6. executar a mutação externamente/manual;
7. registrar Technical Mutation Receipt V1 preservando state/guard fingerprints;
8. verificar independentemente as evidências;
9. executar Completed-Prefix Transition V2, que revalida o Guard V2 contra o mesmo `currentState` antes do `N → N+1`;
10. usar o novo state fingerprinted como entrada do próximo Guard V2.

Nenhuma dessas camadas, nem a evidência parcial do #35, autoriza merge global, produção, stable ou `HNK_CANON` automaticamente.

## Fontes

- `release/v1.0-rc1/STACK_LANDING_PLAN.json`
- `docs/RC1_PROMOTION_EXECUTION_PLAN.md`
- `docs/RC1_PRE_MUTATION_GUARD.md`
- `docs/RC1_TECHNICAL_MUTATION_RECEIPT.md`
- `docs/RC1_MUTATION_EVIDENCE_VERIFICATION.md`
- `docs/RC1_COMPLETED_PREFIX_TRANSITION.md`
- `docs/RC1_INDEPENDENT_TAIL_VALIDATION.md`
- `release/v1.0-rc1/RELEASE_MANIFEST.json`
- `release/v1.0-rc1/AUDIT_STATUS.json`
