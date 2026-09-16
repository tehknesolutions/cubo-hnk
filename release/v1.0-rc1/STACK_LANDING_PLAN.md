# HOC V1.0 RC1 — Stack Landing Plan

Plan: `HOC-V1.0-RC1-STACK-LANDING/V8`

Estado atual:

`STACK_READY_FOR_ORDERED_REVIEW_NOT_AUTHORIZED_TO_LAND`

Este documento organiza a sequência dos PRs empilhados. Ele **não autoriza merge**, não promove V1.0 estável e não promove `HNK_CANON`.

## Topologia atual

A cadeia é linear:

`#1 → #2 → #3 → #4 → #5 → #7 → #8 → #9 → #10 → #11 → #12 → #13 → #14 → #15 → #16 → #17 → #18 → #19 → #20 → #21 → #22 → #23 → #24 → #25 → #26`

Não existe PR #6 nesta cadeia. O número #6 é a Issue de infraestrutura que rastreia o bloqueio GitHub Actions.

## Camadas finais de governança

### Promotion Readiness V1 — PR #25

`HOC-RC1-PROMOTION-READINESS/V1`

Converte o Evidence Ledger em `INVALID_LEDGER`, `BLOCKED`, `EVIDENCE_INCOMPLETE` ou `READY_FOR_HUMAN_REVIEW`.

`READY_FOR_HUMAN_REVIEW` é apenas prontidão para decisão humana; nunca é stable automático.

### Human Promotion Decision V1 — PR #26

`HOC-RC1-HUMAN-PROMOTION-DECISION/V1`

Registra uma decisão humana:

- `APPROVE_V1_0`;
- `DEFER`;
- `REJECT`.

`APPROVE_V1_0` só pode ser registrado quando o readiness é válido, `READY_FOR_HUMAN_REVIEW` e a matriz obrigatória está coerente em 9/9 PASS, sem pending/blocked/missing/invalid.

Mesmo um registro `APPROVE_V1_0` mantém:

- `executesMerge=false`;
- `executesDeployment=false`;
- `changesPackageVersion=false`;
- `promotesHnkCanon=false`;
- `automaticPromotion=false`.

Logo, decisão humana documentada e execução técnica continuam duas etapas diferentes.

## Ordem de aterrissagem

A fonte machine-readable contém a lista completa parent-first dos 25 PRs da stack. A cauda atual é:

| Ordem | PR | Base | Head | Papel |
| ---: | ---: | --- | --- | --- |
| 21 | #22 | `infra/actions-recovery-controls` | `feat/v1-rc1-vercel-preview-bootstrap` | bootstrap preview-only da Vercel |
| 22 | #23 | `feat/v1-rc1-vercel-preview-bootstrap` | `feat/v1-rc1-release-attestation` | identidade determinística RC1 |
| 23 | #24 | `feat/v1-rc1-release-attestation` | `feat/v1-rc1-build-provenance` | proveniência e commit pinning |
| 24 | #25 | `feat/v1-rc1-build-provenance` | `feat/v1-rc1-promotion-readiness` | avaliação final de readiness |
| 25 | #26 | `feat/v1-rc1-promotion-readiness` | `feat/v1-rc1-human-promotion-decision` | registro humano APPROVE/DEFER/REJECT |

## GitHub Actions

O PR #19 localizou o blocker antes do primeiro step em `ubuntu-latest` e `windows-latest`. O PR #21 encerrou probes automáticos redundantes e deixou diagnóstico/CI com gatilhos manuais de recuperação.

O gate oficial de CI continua `BLOCKED`; diagnóstico ou configuração de recuperação não equivalem a PASS.

## Regra parent-first

Nenhum child PR deve aterrissar antes do parent correspondente. Depois que um parent for mergeado:

1. atualizar/retargetar a base do próximo PR;
2. conferir merge-base;
3. revisar novamente o diff incremental;
4. confirmar que os vetores congelados continuam idênticos;
5. só então considerar o próximo merge.

## `mergeable=true` não é autorização

O GitHub dizer que um PR é mergeável significa apenas ausência de conflito textual impeditivo naquele instante. Não significa CI PASS, build PASS, QA físico PASS, aprovação humana, autorização de merge, V1.0 estável ou `HNK_CANON`.

O plano machine-readable continua com:

`mergeAuthorized = false`

`stablePromotionAuthorized = false`

`hnkCanonPromotionAuthorized = false`

## Gates de stable continuam separados

Continuam independentes:

- Runtime Self-Test executado;
- Physical STATE;
- Physical RITUAL_32;
- Camera/Device QA;
- Manifest V0.10 cross-device;
- deployment runtime verification com fingerprint/proveniência corretos;
- host logging/retention e estratégia de abuso/rate limit;
- GitHub CI/typecheck/build;
- Promotion Readiness = `READY_FOR_HUMAN_REVIEW`;
- Human Promotion Decision = `APPROVE_V1_0`;
- autorização separada para execução técnica da promoção V1.0.

## Estratégia futura de merge

Quando houver autorização humana e gates suficientes, usar **parent-first, um PR por vez**. Após cada merge, confirmar SHA, verificar a próxima base, retargetar/rebasear se necessário, recalcular o diff incremental e interromper se qualquer vetor, protocolo ou contrato sair do escopo esperado.

Não usar merge em massa ou auto-merge da stack enquanto a RC1 estiver sob auditoria.

## Fontes

Machine-readable:

`release/v1.0-rc1/STACK_LANDING_PLAN.json`

Governança final:

- `docs/RC1_PROMOTION_READINESS.md`
- `docs/RC1_HUMAN_PROMOTION_DECISION.md`
- `release/v1.0-rc1/RELEASE_MANIFEST.json`
- `release/v1.0-rc1/AUDIT_STATUS.json`

Release identity / provenance:

- `docs/RC1_RELEASE_ATTESTATION.md`
- `docs/RC1_BUILD_PROVENANCE.md`

Diagnóstico/recuperação de Actions:

- `release/v1.0-rc1/ACTIONS_RUNNER_DIAGNOSTIC_EVIDENCE.json`
- `docs/GITHUB_ACTIONS_SUPPORT_PACKET.md`
- `docs/GITHUB_ACTIONS_RECOVERY_RUNBOOK.md`

Preview/deployment:

- `apps/web/vercel.json`
- `docs/VERCEL_PREVIEW_BOOTSTRAP.md`
- `docs/RC1_DEPLOYMENT_VERIFICATION.md`
