# GitHub Actions Recovery Runbook — HOC V1.0 RC1

Status: infraestrutura preparada; hosted runner ainda bloqueado pela Issue #6.

## Objetivo

Evitar novos runs diagnósticos automáticos enquanto a causa já está localizada na camada pre-step e fornecer uma sequência controlada para validar a recuperação quando GitHub/account provisioning for corrigido.

## Estado conhecido

O diagnóstico zero-dependency provou que `ubuntu-latest` e `windows-latest` terminam antes do primeiro shell step com `steps=null` e `logs_url=null`.

Classificação atual:

`PRE_STEP_RUNNER_DISPATCH_OR_PROVISIONING_FAILURE`

Isso não é CI PASS nem aplicação FAIL.

## Controles de workflow

### Actions Runner Diagnostic

`.github/workflows/actions-runner-diagnostic.yml`

Agora é `workflow_dispatch` only.

Motivo: o diagnóstico já cumpriu seu papel e não deve criar dois jobs falhos em toda nova PR enquanto o problema externo persistir.

### Cubo HNK CI

`.github/workflows/ci.yml`

Continua executando em PR e push para `main`, mas também aceita `workflow_dispatch` para recuperação manual.

Controles adicionais:

- `permissions: contents: read`;
- `concurrency` por workflow/ref;
- `cancel-in-progress: true`;
- timeout de 20 minutos no job `validate`.

## Sequência depois da correção da conta/plataforma

1. No GitHub, executar manualmente `Actions Runner Diagnostic`.
2. Confirmar que pelo menos um probe chega ao shell step e mostra `HOC_ACTIONS_RUNNER_PROBE=REACHED`.
3. Preferencialmente confirmar Ubuntu e Windows.
4. Somente depois executar manualmente `Cubo HNK CI`.
5. Confirmar steps reais: checkout, pnpm setup, Node setup, install, check e web build.
6. Se CI passar, preservar run/job IDs como evidência.
7. Atualizar Issue #6 com a resolução observada.
8. Atualizar `AUDIT_STATUS.json` apenas depois da evidência executada.
9. Importar evidências suplementares de Independent Executor / Deployment no Evidence Ledger, sem substituí-las pelo CI.

## Se o probe continuar falhando

Não alterar código HOC nem dependências com base nesse resultado.

Verificar na conta GitHub:

- Actions policy / allowed actions and runners;
- Billing, Budgets and Actions spending controls;
- restrições de conta/organização;
- hosted-runner entitlement/provisioning.

Se essas configurações estiverem normais, encaminhar `docs/GITHUB_ACTIONS_SUPPORT_PACKET.md` ao GitHub Support.

## Governança

A existência de `workflow_dispatch` não autoriza merge ou stable.

A recuperação só fecha o gate oficial quando o workflow realmente executar os steps requeridos e o resultado puder ser auditado.
