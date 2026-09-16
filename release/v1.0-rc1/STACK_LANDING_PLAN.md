# HOC V1.0 RC1 — Stack Landing Plan

Plan: `HOC-V1.0-RC1-STACK-LANDING/V10`

Estado atual:

`STACK_READY_FOR_ORDERED_REVIEW_NOT_AUTHORIZED_TO_LAND`

Este documento organiza a sequência dos PRs empilhados. Ele **não autoriza merge**, não promove V1.0 estável e não promove `HNK_CANON`.

## Topologia atual

A cadeia é linear:

`#1 → #2 → #3 → #4 → #5 → #7 → #8 → #9 → #10 → #11 → #12 → #13 → #14 → #15 → #16 → #17 → #18 → #19 → #20 → #21 → #22 → #23 → #24 → #25 → #26 → #27 → #28`

Não existe PR #6 nesta cadeia. O número #6 é a Issue de infraestrutura que rastreia o bloqueio GitHub Actions.

## Camadas finais de governança

### Promotion Readiness V1 — PR #25

`HOC-RC1-PROMOTION-READINESS/V1`

Converte o Evidence Ledger em `INVALID_LEDGER`, `BLOCKED`, `EVIDENCE_INCOMPLETE` ou `READY_FOR_HUMAN_REVIEW`. O último estado significa apenas prontidão para decisão humana.

### Human Promotion Decision V1 — PR #26

`HOC-RC1-HUMAN-PROMOTION-DECISION/V1`

Registra `APPROVE_V1_0`, `DEFER` ou `REJECT`. `APPROVE_V1_0` só pode existir com readiness válido e matriz obrigatória 9/9 PASS.

Mesmo uma aprovação registrada não executa merge, deploy, mudança de versão ou `HNK_CANON`.

### Promotion Execution Plan V1 — PR #27

`HOC-RC1-PROMOTION-EXECUTION-PLAN/V1`

Produz apenas um runbook `DRY_RUN_ONLY`. Cada passo permanece `executable=false` e exige autorização separada.

O plano também recebe `HOC-RC1-PROMOTION-PLAN-FINGERPRINT/V1`, que ignora apenas `generatedAt` e vincula a identidade operacional do plano para impedir autorização silenciosa de um plano modificado.

### Technical Execution Authorization V1 — PR #28

`HOC-RC1-TECHNICAL-EXECUTION-AUTHORIZATION/V1`

Registra autorização técnica **somente para step IDs explicitamente listados** no plano cujo fingerprint foi validado.

A autorização é `STEP_SCOPED`:

- autorizar um PR não autoriza os demais;
- autorizar landing não autoriza stable/tag;
- autorizar ações não produtivas não autoriza produção;
- fases de stable exigem acknowledgement próprio;
- fases de deployment/post-deployment exigem acknowledgement próprio;
- `HNK_CANON` permanece fora deste contrato.

Mesmo uma autorização que liste todos os passos mantém `executesActions=false` e `automaticExecution=false`. O registro documenta autoridade; não contém executor.

## Ordem de aterrissagem

A fonte machine-readable contém a lista completa parent-first dos 27 PRs da stack. A cauda atual é:

| Ordem | PR | Base | Head | Papel |
| ---: | ---: | --- | --- | --- |
| 23 | #24 | `feat/v1-rc1-release-attestation` | `feat/v1-rc1-build-provenance` | proveniência e commit pinning |
| 24 | #25 | `feat/v1-rc1-build-provenance` | `feat/v1-rc1-promotion-readiness` | avaliação final de readiness |
| 25 | #26 | `feat/v1-rc1-promotion-readiness` | `feat/v1-rc1-human-promotion-decision` | registro humano APPROVE/DEFER/REJECT |
| 26 | #27 | `feat/v1-rc1-human-promotion-decision` | `feat/v1-rc1-promotion-execution-plan` | runbook técnico dry-run sem execução |
| 27 | #28 | `feat/v1-rc1-promotion-execution-plan` | `feat/v1-rc1-technical-execution-authorization` | autorização técnica step-scoped ligada ao fingerprint exato |

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

O GitHub dizer que um PR é mergeável significa apenas ausência de conflito textual impeditivo naquele instante. Não significa CI PASS, build PASS, QA físico PASS, aprovação humana, autorização técnica, V1.0 estável ou `HNK_CANON`.

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
- Promotion Execution Plan válido e fingerprint verificado;
- Technical Execution Authorization válido para os step IDs realmente pretendidos;
- executor/manual action separado que revalide autorização imediatamente antes da mutação.

## Estratégia futura de execução

Quando houver autorização humana, gates suficientes e autorização técnica específica, usar **parent-first, um passo por vez**. Antes de cada mutação:

1. revalidar o `planFingerprint`;
2. confirmar que o step ID está listado no authorization record;
3. confirmar que acknowledgements de stable/produção aplicáveis continuam presentes;
4. confirmar o estado atual da base/commit;
5. executar apenas aquela mutação;
6. registrar evidência do resultado antes do passo seguinte.

Não usar merge em massa, auto-merge da stack ou interpretação de autorização parcial como autorização global.

## Fontes

Machine-readable:

`release/v1.0-rc1/STACK_LANDING_PLAN.json`

Governança final:

- `docs/RC1_PROMOTION_READINESS.md`
- `docs/RC1_HUMAN_PROMOTION_DECISION.md`
- `docs/RC1_PROMOTION_EXECUTION_PLAN.md`
- `docs/RC1_TECHNICAL_EXECUTION_AUTHORIZATION.md`
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
