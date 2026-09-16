# HOC V1.0 RC1 — Stack Landing Plan

Plan: `HOC-V1.0-RC1-STACK-LANDING/V13`

Estado: `STACK_READY_FOR_ORDERED_REVIEW_NOT_AUTHORIZED_TO_LAND`

A stack organiza revisão parent-first; não autoriza merge, stable ou `HNK_CANON`.

## Topologia

`#1 → #2 → #3 → #4 → #5 → #7 → #8 → #9 → #10 → #11 → #12 → #13 → #14 → #15 → #16 → #17 → #18 → #19 → #20 → #21 → #22 → #23 → #24 → #25 → #26 → #27 → #28 → #29 → #30 → #31`

#6 é a Issue do blocker do GitHub Actions, não um PR da stack.

## Cauda operacional

- **#27 Promotion Execution Plan:** `DRY_RUN_ONLY` + `planFingerprint`.
- **#28 Technical Execution Authorization:** autorização `STEP_SCOPED`, sem executor.
- **#29 Pre-Mutation Guard:** `ALLOW/DENY` para o próximo step exato; ALLOW não executa.
- **#30 Technical Mutation Receipt:** registra resultado externo/manual; SUCCESS ainda é `UNVERIFIED_EXTERNAL_RESULT` e `advancesCompletedPrefix=false`.
- **#31 Mutation Evidence Verification:** verifica 1:1 as referências do SUCCESS receipt, hashes/timestamps e fingerprint do registro. Pode retornar `eligibleForCompletedPrefix=true`, mas sempre mantém `mutatesCompletedPrefix=false`.

A fonte machine-readable contém **30 PRs parent-first**. O Promotion Execution Plan derivado de V13 contém **38 passos totais**.

## CI

O blocker continua antes do primeiro step do GitHub Actions. `mergeable=true` não significa CI PASS nem autorização de merge.

## Stable continua separado

Continuam necessários os gates reais de runtime/physical/camera/cross-device/deployment/CI, readiness humano, autorização técnica por step e execução real. Depois de uma execução, o fluxo operacional exige receipt e verificação da evidência. Mesmo uma verificação `VERIFIED_EXTERNAL_EVIDENCE` não altera estado sozinha; uma transição de completed-prefix separada deverá revalidá-la.

## Sequência futura por step

1. validar `planFingerprint`;
2. validar authorization record;
3. validar prefixo concluído atual;
4. obter Pre-Mutation Guard `ALLOW`;
5. executar a mutação externamente/manual;
6. registrar Technical Mutation Receipt;
7. verificar independentemente todas as evidências do receipt;
8. somente uma camada de state transition separada poderá acrescentar esse step ao completed prefix;
9. recomeçar a cadeia para o próximo step.

Não interpretar APPROVE, authorization, ALLOW, SUCCESS receipt ou evidence verification como autorização global ou promoção automática.

## Fontes

- `release/v1.0-rc1/STACK_LANDING_PLAN.json`
- `docs/RC1_PROMOTION_EXECUTION_PLAN.md`
- `docs/RC1_TECHNICAL_EXECUTION_AUTHORIZATION.md`
- `docs/RC1_PRE_MUTATION_GUARD.md`
- `docs/RC1_TECHNICAL_MUTATION_RECEIPT.md`
- `docs/RC1_MUTATION_EVIDENCE_VERIFICATION.md`
- `release/v1.0-rc1/RELEASE_MANIFEST.json`
- `release/v1.0-rc1/AUDIT_STATUS.json`
