# Adendo do Manual — V0.8 Cube Legality

Este adendo complementa `MANUAL_CUBO_REAL.md`.

## Novo passo obrigatório entre a transcrição e o hash

Após registrar as 54 casas e confirmar 9 ocorrências de cada dígito, **não gere ainda a consulta**.

Execute o gate:

`HOC-CUBE-LEGALITY/V0.8`

Fluxo atualizado:

`ALEF → CUBO REAL → 54 FACELETS → 9/9 → LEGALIDADE MECÂNICA → SHA-256 → RAW → INTERPRETAÇÃO → MALKUTH`

## Resultado válido

O relatório deve indicar simultaneamente:

- `format = true`
- `counts = true`
- `centers = true`
- `cubies = true`
- `cornerOrientation = true`
- `edgeOrientation = true`
- `parity = true`
- `valid = true`

Somente então o estado é enviado ao protocolo RAW V0.4.

## Se o relatório falhar

### `CENTER_MISMATCH`

Revise a calibração U/R/F/D/L/B e os seis centros.

### `UNKNOWN_CORNER` / `UNKNOWN_EDGE`

Há uma combinação de cores impossível ou uma transcrição incorreta. Revise as casas indicadas.

### `DUPLICATE_CORNER` / `DUPLICATE_EDGE`

Um cubie aparece duas vezes e outro desaparece. Em uso normal isso quase sempre indica erro de captura/transcrição.

### `CORNER_TWIST_SUM`

O estado equivale a um ou mais cantos com orientação global impossível. Um único canto torcido não pode surgir por movimentos legais de um 3×3 montado.

### `EDGE_FLIP_SUM`

O estado equivale a uma orientação global impossível de arestas. Uma única aresta invertida não pode surgir por movimentos legais.

### `PERMUTATION_PARITY_MISMATCH`

A paridade de cantos e arestas não coincide. Exemplo clássico: apenas duas arestas trocadas.

## O que fazer na prática

1. Não altere a pergunta/intenção.
2. Não tente “corrigir” o cubo por significado simbólico.
3. Volte à captura física.
4. Revise primeiro as peças indicadas pelo relatório.
5. Refaça a transcrição das faces envolvidas.
6. Rode novamente o gate.
7. Só gere o HOC-256 quando `valid=true`.

## Importante

Legalidade mecânica não significa “resposta espiritualmente correta”. Ela significa somente que a entrada representa um estado possível de um cubo físico real.

A V0.8 existe para impedir que erro de câmera, digitação ou orientação da face seja transformado silenciosamente em seed oracular.
