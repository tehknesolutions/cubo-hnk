# HOC V1.0 RC1 — Independent Validation Runner

Protocol de evidência:

`HOC-RC1-INDEPENDENT-VALIDATION-EVIDENCE/V1`

Comando:

```bash
pnpm validate:rc1:independent
```

## Objetivo

Executar a cadeia de validação da RC1 em um executor real independente do GitHub Actions quando o runner oficial estiver indisponível.

Esse mecanismo produz evidência de execução real, mas **não substitui o gate GitHub CI** e não promove automaticamente V1.0, produção ou `HNK_CANON`.

## Sequência obrigatória

O runner executa em fail-closed:

1. `corepack pnpm --version`;
2. exige working tree Git limpa antes do install;
3. `pnpm install --frozen-lockfile`;
4. revalida que o install não alterou a working tree;
5. `pnpm test`;
6. `pnpm typecheck`;
7. `pnpm check`;
8. `pnpm --filter @hnk/cubo-web build`;
9. Runtime Self-Test `HOC-RC1-RUNTIME-SELFTEST/V1` diretamente pelo engine.

Se a árvore estiver suja, o install frozen falhar, o install alterar arquivos rastreados ou qualquer etapa obrigatória falhar, as etapas dependentes posteriores não são executadas e o processo termina com código diferente de zero.

## Compatibilidade de plataforma

O runner usa:

- `corepack.cmd` em Windows;
- `corepack` em Linux/macOS;
- `process.execPath` para o self-test Node.

Assim, o mesmo script pode ser executado no computador autorizado Windows ou em um executor Unix compatível.

## Artefato gerado

Saída:

`dist/rc1-validation/HOC-RC1-INDEPENDENT-VALIDATION-EVIDENCE.json`

O JSON inclui:

- `releaseId`;
- horário de execução;
- plataforma e arquitetura;
- versão Node;
- versão do pacote RC1;
- commit Git quando disponível;
- indicação de working tree limpa antes do install;
- indicação de working tree limpa imediatamente após o install;
- hashes SHA-256 dos dois snapshots de status Git;
- versão pnpm/corepack;
- comando executado;
- exit code;
- duração;
- SHA-256 de stdout/stderr;
- apenas tails limitados dos logs;
- resumo PASS/FAIL.

## Privacidade

O artefato não registra:

- caminho absoluto do diretório de trabalho;
- tokens GitHub;
- variáveis de ambiente completas;
- conteúdo do cubo ou manifesto por coleta automática;
- imagens;
- `deviceId`;
- geolocalização.

O nome do diretório do repositório pode ser registrado somente como contexto operacional básico.

## Autoridade

A evidência declara explicitamente:

`INDEPENDENT_EXECUTOR_EVIDENCE_NOT_GITHUB_CI`

E mantém:

```text
replacesGitHubCI = false
promotesStable = false
promotesHnkCanon = false
```

Portanto, mesmo um resultado PASS não altera sozinho:

`ciTypecheckBuild = BLOCKED`

quando a Issue #6 continuar impedindo execução do GitHub Actions.

## Estado reconciliado

A auditoria atual já preserva uma execução independente real anterior como:

```text
independentValidation = PASS / EXECUTED_RECONCILED
```

Essa evidência histórica foi executada em source/config head `74997fc18b4b4054b4f9a48068547acac8c50764` com o lockfile posteriormente rastreado byte-identicamente.

Ela **não** prova execução fresca do head atualmente landed. Esse gate permanece separado:

```text
freshTrackedHeadExecution = PENDING / NOT_EXECUTED
```

até uma nova execução limpa ocorrer no head-alvo atual.

## Interpretação de resultados

### PASS

Significa que, naquele executor e commit registrados, a árvore estava limpa, o install frozen não alterou o checkout e todas as etapas obrigatórias executaram com exit code 0, incluindo o Runtime Self-Test.

### FAIL

Significa que a árvore não estava limpa, o install frozen tentou divergir do lockfile, o install alterou o checkout, alguma etapa obrigatória falhou ou não pôde ser iniciada.

O arquivo de evidência deve ser preservado para investigação; FAIL não deve ser convertido em PASS manualmente.

### Instrumentação vs evidência

A mera existência deste script/documento prova apenas que o mecanismo está instrumentado.

A autoridade sobre o estado corrente vem dos artefatos de evidência efetivamente executados e do ledger de auditoria. A existência de uma evidência histórica PASS não deve ser confundida com fresh current-head PASS.

## Relação com a promoção V1.0

Uma evidência independente PASS pode provar que o código foi de fato instalado/testado/typechecked/buildado fora do runner defeituoso e pode ser usada como evidência suplementar na auditoria.

Ainda permanecem gates separados:

- GitHub CI;
- fresh current-head execution;
- Physical STATE;
- Physical RITUAL_32;
- Camera/Device QA;
- cross-device Manifest V0.10;
- hardening verificado no deployment;
- aprovação humana final.
