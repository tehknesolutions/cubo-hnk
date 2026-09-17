# Addendum V0.10 — Registro e Verificação da Sessão

Este addendum complementa o Manual Operacional do Cubo Real.

## Quando o manifesto nasce

O manifesto só é criado depois que a consulta passa por todos os gates necessários.

STATE:

`SCAN → LEGALITY V0.8 → RAW V0.4 → INTERPRETATION V0.5 → MANIFEST V0.10`

RITUAL_32:

`SCAN → LEGALITY V0.8 → RITUAL V0.9 → RAW V0.4 → INTERPRETATION V0.5 → MANIFEST V0.10`

Se o cubo for fisicamente impossível ou o ritual não bater, não existe manifesto válido daquela tentativa.

## O que anotar no caderno físico

Ao encerrar uma consulta, registre pelo menos:

1. Session ID;
2. checksum SHA-256 do manifesto;
3. seed RAW V0.4;
4. modo STATE ou RITUAL_32;
5. pergunta/Alef;
6. G-ID HNK;
7. Path-32;
8. I Ching primário/resultante;
9. cores Essence / Shadow / Manifestation;
10. ação Malkuth escolhida.

Esses dados permitem localizar e comparar consultas sem depender apenas de memória subjetiva.

## Session ID versus seed

Não confunda:

- `seed256`: identidade do RAW oracular;
- `sessionId`: referência curta do registro completo;
- `manifest checksum`: autenticação criptográfica completa do registro.

Duas renderizações visuais do mesmo resultado podem mudar sem alterar o seed. Se o conteúdo auditável do manifesto mudar, o checksum muda.

## Como verificar um arquivo salvo

Abra:

`/oraculum/verify`

Depois:

1. escolha o arquivo `.json` ou cole seu conteúdo;
2. clique em `Recalcular checksum`;
3. confirme `MANIFESTO ÍNTEGRO`;
4. compare o Session ID com o que foi anotado na consulta.

Se aparecer `MANIFESTO ALTERADO OU INVÁLIDO`, não trate o arquivo como registro fiel da consulta original.

## O que pode causar falha de verificação

Qualquer alteração em campo auditado, por exemplo:

- trocar o G-ID;
- alterar uma casa do cubo;
- editar um movimento do ritual;
- mudar uma coordenada do sigilo;
- alterar uma convergência;
- substituir a ação Malkuth;
- editar a provenance;
- mudar o profile registrado.

Até uma alteração aparentemente pequena muda o SHA-256 do manifesto.

## O que fica fora da identidade criptográfica

Metadata contextual variável, como horário local, modelo do celular, nome do arquivo ou observações pessoais, deve ser mantida fora do core V0.10 se não fizer parte do protocolo.

Isso garante que a mesma consulta protocolar possa ser reproduzida em outra máquina e chegar à mesma identidade.

## Uso responsável

O manifesto prova que um registro não mudou segundo o protocolo computacional. Ele não transforma a interpretação simbólica em evidência sobrenatural ou científica. Use a leitura como ferramenta contemplativa e preserve os critérios de verificação no mundo real definidos em Malkuth.
