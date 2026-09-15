# HOC-FACELET-SCAN-V1

Contrato de transcrição de um cubo físico 3×3 para `CUBE_STATE_BASE6`.

## Faces e dígitos

A identidade das faces é determinada pelos centros do cubo físico:

- U → 0
- R → 1
- F → 2
- D → 3
- L → 4
- B → 5

A cor física de cada centro é metadata de calibração; o dado hasheado é o dígito 0–5.

## Ordem de serialização

`U → R → F → D → L → B`

Cada face fornece 9 dígitos. O estado final contém exatamente 54 dígitos.

## Ordem das 9 casas

Cada face é lida em 3 linhas, esquerda → direita e cima → baixo:

`1 2 3 / 4 5 6 / 7 8 9`

A casa 5 é o centro e deve coincidir com o dígito canônico da face.

## Convenção de observação

- F/R/L/B: mantenha U fisicamente para cima.
- U: observe de cima, com a borda adjacente a F voltada para baixo no campo visual.
- D: observe de baixo, com a borda adjacente a F voltada para cima no campo visual.

Não rotacione uma face arbitrariamente durante a transcrição.

## Validação cromática mínima

- regex: `^[0-5]{54}$`;
- cada dígito deve ocorrer exatamente 9 vezes;
- centros fixos em U4? Não: usando índice humano 1–9, o centro é posição 5 de cada face.

A validação 9/9 não prova que o estado é mecanicamente alcançável num cubo 3×3. A legalidade de cantos/arestas/paridade pertence ao futuro Cube Legality Engine.

## Câmera

Captura por câmera é assistiva. Classificação cromática produz somente um candidato. O usuário deve revisar e confirmar as 54 casas antes de qualquer SHA-256.
