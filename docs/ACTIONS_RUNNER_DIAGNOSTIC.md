# GitHub Actions Runner Diagnostic

Objetivo: isolar a Issue #6 de qualquer dependência do projeto.

Workflow:

`.github/workflows/actions-runner-diagnostic.yml`

O diagnóstico não faz checkout, não usa pnpm, Node setup, actions de terceiros, secrets nem arquivos do repositório durante os jobs.

Ele solicita somente dois runners GitHub-hosted:

- `ubuntu-latest`;
- `windows-latest`.

Cada job possui exatamente um step local de `echo`/`Write-Output`.

## Interpretação

### Se os steps executarem

O problema pode estar no workflow principal, setup de dependências ou ambiente específico e deve ser investigado a partir dos logs.

### Se os jobs também terminarem com `steps=null`

A falha ocorre antes do primeiro step e é independente de:

- `actions/checkout`;
- pnpm;
- Node;
- workspace/package.json;
- testes HOC;
- build Next.js;
- dependências externas do workflow.

Se Ubuntu e Windows apresentarem o mesmo sintoma, a evidência também reduz a plausibilidade de um problema exclusivo do label `ubuntu-latest`.

Esse diagnóstico não altera o produto nem serve como CI PASS. Seu único propósito é localizar a camada da falha de infraestrutura.
