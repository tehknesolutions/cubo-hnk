# HOC V1.0 RC1 — Stack Landing Plan

Plan: `HOC-V1.0-RC1-STACK-LANDING/V5`

Estado atual:

`STACK_READY_FOR_ORDERED_REVIEW_NOT_AUTHORIZED_TO_LAND`

Este documento organiza a sequência dos PRs empilhados. Ele **não autoriza merge**, não promove V1.0 estável e não promove `HNK_CANON`.

## Topologia atual

A cadeia é linear:

`#1 → #2 → #3 → #4 → #5 → #7 → #8 → #9 → #10 → #11 → #12 → #13 → #14 → #15 → #16 → #17 → #18 → #19 → #20 → #21 → #22 → #23`

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
| 20 | #21 | `docs/v1-rc1-stack-landing-v2` | `infra/actions-recovery-controls` | controles manuais de recuperação do Actions |
| 21 | #22 | `infra/actions-recovery-controls` | `feat/v1-rc1-vercel-preview-bootstrap` | bootstrap preview-only da Vercel |
| 22 | #23 | `feat/v1-rc1-vercel-preview-bootstrap` | `feat/v1-rc1-release-attestation` | identidade determinística da RC1 e gate de deployment |

## GitHub Actions

O PR #19 localizou o blocker antes do primeiro step em `ubuntu-latest` e `windows-latest`. O PR #21 encerrou probes automáticos redundantes e deixou diagnóstico/CI com gatilhos manuais de recuperação.

O gate oficial de CI continua `BLOCKED`; diagnóstico ou configuração de recuperação não equivalem a PASS.

## Preview Vercel

O PR #22 prepara o caminho de preview sem publicar produção:

- `apps/web/vercel.json` define Next.js;
- install/build sobem para a raiz do workspace para resolver `workspace:*`;
- `pnpm preview:preflight` valida estrutura/configuração;
- Root Directory esperado: `apps/web`;
- comandos de produção permanecem fora do bootstrap RC1.

A conta Vercel conectada ainda não possui projeto `cubo-hnk`; o deployment verifier permanece PENDING até existir uma URL real aprovada.

## Release Attestation V1

O PR #23 acrescenta uma identidade determinística do runtime RC1:

`HOC-RC1-RELEASE-ATTESTATION/V1`

Fingerprint congelado:

`08e003a28185fcd31a806549588547994bcc3075a256bc6cbe6d79d9558f3e90`

A atestação liga release/package, protocolos congelados, vetores oficiais e hash estrutural HNK40. O endpoint `/api/oraculum/release` falha fechado se o fingerprint calculado divergir.

O deployment verifier passa a exigir a atestação antes do self-test/oracle, e o Evidence Ledger rejeita deployment evidence com versão/fingerprint divergente.

Esse fingerprint prova identidade do contrato RC1 servido, não stable, CI, Physical QA ou `HNK_CANON`.

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

## Evidências alternativas continuam separadas

### Independent executor

`pnpm validate:rc1:independent`

Pode produzir install/test/typecheck/build/self-test reais em outra máquina, mas não transforma GitHub CI em PASS.

### Deployment runtime

`pnpm verify:rc1:deployment -- --url <URL>`

Agora exige Release Attestation V1 válida e depois comprova self-test, headers, seed dourado e manifesto no host. Continua sem substituir CI nem Physical QA.

## Gates de stable continuam separados

Mesmo que a stack RC1 seja futuramente aterrissada como código de release candidate, isso não equivale à promoção V1.0 estável.

Continuam independentes:

- Runtime Self-Test executado;
- Physical STATE;
- Physical RITUAL_32;
- Camera/Device QA ou downgrade experimental explícito;
- Manifest V0.10 cross-device;
- deployment runtime verification com fingerprint RC1 correto;
- host logging/retention e estratégia de abuso/rate limit;
- GitHub CI/typecheck/build;
- aprovação humana V1.0.

## Estratégia futura de merge

Quando houver autorização humana e gates suficientes, usar **parent-first, um PR por vez**. Após cada merge, confirmar SHA, verificar a próxima base, retargetar/rebasear se necessário, recalcular o diff incremental e interromper se qualquer vetor, protocolo ou contrato sair do escopo esperado.

Não usar merge em massa ou auto-merge da stack enquanto a RC1 estiver sob auditoria.

## Fontes

Machine-readable:

`release/v1.0-rc1/STACK_LANDING_PLAN.json`

Release identity:

- `release/v1.0-rc1/RELEASE_MANIFEST.json`
- `docs/RC1_RELEASE_ATTESTATION.md`

Diagnóstico/recuperação de Actions:

- `release/v1.0-rc1/ACTIONS_RUNNER_DIAGNOSTIC_EVIDENCE.json`
- `docs/GITHUB_ACTIONS_SUPPORT_PACKET.md`
- `docs/GITHUB_ACTIONS_RECOVERY_RUNBOOK.md`

Preview/deployment:

- `apps/web/vercel.json`
- `docs/VERCEL_PREVIEW_BOOTSTRAP.md`
- `docs/RC1_DEPLOYMENT_VERIFICATION.md`
