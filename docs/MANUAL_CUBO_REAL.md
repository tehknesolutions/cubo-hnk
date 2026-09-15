# Manual Operacional — HNK Oraculum Cube com Cubo Real

Versão do manual: 1.0  
Base técnica: CUBE40 V0.3 + RAW V0.4 + Interpretation V0.5 + Physical Surface V0.6 + Camera Assist V0.7.

## 1. O que é o HOC

O HNK Oraculum Cube (HOC-256) é um protocolo simbólico/computacional que transforma:

`ALEF / intenção → cubo físico → estado → SHA-256 → campos simbólicos → convergências/tensões → Malkuth`

O mesmo input canônico gera o mesmo RAW. Profiles interpretativos podem mudar a leitura, mas não podem mudar o seed bruto.

O sistema deve ser usado como instrumento simbólico/contemplativo e de tomada de decisão. Não afirma previsão sobrenatural infalível.

## 2. Material necessário

- um cubo 3×3 funcional;
- este aplicativo ou uma ficha de registro;
- opcionalmente câmera/webcam;
- uma pergunta/intenção curta e clara;
- no modo RITUAL_32, registro exato dos 32 movimentos.

## 3. Preparação

1. Coloque o cubo diante de você.
2. Defina qual centro será U (cima).
3. Mantendo U fixo, defina F (frente).
4. As demais faces ficam determinadas fisicamente: R, B, L e D.
5. Calibre os centros para os dígitos canônicos:
   - U=0
   - R=1
   - F=2
   - D=3
   - L=4
   - B=5
6. O nome da cor não entra no hash. O dígito entra.

## 4. Alef / intenção

A intenção é normalizada por Unicode NFKC, trim e colapso de espaços. Evite perguntas compostas. Não use o caractere `|`, reservado pelo protocolo.

Exemplo:

`Qual padrão precisa se manifestar?`

## 5. Modos

### STATE

Use quando a consulta depender da intenção + estado final do cubo.

`MOVE_SEQUENCE = NULL`

### RITUAL_32

Use quando quiser incorporar uma sequência física deliberada de exatamente 32 movimentos.

Movimentos aceitos no contrato V1:

`U U' U2 R R' R2 F F' F2 D D' D2 L L' L2 B B' B2`

Registre todos na ordem. O modo não aceita 31 nem 33 movimentos.

## 6. Como transcrever o cubo

Use `HOC-FACELET-SCAN-V1`.

Ordem das faces:

`U → R → F → D → L → B`

Em cada face, leia:

`1 2 3`
`4 5 6`
`7 8 9`

sempre esquerda → direita, cima → baixo.

Orientação:

- F/R/L/B: U fisicamente para cima;
- U: observe de cima, mantendo F na borda inferior do campo visual;
- D: observe de baixo, mantendo F na borda superior do campo visual.

Ao final você terá 54 dígitos. Cada um dos seis dígitos deve aparecer exatamente 9 vezes.

## 7. Uso da câmera

A câmera é opcional.

1. Capture U/R/F/D/L/B na orientação canônica.
2. O sistema amostra uma grade 3×3.
3. Os seis centros tornam-se protótipos cromáticos.
4. Cada sticker é classificado pela cor mais próxima.
5. Células de baixa confiança são sinalizadas.
6. Corrija manualmente qualquer célula.
7. Confirme explicitamente que revisou as 54 casas.
8. Só então o estado pode ser enviado ao SHA.

A imagem não possui autoridade oracular; apenas a transcrição humana final possui.

## 8. Commit e seed

O protocolo bruto é:

`HNK-ORACULUM-CUBE/V0.4`

Commit STATE:

`PROTOCOL | STATE | INTENT_CANONICAL | CUBE_STATE_BASE6 | NULL`

Commit RITUAL_32:

`PROTOCOL | RITUAL_32 | INTENT_CANONICAL | CUBE_STATE_BASE6 | MOVE_SEQUENCE`

O seed é:

`SHA-256(ORACLE_COMMIT)`

O profile não participa do seed.

## 9. Mapa dos 256 bits

- B000–B011: seis linhas do I Ching, 2 bits por linha;
- B012–B016: PATH32, 1–32;
- B017–B022: HNK40 G01–G40 via rejection sampling;
- B023–B029: Tarot 1–78 via rejection sampling;
- B030–B033: zodíaco 1–12;
- B034–B036: 7 planetas clássicos;
- B037–B038: elemento bruto;
- B039–B040: tria prima;
- B041–B042: fase alquímica;
- B043–B050: numerologia 1–256;
- B051–B074: ESSENCE_COLOR #RRGGBB;
- B075–B079: synthesis vector reservado;
- B080–B127: derivation reservoir;
- B128–B255: sigilo de 16 pontos em malha 16×16.

Seletores não potência-de-dois usam rejection sampling, nunca `% limite`.

## 10. I Ching

Por linha:

- `00` = Yin mutável;
- `01` = Yin estável;
- `10` = Yang estável;
- `11` = Yang mutável.

As linhas são numeradas de baixo para cima. Linhas 1–3 formam o trigrama inferior; 4–6, o superior. Linhas mutáveis geram o hexagrama resultante.

Índice binário e número King Wen são campos separados.

## 11. PATH32

O campo retorna 1–32.

No profile atual:

- 1–10 usam os nomes laterais/cabalísticos Keter → Malkuth;
- 11–32 correspondem às 22 letras no profile hermético selecionado.

Não confunda os nomes posteriores das sefirot com texto literal do Sefer Yetzirah.

## 12. HNK40

O RAW escolhe somente uma identidade G01–G40. A seleção não cria automaticamente Tarot, planeta, elemento, letra hebraica ou sefirah.

O registry authored-candidate CUBE40 fica separado e só pode ser consumido após promoção humana explícita.

## 13. Tarot / astrologia / alquimia

Tarot, atribuições herméticas, astrologia e alquimia pertencem a profiles com provenance próprio.

O motor deve distinguir:

- dado RAW;
- correspondência histórica/source-verified;
- profile;
- ponte HNK-authored.

Nunca tratar Golden Dawn como se fosse Sefer Yetzirah original.

## 14. HEX colors

Os 24 bits de cor geram:

- Essence = `#RRGGBB`;
- Shadow = complemento `0xFFFFFF XOR Essence`;
- Manifestation = rotação `(R,G,B) → (G,B,R)`.

As cores são outputs computacionais do seed.

## 15. Sigilo

B128–B255 formam 16 bytes. Cada byte vira um ponto `(x,y)` com dois nibbles 0–15. Os pontos P01→P16 podem ser conectados numa malha 16×16.

O sigilo é visual downstream. Ele não modifica o resultado RAW e não é prova de causalidade autônoma.

## 16. Convergências

Cada sinal guarda `family`, `sourceChainId`, `score`, `authority`, `origin` e `phase`.

Pontuação-base:

- hit RAW direto: 3;
- correspondência de sistema independente: 2;
- derivação dentro do mesmo profile: 1.

Sinais da mesma família/dependência não podem fingir independência. Exemplo: Li/Li em um mesmo hexagrama não conta como duas provas independentes de Fogo.

## 17. Tensões

O profile HNK atual testa explicitamente:

- FIRE ↔ WATER;
- AIR ↔ EARTH.

Tensão não significa erro. Indica polos simultaneamente ativos que precisam ser integrados ou testados.

## 18. Malkuth

A leitura termina em ação observável.

Contrato recomendado:

- 1 mensagem central;
- até 3 convergências;
- até 3 tensões/sombras;
- 3 ações possíveis;
- 1 pergunta de contemplação;
- 1 G-ID;
- 1 hexagrama;
- 1 sigilo;
- 1 tríade de cores;
- hash da consulta;
- critério de verificação no mundo real.

A pergunta final deve ser: `como saberei que a ação produziu resultado real?`

## 19. Vetor dourado de auditoria

Input:

- intenção: `Qual padrão precisa se manifestar?`
- cubo resolvido: `000000000111111111222222222333333333444444444555555555`
- modo: STATE

Seed esperado:

`df6bcd1bfd58288fb8f7d7e0f22b69d7e305a24429ba4445c242efc000e3b6fc`

Decoding esperado:

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
- I Ching 30, linhas móveis 1/3/4, resultante 23.

Interpretação V0.5 esperada:

- Nun → Death → Scorpio → Water;
- Seven of Pentacles → Earth;
- Sagittarius → Fire;
- Li/Li → Fire;
- convergência independente `ELEMENT:FIRE`, score 4, famílias `ASTROLOGY + ICHING`;
- tensões `FIRE<->WATER` e `AIR<->EARTH`.

## 20. Encerramento

Registre a leitura e escolha uma ação limitada e verificável. Não use o oráculo para substituir evidência, responsabilidade pessoal, orientação profissional ou discernimento espiritual. No contexto HNK cristão, preserve a distinção entre contemplação simbólica e afirmações de revelação sobrenatural garantida.
