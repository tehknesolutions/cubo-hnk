# Adendo do Manual — RITUAL_32 V0.9

Este adendo complementa `MANUAL_CUBO_REAL.md`.

## Quando usar

Use este procedimento somente no modo `RITUAL_32`.

No modo `STATE`, nada muda: apenas o estado final mecanicamente válido participa da consulta.

## Procedimento físico completo

1. Oriente o cubo por U/R/F/D/L/B.
2. Transcreva ou capture o **estado inicial** usando `HOC-FACELET-SCAN-V1`.
3. Revise as 54 casas.
4. Fixe o snapshot inicial na interface.
5. Declare a intenção/Alef.
6. Execute fisicamente exatamente 32 movimentos aceitos:
   `U R F D L B`, com sufixos opcionais `'` ou `2`.
7. Registre os movimentos na ordem exata em que foram realizados.
8. Sem redefinir U/F, transcreva ou capture o **estado final**.
9. Revise novamente as 54 casas.
10. Envie a consulta.

O sistema então executa:

`INITIAL → 32 MOVES → EXPECTED FINAL`

Se `EXPECTED FINAL` for diferente do estado observado, a consulta é bloqueada antes do SHA-256.

## Atalho: início resolvido

Se o cubo estiver comprovadamente resolvido antes do ritual, use:

`Inicial = cubo resolvido`

Estado canônico:

`000000000111111111222222222333333333444444444555555555`

Esse atalho não elimina a obrigação de registrar corretamente os 32 movimentos e revisar o estado final.

## O que fazer se houver FINAL_STATE_MISMATCH

Não tente ajustar o estado final apenas para fazer o sistema aceitar.

Verifique, nesta ordem:

1. se algum movimento foi esquecido;
2. se `X` e `X'` foram confundidos;
3. se `X2` foi registrado como um único token;
4. se U e F permaneceram fixos durante todo o ritual;
5. se alguma face foi transcrita rotacionada;
6. se a câmera classificou uma casa incorretamente;
7. se o estado inicial foi fixado antes do primeiro movimento.

O relatório V0.9 mostra os facelets que diferem entre o estado esperado e o observado.

## Relação com o hash

O estado inicial serve para auditoria física e **não entra no RAW V0.4**.

O commit continua sendo:

`HNK-ORACULUM-CUBE/V0.4 | RITUAL_32 | INTENT | FINAL_STATE | MOVE_SEQUENCE`

Logo, a V0.9 não quebra consultas V0.4 já registradas.

## Encerramento

Somente depois de:

- legalidade V0.8 = PASS;
- integridade ritual V0.9 = PASS;

é que o sistema gera o RAW HOC-256.

A validação física confirma consistência mecânica; ela não transforma a leitura simbólica em previsão sobrenatural garantida.
