# HOC Cube Legality Engine — V0.8

Status: `HNK_AUTHORED_CANDIDATE_AWAITING_HUMAN_PROMOTION`

## Objetivo

`HOC-CUBE-LEGALITY/V0.8` valida se a transcrição de 54 facelets pode representar um estado mecanicamente alcançável de um cubo 3×3 real antes de permitir o hash HOC-256.

A legalidade é um **gate pré-RAW**. Ela não altera `HNK-ORACULUM-CUBE/V0.4`, não entra no SHA-256 e não modifica o vetor dourado.

Fluxo:

`CUBO REAL → HOC-FACELET-SCAN-V1 → LEGALITY V0.8 → RAW V0.4 → INTERPRETATION V0.5`

## Modelo físico

Face order e indexação seguem `HOC-FACELET-SCAN-V1`:

`U → R → F → D → L → B`

Cada face usa leitura 1..9, esquerda→direita e cima→baixo.

Centros canônicos:

- U5 = 0
- R5 = 1
- F5 = 2
- D5 = 3
- L5 = 4
- B5 = 5

## O que é validado

### 1. Formato

- exatamente 54 dígitos;
- somente `0..5`.

### 2. Cardinalidade cromática

Cada dígito deve ocorrer exatamente 9 vezes.

Isso é necessário, mas **não suficiente**.

### 3. Centros

Os seis centros devem preservar a calibração U/R/F/D/L/B.

### 4. Inventário de cubies

Os oito cantos devem existir exatamente uma vez:

`URF UFL ULB UBR DFR DLF DBL DRB`

As doze arestas devem existir exatamente uma vez:

`UR UF UL UB DR DF DL DB FR FL BL BR`

Combinações de cores inexistentes ou cubies duplicados falham fechado.

### 5. Orientação de cantos

A soma das orientações dos oito cantos deve satisfazer:

`Σ cornerOrientation ≡ 0 (mod 3)`

Logo, um único canto fisicamente torcido é impossível sem desmontagem.

Código de falha:

`CORNER_TWIST_SUM`

### 6. Orientação de arestas

A soma das orientações das doze arestas deve satisfazer:

`Σ edgeOrientation ≡ 0 (mod 2)`

Logo, uma única aresta invertida é impossível sem desmontagem.

Código de falha:

`EDGE_FLIP_SUM`

### 7. Paridade de permutação

A paridade da permutação dos cantos deve ser igual à das arestas:

`parity(corners) = parity(edges)`

Uma troca isolada de duas arestas ou dois cantos é mecanicamente impossível.

Código de falha:

`PERMUTATION_PARITY_MISMATCH`

## Códigos de erro

- `INVALID_FORMAT`
- `COLOR_COUNT`
- `CENTER_MISMATCH`
- `UNKNOWN_CORNER`
- `DUPLICATE_CORNER`
- `UNKNOWN_EDGE`
- `DUPLICATE_EDGE`
- `CORNER_TWIST_SUM`
- `EDGE_FLIP_SUM`
- `PERMUTATION_PARITY_MISMATCH`

## Comportamento da API

`POST /api/oraculum` executa a legalidade antes de `runOracle`.

Se `valid=false`:

- HTTP `422`;
- `ok=false`;
- nenhum SHA-256 oracular é calculado;
- o relatório `legality` retorna checks, invariantes, cubies e códigos de erro.

Se `valid=true`, o RAW V0.4 é processado normalmente.

## Vetores de teste

A suíte V0.8 trava:

1. cubo resolvido → válido;
2. giro legal de camada superior → válido;
3. uma aresta invertida com 9/9 cores → inválido;
4. um canto torcido → inválido;
5. troca ímpar de duas arestas → inválido;
6. centros calibrados incorretamente → inválido;
7. `assertCubeLegality` → fail-closed com relatório estruturado.

Os sete casos foram executados independentemente em Node e passaram `7/7` antes do commit da V0.8.

## Governança

O engine verifica mecânica de um cubo 3×3; ele não interpreta significado espiritual, não altera semântica HNK e não transforma legalidade física em validade divinatória.

Um cubo mecanicamente válido apenas habilita a próxima etapa do protocolo.
