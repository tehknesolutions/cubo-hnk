# HOC-RITUAL-INTEGRITY/V0.9

Status: `HNK_AUTHORED_CANDIDATE`

## Objetivo

V0.9 fecha a integridade física do modo `RITUAL_32`.

Até V0.8 o protocolo conseguia provar que o estado final era mecanicamente possível em um cubo 3×3, mas não conseguia provar que aquele estado era realmente o resultado dos 32 movimentos registrados.

A V0.9 adiciona a relação:

`ESTADO_INICIAL + 32 MOVIMENTOS SINGMASTER = ESTADO_FINAL`

Fluxo completo:

`CUBO REAL → SCAN V1 → LEGALITY V0.8 → RITUAL INTEGRITY V0.9 → RAW V0.4 → INTERPRETATION V0.5`

## Regra de compatibilidade

A V0.9 é um gate pré-RAW.

Ela **não altera**:

- `HNK-ORACULUM-CUBE/V0.4`;
- `ORACLE_COMMIT`;
- SHA-256;
- mapa B000–B255;
- HNK40;
- I Ching;
- Tarot;
- astrologia;
- alquimia;
- cores;
- sigilo;
- profiles de interpretação.

O estado inicial não entra no hash. Isso preserva a compatibilidade RAW existente.

Em um cubo físico, a sequência de movimentos é reversível; portanto, para um `estado final + sequência` coerente, o estado inicial é matematicamente determinado. A V0.9 usa a captura inicial apenas para provar que o ritual físico registrado é consistente.

## Notação aceita

Profile:

`SINGMASTER_FACE_TURNS_V1`

Movimentos:

- `U U' U2`
- `R R' R2`
- `F F' F2`
- `D D' D2`
- `L L' L2`
- `B B' B2`

Não entram no V1:

- rotações de cubo `x y z`;
- slices `M E S`;
- wide moves;
- notações alternativas.

`RITUAL_32` exige exatamente 32 tokens.

## Convenção geométrica

O simulador usa a mesma orientação congelada de `HOC-FACELET-SCAN-V1`.

Eixos:

- RIGHT = +X
- FRONT = +Y
- UP = +Z

Orientação visual das faces:

- F: U para cima;
- R: U para cima;
- L: U para cima;
- B: U para cima;
- U: F na borda inferior do campo visual;
- D: F na borda superior do campo visual.

Um movimento sem sufixo é 90° horário olhando diretamente para a face movida.

## Algoritmo

1. validar o estado inicial com `HOC-CUBE-LEGALITY/V0.8`;
2. validar o estado final com `HOC-CUBE-LEGALITY/V0.8`;
3. normalizar os 32 movimentos;
4. aplicar deterministicamente cada permutação de facelet ao estado inicial;
5. produzir `EXPECTED_FINAL_STATE`;
6. comparar os 54 facelets com o estado final informado;
7. se houver diferença, bloquear antes de `runOracle`;
8. se forem idênticos, liberar o RAW V0.4.

## Resultados de auditoria

O relatório contém:

- `version`;
- `notation`;
- `valid`;
- `integrityConfirmed`;
- `initialState`;
- `reportedFinalState`;
- `expectedFinalState`;
- `normalizedMoves`;
- `moveCount`;
- legalidade inicial;
- legalidade final;
- lista de facelets divergentes;
- erros estruturados.

Cada divergência informa:

- índice 0–53;
- face U/R/F/D/L/B;
- posição humana 1–9;
- linha/coluna;
- dígito esperado;
- dígito observado.

## Códigos fail-closed

- `INITIAL_STATE_REQUIRED`
- `MOVE_COUNT`
- `INVALID_MOVE`
- `INITIAL_STATE_ILLEGAL`
- `FINAL_STATE_ILLEGAL`
- `FINAL_STATE_MISMATCH`

## Contratos matemáticos do simulador

Para cada face `X ∈ {U,R,F,D,L,B}`:

`X⁴ = identidade`

`X X' = identidade`

`X2 = X X`

Para qualquer sequência S:

`S · inverse(S) = identidade`

Todo giro legal produzido pelo simulador deve continuar satisfazendo os invariantes mecânicos V0.8.

## API

No modo `STATE`, a V0.9 não é executada.

No modo `RITUAL_32`:

```text
POST /api/oraculum
  initialCubeState
  cubeState
  moves
  mode = RITUAL_32
```

Se a integridade falhar:

- HTTP 422;
- `raw` não é calculado;
- `interpretation` não é calculada;
- o relatório `ritualIntegrity` é devolvido.

Se passar:

- `runOracle` recebe o mesmo final state + moves já definidos no protocolo V0.4;
- a resposta inclui `ritualIntegrity.valid = true`.

## Câmera

A captura assistida mantém a regra humana:

1. capture e classifique o estado inicial;
2. revise manualmente 54 casas;
3. fixe o snapshot inicial;
4. execute os 32 movimentos;
5. capture o estado final;
6. revise novamente 54 casas;
7. envie para a V0.9;
8. somente depois o RAW pode ser produzido.

A classificação da câmera nunca substitui confirmação humana.

## Governança

A V0.9 prova somente consistência mecânica e procedimental.

Ela não prova:

- valor divinatório;
- causalidade espiritual;
- previsão sobrenatural;
- verdade teológica;
- promoção de qualquer correspondência a `HNK_CANON`.

O ritual pode ser usado como estrutura simbólica/contemplativa, mantendo a separação entre ação física verificável e interpretação simbólica.
