# HNK Oraculum Cube — Manual Operacional Consolidado V1.0 RC1

Release: `HOC-V1.0-RC1`  
Pacote: `1.0.0-rc.1`  
Status: `RELEASE_CANDIDATE` — não `STABLE`, não `HNK_CANON`.

Este documento consolida o manual operacional original e os addenda V0.8, V0.9 e V0.10. Os documentos anteriores permanecem no repositório como histórico técnico, mas este é o manual Markdown de referência para a RC1.

## 1. Propósito e fronteira de uso

O HNK Oraculum Cube (HOC) é um protocolo simbólico/computacional que combina um cubo físico 3×3 com uma cadeia determinística de captura, validação, hashing, decoding e interpretação governada por profiles.

Pipeline consolidado:

`INTENÇÃO → CUBO REAL → SCAN V1 → LEGALITY V0.8 → RITUAL V0.9 (quando aplicável) → RAW V0.4 → INTERPRETATION V0.5 → MALKUTH → SESSION MANIFEST V0.10`

O mesmo input canônico produz o mesmo RAW. Profiles interpretativos não podem alterar o seed bruto.

O HOC deve ser usado como instrumento simbólico/contemplativo e de reflexão/decisão. Ele não afirma previsão sobrenatural infalível, não substitui evidência, responsabilidade pessoal, orientação profissional ou discernimento espiritual.

No contexto HNK cristão, preserve a distinção entre contemplação simbólica e alegações de revelação sobrenatural garantida.

## 2. Protocolos congelados na RC1

- Scan físico: `HOC-FACELET-SCAN-V1`
- RAW: `HNK-ORACULUM-CUBE/V0.4`
- Interpretation: `0.5.0-candidate`
- Legality: `HOC-CUBE-LEGALITY/V0.8`
- Ritual integrity: `HOC-RITUAL-INTEGRITY/V0.9`
- Session Manifest: `HOC-SESSION-MANIFEST/V0.10`
- Canonical JSON: `HOC-CANONICAL-JSON/V1`
- Runtime Self-Test: `HOC-RC1-RUNTIME-SELFTEST/V1`
- Evidence Ledger: `HOC-RC1-EVIDENCE-LEDGER/V1`

A RC1 congela esses contratos; ela não os renumera e não promove semântica candidata HNK para cânone.

## 3. Material necessário

Para consulta manual:

- um cubo 3×3 funcional;
- a interface HOC ou ficha de registro;
- uma intenção/pergunta curta;
- no modo `RITUAL_32`, registro exato de 32 movimentos.

Para captura assistida:

- navegador em secure context;
- câmera compatível;
- revisão humana obrigatória das 54 casas.

Para QA de release:

- acesso ao hub `/oraculum/qa`;
- cubo físico real;
- ao menos dois ambientes/dispositivos para cross-device;
- arquivos JSON de evidência quando aplicável.

## 4. Preparação e orientação do cubo

1. Defina uma face como U (Up).
2. Mantendo U fixa, defina F (Front).
3. As demais faces ficam determinadas fisicamente: R, B, L e D.
4. Mapeie os centros canônicos:
   - U = 0
   - R = 1
   - F = 2
   - D = 3
   - L = 4
   - B = 5
5. O nome da cor é metadata visual; o dígito é o valor serializado.

Não altere U/F no meio de uma leitura ou ritual.

## 5. Intenção / Alef

A intenção é normalizada por Unicode NFKC, trim e colapso de espaços. O caractere `|` é reservado pelo protocolo e não deve aparecer na intenção.

Exemplo oficial do vetor dourado:

`Qual padrão precisa se manifestar?`

Evite perguntas compostas e registre a intenção antes do hashing.

## 6. Modos de consulta

### 6.1 STATE

Use quando a consulta depende da intenção + estado final do cubo.

`MOVES = NULL`

Após a transcrição, o estado precisa passar por V0.8 antes do RAW.

### 6.2 RITUAL_32

Use quando a consulta incorpora uma sequência física deliberada de exatamente 32 movimentos.

Tokens aceitos:

`U U' U2 R R' R2 F F' F2 D D' D2 L L' L2 B B' B2`

Não são aceitos x/y/z, slices M/E/S ou wide moves.

No `RITUAL_32`, o sistema precisa conhecer:

- estado inicial;
- 32 movimentos na ordem exata;
- estado final observado.

A V0.9 prova:

`INITIAL + 32 MOVES = EXPECTED FINAL = REPORTED FINAL`

Somente depois disso o RAW é calculado.

## 7. HOC-FACELET-SCAN-V1

A ordem das faces é fixa:

`U → R → F → D → L → B`

Em cada face, leia:

`1 2 3`

`4 5 6`

`7 8 9`

sempre da esquerda para a direita e de cima para baixo.

Orientação física:

- F/R/L/B: U fisicamente para cima;
- U: vista de cima, com a borda F na parte inferior do campo visual;
- D: vista de baixo, com a borda F na parte superior do campo visual.

Ao final são 54 dígitos. Cada dígito 0–5 deve ocorrer exatamente 9 vezes, mas 9/9 não prova legalidade mecânica.

## 8. Camera Assist V0.7

A câmera é opcional e não possui autoridade protocolar independente.

Fluxo:

1. capture U/R/F/D/L/B na orientação canônica;
2. o sistema amostra 9 regiões RGB por face;
3. os 6 centros tornam-se protótipos cromáticos;
4. cada casa recebe uma classificação candidata;
5. baixa confiança é sinalizada;
6. o operador corrige manualmente quando necessário;
7. o operador confirma que revisou todas as 54 casas;
8. somente a transcrição final revisada segue para V0.8.

As imagens não fazem parte do RAW. O QA de câmera da RC1 também evita persistir imagens, `deviceId` e localização.

## 9. Legality V0.8

Depois da transcrição, execute:

`HOC-CUBE-LEGALITY/V0.8`

O gate verifica:

- formato 54;
- nove ocorrências de cada dígito;
- centros corretos;
- 8 cantos válidos e únicos;
- 12 arestas válidas e únicas;
- soma de orientação dos cantos `≡ 0 mod 3`;
- soma de orientação das arestas `≡ 0 mod 2`;
- paridade de cantos = paridade de arestas.

Erros principais:

- `CENTER_MISMATCH`
- `UNKNOWN_CORNER`
- `DUPLICATE_CORNER`
- `UNKNOWN_EDGE`
- `DUPLICATE_EDGE`
- `CORNER_TWIST_SUM`
- `EDGE_FLIP_SUM`
- `PERMUTATION_PARITY_MISMATCH`

Se V0.8 falhar, não gere SHA. Volte à captura/transcrição. Não “corrija” o cubo com base em significado simbólico.

Legalidade mecânica significa somente que o estado é alcançável num cubo 3×3 montado corretamente; não significa validade espiritual da leitura.

## 10. Ritual Integrity V0.9

Esta camada é usada apenas em `RITUAL_32`.

Procedimento:

1. capture/transcreva o estado inicial;
2. revise as 54 casas;
3. fixe o snapshot inicial;
4. execute exatamente os 32 movimentos registrados;
5. preserve a orientação U/F original;
6. capture/transcreva o estado final;
7. revise novamente as 54 casas;
8. execute a V0.8 no estado final;
9. execute a V0.9.

Se houver divergência, o sistema deve bloquear antes do RAW e pode apontar face/casa esperada versus observada.

O estado inicial existe para auditoria física e não entra no commit RAW V0.4.

## 11. RAW V0.4 e seed

Protocolo:

`HNK-ORACULUM-CUBE/V0.4`

Commit STATE:

`HNK-ORACULUM-CUBE/V0.4|STATE|INTENT|CUBE_STATE|NULL`

Commit RITUAL_32:

`HNK-ORACULUM-CUBE/V0.4|RITUAL_32|INTENT|FINAL_STATE|MOVE_SEQUENCE`

Seed:

`SHA256(RAW_COMMIT)`

O profile interpretativo não participa do seed.

## 12. Mapa HOC-256

- B000–B011: I Ching, seis linhas × 2 bits;
- B012–B016: Path-32;
- B017–B022: HNK G01–G40 via rejection sampling;
- B023–B029: Tarot 1–78 via rejection sampling;
- B030–B033: zodíaco;
- B034–B036: planetas clássicos;
- B037–B038: elemento bruto;
- B039–B040: Tria Prima;
- B041–B042: fase alquímica;
- B043–B050: numerologia 1–256;
- B051–B074: cores RGB;
- B075–B079: síntese reservada;
- B080–B127: derivation reservoir;
- B128–B255: sigilo de 16 pontos.

Campos cujo espaço não é potência de dois usam rejection sampling, nunca redução por módulo.

## 13. I Ching

Cada linha usa 2 bits:

- `00` Yin mutável;
- `01` Yin estável;
- `10` Yang estável;
- `11` Yang mutável.

As linhas são lidas de baixo para cima. Linhas 1–3 formam o trigrama inferior; linhas 4–6, o superior. Linhas mutáveis geram o hexagrama resultante.

Índice binário e King Wen são campos distintos.

## 14. Path-32 e separação histórica

O Path-32 retorna 1–32.

A arquitetura deve distinguir:

- Sefer Yetzirah histórico;
- Kabbalah judaica posterior;
- Hermetic Qabalah;
- correspondências Golden Dawn/profile;
- pontes HNK authored-candidate.

Não apresente correspondências herméticas tardias como se fossem texto original do Sefer Yetzirah.

## 15. HNK40

O RAW seleciona uma identidade G01–G40.

Essa seleção não cria automaticamente equivalência com Tarot, planeta, elemento, letra hebraica, sefirah ou qualquer outro sistema.

A identidade estrutural HNK40 da RC1 permanece:

`PREPRODUCTION_NOT_OFFICIAL`

Hash congelado do glyph-set:

`78668df0f707952b7c280de52526abaa2b7900597fb8ff362a3a08641fd1bce5`

A RC1 não promove esse status para `HNK_CANON`.

## 16. Tarot, astrologia e alquimia

Esses sistemas pertencem a profiles com provenance próprio.

O runtime deve distinguir:

- dado RAW;
- correspondência source-verified;
- derivação do profile;
- síntese HNK authored-candidate.

Na RC1, a Tria Prima usa Mercury/Sulfur/Salt e a sequência Nigredo/Albedo/Citrinitas/Rubedo é profile-bound.

## 17. Cores

Os 24 bits de cor produzem:

- Essence = `#RRGGBB`;
- Shadow = complemento `0xFFFFFF XOR Essence`;
- Manifestation = rotação `(R,G,B) → (G,B,R)`.

As cores são outputs computacionais downstream do seed.

## 18. Sigilo

B128–B255 formam 16 bytes. Cada byte é dividido em dois nibbles 0–15, gerando um ponto `(x,y)` numa malha 16×16.

Os 16 pontos podem ser conectados em ordem. O sigilo é visual downstream e não altera o RAW.

## 19. Interpretation V0.5

A camada interpretativa consome o RAW sem alterá-lo.

Pesos estruturais:

- hit RAW direto: 3;
- correspondência independente: 2;
- derivação no mesmo profile: 1.

Convergência independente exige ao menos duas famílias independentes para a mesma chave em categorias elegíveis.

Na RC1, categorias primárias de convergência incluem:

- ELEMENT;
- PLANET;
- ZODIAC.

Tensões HNK configuradas:

- FIRE ↔ WATER;
- AIR ↔ EARTH.

Score não é probabilidade, verdade ou certeza sobrenatural.

## 20. Malkuth

A leitura termina em uma ação observável e verificável.

O gate Malkuth registra, entre outros:

- `dominantKey`;
- `actionTemplate`;
- `verificationRequired=true`.

Pergunta operacional recomendada:

`Como saberei que esta ação produziu resultado real?`

## 21. Session Manifest V0.10

O manifesto nasce somente depois dos gates físicos necessários e da interpretação.

STATE:

`SCAN → V0.8 → RAW V0.4 → V0.5 → MANIFEST V0.10`

RITUAL_32:

`SCAN → V0.8 → V0.9 → RAW V0.4 → V0.5 → MANIFEST V0.10`

Se V0.8 ou V0.9 falhar, não existe manifesto aprovado daquela tentativa.

Diferencie:

- `seed256`: identidade do RAW;
- `sessionId`: referência curta da sessão;
- `manifest checksum`: autenticação do registro completo.

Canonicalização:

`HOC-CANONICAL-JSON/V1`

Verificador:

`/oraculum/verify`

A verificação recalcula o checksum no servidor; não confia em um campo `valid` vindo do arquivo.

## 22. Vetor dourado STATE

Intenção:

`Qual padrão precisa se manifestar?`

Cubo resolvido:

`000000000111111111222222222333333333444444444555555555`

Seed oficial:

`df6bcd1bfd58288fb8f7d7e0f22b69d7e305a24429ba4445c242efc000e3b6fc`

Outputs congelados principais:

- Path 24;
- G39;
- Tarot 71;
- Sagittarius;
- Mars;
- Air;
- Salt;
- Citrinitas;
- numerologia 194;
- Essence `#447DC7`;
- Shadow `#BB8238`;
- Manifestation `#7DC744`;
- I Ching 30;
- linhas móveis 1/3/4;
- resultante 23;
- convergência dominante independente `ELEMENT:FIRE`.

## 23. Vetor dourado RITUAL_32

Inicial:

`000000000111111111222222222333333333444444444555555555`

Movimentos:

`U R F D L B U' R' F2 D2 L2 B2 U2 R2 F' D' L' B' U F R B L D U' F' R' B' L' D' U2 F2`

Final esperado:

`513004512451013254000425014533433235324540121221251340`

Esse vetor é usado no Physical QA. A interface de QA não deve revelar o estado final antes da transcrição física do operador.

## 24. Vetor dourado do Manifest

Fixture sintético congelado:

Checksum:

`e8510e6f8eb299ef57ecc2481d7ac5e3e4b0dd754284c2c5728d48febbb60041`

Session ID:

`HOC-E8510E6F8EB299EF57ECC248`

## 25. Runtime QA RC1

Hub:

`/oraculum/qa`

API:

`GET /api/oraculum/rc1-selftest`

O runtime self-test reproduz protocolos e vetores congelados dentro do Node runtime carregado.

Um PASS é evidência suplementar de consistência do runtime. Não substitui:

- instalação limpa;
- testes de repositório;
- typecheck;
- build Next.js;
- QA físico;
- QA de câmera;
- promoção humana.

## 26. Physical QA RC1

Wizard:

`/oraculum/qa/physical`

Casos:

- `STATE_SOLVED`;
- `RITUAL32_OFFICIAL`.

A API exige confirmação explícita de que a entrada foi transcrita de um cubo físico real.

O resultado pode ser exportado como `HOC-RC1-PHYSICAL-QA-EVIDENCE/V1`.

Essa evidência é operacional; não é assinatura criptográfica da release.

## 27. Camera / Device QA RC1

Painel:

`/oraculum/qa/camera`

O QA registra:

- secure context;
- suporte `getUserMedia`;
- permissão;
- dimensões do vídeo;
- seis faces capturadas;
- protótipos HEX;
- contagens candidatas;
- confiança média;
- células de baixa confiança;
- checklist humana do fluxo end-to-end.

PASS exige captura programática mínima + checklist humana completa.

O arquivo exportado é `HOC-RC1-CAMERA-QA-EVIDENCE/V1`.

## 28. Cross-device Manifest QA

Depois de verificar um manifesto válido em `/oraculum/verify`, o operador pode exportar:

`HOC-RC1-MANIFEST-VERIFY-EVIDENCE/V1`

A evidência contém somente a identidade verificada do manifesto e contexto básico do navegador/dispositivo.

Cross-device PASS exige duas evidências válidas com:

- mesmo `sessionId`;
- mesmo checksum;
- labels humanos de dispositivo distintos.

Labels são contexto declarado pelo operador, não identidade criptográfica de hardware.

## 29. Release Evidence Ledger

Painel:

`/oraculum/qa/evidence`

Protocolo:

`HOC-RC1-EVIDENCE-LEDGER/V1`

O ledger agrega, em memória local do navegador:

- Runtime QA;
- Physical STATE;
- Physical RITUAL_32;
- Camera QA;
- Manifest Verify cross-device.

A matriz mantém gates independentes:

- Runtime Self-Test;
- Physical STATE;
- Physical RITUAL_32;
- Camera / Device;
- Manifest Cross-Device;
- CI / Typecheck / Build;
- Manual final;
- Human V1.0 Approval.

Nenhum conjunto de evidências locais pode promover artificialmente o gate de CI/build.

## 30. CI / Build — estado RC1

Na criação deste manual, o GitHub Actions continua criando jobs `validate` que terminam com `steps=null` antes de executar checkout, install, test, typecheck ou build.

A condição está registrada na Issue #6.

Portanto:

- não chamar a RC1 de CI-green;
- não interpretar o status `failure` como falha de aplicação enquanto nenhum step tiver executado;
- V1.0 final continua bloqueada até existir evidência de execução real ou substituição formal do gate.

## 31. Bundle portátil RC1

Comando:

`pnpm bundle:rc1`

Saída esperada:

`dist/HOC-V1.0-RC1-QA/`

O bundle deve conter engine, testes, app, documentação, arquivos de release e `SHA256SUMS.txt`.

## 32. Critérios de promoção para V1.0

A RC1 só pode ser promovida quando houver evidência executada para, no mínimo:

1. instalação limpa;
2. `pnpm test`;
3. `pnpm typecheck`;
4. `pnpm check`;
5. build Next.js;
6. Physical STATE;
7. Physical RITUAL_32;
8. Camera QA mínimo ou câmera explicitamente experimental;
9. cross-device manifest verification;
10. documentação final reconciliada;
11. revisão humana explícita.

Até lá, o status permanece `RELEASE_CANDIDATE`.

## 33. Status documental

Este Markdown reconcilia:

- `MANUAL_CUBO_REAL.md`;
- `MANUAL_CUBO_REAL_V0.8_ADDENDUM.md`;
- `MANUAL_CUBO_REAL_V0.9_ADDENDUM.md`;
- `MANUAL_CUBO_REAL_V0.10_ADDENDUM.md`;
- `RC1_RUNTIME_SELFTEST.md`;
- `RC1_PHYSICAL_QA.md`;
- `RC1_CAMERA_QA.md`;
- `RC1_EVIDENCE_LEDGER.md`;
- `PROTOCOL_MATRIX_V1_RC1.md`.

O DOCX/PDF visual original ainda precisa ser regenerado/reconciliado antes de V1.0 final. Esta etapa não deve ser marcada como concluída apenas porque o Markdown foi consolidado.

## 34. Encerramento operacional

Ao terminar uma consulta válida, registre pelo menos:

- Session ID;
- checksum do manifesto;
- seed RAW;
- modo;
- intenção;
- G-ID;
- Path-32;
- I Ching primário/resultante;
- cores;
- ação Malkuth;
- critério verificável no mundo real.

Ao terminar uma rodada de QA, exporte apenas as evidências realmente observadas. Não marque checklist humana por inferência.

A RC1 existe para separar com clareza quatro coisas diferentes:

`IMPLEMENTADO ≠ INSTRUMENTADO ≠ EXECUTADO ≠ APROVADO`

Essa distinção deve permanecer até a promoção formal para HOC V1.0.