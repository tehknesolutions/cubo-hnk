# HOC V1.0 RC1 — Matriz de Protocolos e Compatibilidade

Status do documento: **RELEASE CANDIDATE**  
Release: `1.0.0-rc.1`

A RC1 consolida protocolos já existentes. Ela **não renumera** contratos históricos e não promove conteúdo HNK candidato a cânone.

## 1. Cadeia oficial

### STATE

`HOC-FACELET-SCAN-V1 → HOC-CUBE-LEGALITY/V0.8 → HNK-ORACULUM-CUBE/V0.4 → Interpretation V0.5 → HOC-SESSION-MANIFEST/V0.10`

### RITUAL_32

`HOC-FACELET-SCAN-V1 → HOC-CUBE-LEGALITY/V0.8 → HOC-RITUAL-INTEGRITY/V0.9 → HNK-ORACULUM-CUBE/V0.4 → Interpretation V0.5 → HOC-SESSION-MANIFEST/V0.10`

## 2. Tabela de responsabilidades

| Camada | Versão congelada na RC1 | Entra no seed RAW? | Pode bloquear antes do RAW? | Pode alterar significado RAW? |
|---|---|---:|---:|---:|
| Captura física | `HOC-FACELET-SCAN-V1` | Indiretamente, via estado final | Sim, se incompleta | Não |
| Legalidade 3×3 | `HOC-CUBE-LEGALITY/V0.8` | Não | Sim | Não |
| Integridade ritual | `HOC-RITUAL-INTEGRITY/V0.9` | Não; os moves já pertencem ao commit V0.4 | Sim, só em `RITUAL_32` | Não |
| RAW/HOC-256 | `HNK-ORACULUM-CUBE/V0.4` | É o próprio seed | — | Autoridade RAW |
| Interpretação | `0.5.0-candidate` | Não | Não | Não; somente interpreta |
| Manifesto | `HOC-SESSION-MANIFEST/V0.10` | Não | Não | Não; somente registra/verifica |
| JSON canônico | `HOC-CANONICAL-JSON/V1` | Não | Não | Não |

## 3. Compatibilidade por modo

### STATE

Obrigatório:
- intenção canônica;
- estado final com 54 dígitos;
- V0.8 válido.

Não usado:
- estado inicial;
- V0.9;
- lista de 32 movimentos.

### RITUAL_32

Obrigatório:
- intenção canônica;
- estado inicial válido;
- exatamente 32 movimentos Singmaster aceitos;
- estado final válido;
- V0.9 confirmando `initial + moves = final`.

O estado inicial é dado de auditoria física e **não entra** no `ORACLE_COMMIT` V0.4.

## 4. Compatibilidade HNK40

A RC1 consome identidade estrutural G01–G40 com:

- status: `PREPRODUCTION_NOT_OFFICIAL`;
- glyph-set SHA-256: `78668df0f707952b7c280de52526abaa2b7900597fb8ff362a3a08641fd1bce5`;
- seleção RAW de G-ID preservada;
- semântica oracular HNK40 continua authored-candidate;
- nenhuma ponte automática G-ID ↔ letra hebraica, Tarot, planeta, elemento, sefirah ou significado linguístico.

## 5. Perfis e tradição histórica

A RC1 mantém a fronteira de provenance:

- Sefer Yetzirah não é tratado como sinônimo de Kabbalah posterior;
- Kabbalah judaica posterior permanece distinta de Hermetic Qabalah;
- Golden Dawn/Tarot são profiles históricos específicos;
- I Ching usa linhas de baixo para cima e mantém King Wen separado de índice computacional;
- Tria Prima permanece perfil alquímico específico;
- pontes HNK são marcadas como authored, candidate ou profile-bound conforme o caso.

## 6. Invariantes de compatibilidade

Durante toda a RC1 devem permanecer verdadeiros:

1. `ORACULUM_PROTOCOL === HNK-ORACULUM-CUBE/V0.4`;
2. o vetor STATE oficial continua produzindo `df6bcd1b...e3b6fc`;
3. profiles não entram no SHA-256 RAW;
4. V0.8 não modifica o estado antes de `runOracle`;
5. V0.9 apenas valida a sequência física e não injeta o estado inicial no hash;
6. V0.10 é downstream e recalculável;
7. câmera permanece assistiva e exige revisão humana;
8. HNK40 candidate semantics não são promovidas implicitamente.

## 7. Política de breaking change

Qualquer mudança que altere um dos itens abaixo exige novo protocolo/versionamento explícito e novos vetores dourados:

- serialização `ORACLE_COMMIT`;
- ordem U/R/F/D/L/B;
- orientação interna das nove casas por face;
- mapa B000–B255;
- rejection sampling;
- matriz King Wen;
- ordem computacional dos campos RAW;
- algoritmo de movimentos físicos V0.9;
- canonicalização V0.10;
- regras que definem o checksum do manifesto.

Mudanças de UI, texto explicativo ou metadata não hasheada podem ser compatíveis desde que não alterem os contratos acima.
