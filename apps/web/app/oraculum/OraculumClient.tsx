'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { ManifestActions } from './ManifestActions';
import styles from './oraculum.module.css';

const FACE_ORDER=['U','R','F','D','L','B'] as const;
type Face=(typeof FACE_ORDER)[number];
type Cell=number|null;
type ResponseData={
  ok:boolean;
  error?:string;
  scanProfile?:string;
  legality?:any;
  ritualIntegrity?:any;
  raw?:any;
  interpretation?:any;
  manifest?:any;
};

const NAMES=['Branco','Vermelho','Verde','Amarelo','Laranja','Azul'];
const COLORS=['#f5f5f2','#d94848','#34a853','#f2cf3a','#e8892f','#3f65d9'];
const SOLVED_STATE='000000000111111111222222222333333333444444444555555555';

function blankCube(){
  return FACE_ORDER.reduce((acc,face,index)=>{
    const cells:Cell[]=Array(9).fill(null);
    cells[4]=index;
    acc[face]=cells;
    return acc;
  },{} as Record<Face,Cell[]>);
}

function solvedCube(){
  return FACE_ORDER.reduce((acc,face,index)=>{
    acc[face]=Array(9).fill(index);
    return acc;
  },{} as Record<Face,Cell[]>);
}

function descriptor(value:any){
  if(!value)return '—';
  if(value.type==='SEFIRAH')return `${value.path}. ${value.name}`;
  if(value.letter)return `${value.path}. ${value.letter}${value.tarot?` · ${value.tarot}`:''}`;
  if(value.kind==='MINOR')return `${value.rank} of ${value.suit}`;
  return value.tarot??value.name??'—';
}

export function OraculumClient(){
  const[intent,setIntent]=useState('');
  const[mode,setMode]=useState<'STATE'|'RITUAL_32'>('STATE');
  const[moves,setMoves]=useState('');
  const[initialCubeState,setInitialCubeState]=useState<string|null>(null);
  const[faces,setFaces]=useState<Record<Face,Cell[]>>(()=>blankCube());
  const[activeDigit,setActiveDigit]=useState(0);
  const[colorNames,setColorNames]=useState(NAMES);
  const[colorHex,setColorHex]=useState(COLORS);
  const[response,setResponse]=useState<ResponseData|null>(null);
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState<string|null>(null);

  const flat=useMemo(()=>FACE_ORDER.flatMap(face=>faces[face]),[faces]);
  const counts=useMemo(()=>Array.from({length:6},(_,digit)=>flat.filter(cell=>cell===digit).length),[flat]);
  const complete=flat.every(cell=>cell!==null);
  const balanced=counts.every(count=>count===9);
  const cubeState=complete?flat.join(''):'';
  const moveCount=moves.trim()?moves.trim().split(/\s+/u).length:0;

  function paint(face:Face,index:number){
    if(index===4)return;
    setFaces(current=>({...current,[face]:current[face].map((cell,i)=>i===index?activeDigit:cell)}));
  }

  function snapshotInitialState(){
    setError(null);
    if(!complete)return setError('Complete as 54 casas antes de fixar o estado inicial.');
    if(!balanced)return setError(`O estado inicial precisa ter 9 de cada dígito: ${counts.join(', ')}.`);
    setInitialCubeState(cubeState);
  }

  async function submit(event:FormEvent){
    event.preventDefault();
    setError(null);
    setResponse(null);
    if(!intent.trim())return setError('Escreva a intenção/Alef.');
    if(!complete)return setError('Complete as 54 casas.');
    if(!balanced)return setError(`Cada cor deve aparecer 9 vezes: ${counts.join(', ')}.`);
    if(mode==='RITUAL_32'&&!initialCubeState)return setError('RITUAL_32 exige que o estado inicial seja fixado antes dos movimentos.');
    if(mode==='RITUAL_32'&&moveCount!==32)return setError(`RITUAL_32 exige 32 movimentos; atual: ${moveCount}.`);

    setBusy(true);
    try{
      const request=await fetch('/api/oraculum',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({
          intent,
          cubeState,
          initialCubeState:mode==='RITUAL_32'?initialCubeState:undefined,
          mode,
          moves:mode==='RITUAL_32'?moves:undefined,
          profileId:'HNK_ORACULUM_DEFAULT_V1',
          includeResultingIChing:true,
        }),
      });
      const data=(await request.json()) as ResponseData;
      setResponse(data);
      if(!data.ok)throw new Error(data.error||'Falha na consulta');
    }catch(cause){
      setError(cause instanceof Error?cause.message:'Falha desconhecida');
    }finally{
      setBusy(false);
    }
  }

  const raw=response?.raw;
  const interpreted=response?.interpretation;

  return <main className={styles.shell}>
    <header className={styles.hero}>
      <div>
        <p className={styles.kicker}>HOC-256 · CUBO FÍSICO</p>
        <h1>HNK Oraculum Cube</h1>
        <p>Transcreva um cubo 3×3 real, valide a mecânica V0.8, preserve o RAW V0.4 e aplique a interpretação governada V0.5.</p>
        <p><Link href="/oraculum/camera">Abrir captura assistida por câmera →</Link> · <Link href="/oraculum/verify">Verificar manifesto →</Link></p>
      </div>
      <div className={styles.badge}>SCAN V1 · V0.8 · V0.9 · MANIFEST V0.10</div>
    </header>

    <form onSubmit={submit} className={styles.flow}>
      <section className={styles.card}>
        <div className={styles.step}><span>1</span><div><h2>Calibre pelos centros</h2><p>U/R/F/D/L/B viram os dígitos 0/1/2/3/4/5. Os nomes e HEX abaixo são apenas visuais.</p></div></div>
        <div className={styles.paletteGrid}>{FACE_ORDER.map((face,index)=><div className={styles.paletteCard} key={face}>
          <strong>{face} → {index}</strong>
          <input type="text" value={colorNames[index]} onChange={event=>setColorNames(current=>current.map((value,i)=>i===index?event.target.value:value))}/>
          <input type="color" value={colorHex[index]} onChange={event=>setColorHex(current=>current.map((value,i)=>i===index?event.target.value:value))}/>
          <small>{counts[index]}/9</small>
        </div>)}</div>
        <details className={styles.details}><summary>Orientação física</summary><p>F/R/L/B: mantenha U para cima. U: vista de cima com F embaixo. D: vista de baixo com F em cima. Leia cada face da esquerda para a direita e de cima para baixo.</p></details>
      </section>

      <section className={styles.card}>
        <div className={styles.step}><span>2</span><div><h2>Transcreva as 54 casas</h2><p>Escolha um dígito e toque nas casas correspondentes. Os seis centros ficam travados.</p></div></div>
        <div className={styles.paintPalette}>{FACE_ORDER.map((face,digit)=><button type="button" key={face} className={activeDigit===digit?styles.paintActive:styles.paintButton} onClick={()=>setActiveDigit(digit)}><i style={{background:colorHex[digit]}}/>{digit} · {colorNames[digit]}</button>)}</div>
        <div className={styles.faces}>{FACE_ORDER.map((face,faceIndex)=><div className={styles.facePanel} key={face}>
          <div className={styles.faceTitle}><strong>{face}</strong><span>centro {faceIndex}</span></div>
          <div className={styles.faceGrid}>{faces[face].map((cell,index)=><button type="button" disabled={index===4} onClick={()=>paint(face,index)} key={`${face}-${index}`} className={index===4?styles.centerSticker:styles.sticker} style={{background:cell===null?'#1a2232':colorHex[cell]}}>{cell??'·'}</button>)}</div>
        </div>)}</div>
        <div className={styles.inlineActions}>
          <button type="button" onClick={()=>setFaces(blankCube())}>Limpar</button>
          <button type="button" onClick={()=>setFaces(solvedCube())}>Cubo resolvido</button>
        </div>
        <div className={complete&&balanced?styles.validState:styles.invalidState}>{complete?(balanced?'✓ 54/54 e 9 de cada dígito. A API ainda validará a mecânica 3×3.':`Contagens: ${counts.join(' · ')}`):`Preenchidas ${flat.filter(cell=>cell!==null).length}/54.`}</div>
      </section>

      <section className={styles.card}>
        <div className={styles.step}><span>3</span><div><h2>Declare o Alef e o modo</h2><p>A intenção entra no commit RAW. O caractere “|” é reservado pelo protocolo.</p></div></div>
        <label className={styles.label}>Intenção / pergunta<textarea rows={3} value={intent} onChange={event=>setIntent(event.target.value)} placeholder="Qual padrão precisa se manifestar?"/></label>
        <div className={styles.modeRow}>
          <button type="button" className={mode==='STATE'?styles.modeActive:''} onClick={()=>setMode('STATE')}>STATE</button>
          <button type="button" className={mode==='RITUAL_32'?styles.modeActive:''} onClick={()=>setMode('RITUAL_32')}>RITUAL_32</button>
        </div>

        {mode==='RITUAL_32'&&<>
          <div className={styles.details}>
            <strong>V0.9 · Estado inicial obrigatório</strong>
            <p>Antes do primeiro movimento, transcreva o cubo nesta mesma grade e fixe uma cópia. Depois execute fisicamente os 32 movimentos e altere a grade para o estado final.</p>
            <div className={styles.inlineActions}>
              <button type="button" onClick={snapshotInitialState}>Fixar grade atual como inicial</button>
              <button type="button" onClick={()=>setInitialCubeState(SOLVED_STATE)}>Inicial = cubo resolvido</button>
              <button type="button" onClick={()=>setInitialCubeState(null)}>Limpar inicial</button>
            </div>
            <div className={initialCubeState?styles.validState:styles.invalidState}>{initialCubeState?'✓ Estado inicial fixado (54 casas).':'Estado inicial ainda não fixado.'}</div>
          </div>
          <label className={styles.label}>32 movimentos Singmaster · {moveCount}/32<textarea rows={4} value={moves} onChange={event=>setMoves(event.target.value)} placeholder="U R F2 L' ..."/></label>
        </>}

        <button className={styles.submit} disabled={busy}>{busy?'Validando e decodificando…':'Gerar consulta HOC-256'}</button>
        {error&&<p className={styles.error}>{error}</p>}
      </section>
    </form>

    {response&&!response.ok&&(response.legality||response.ritualIntegrity)&&<section className={styles.card}>
      <h2>Gate físico bloqueou a consulta</h2>
      <p>Nenhum SHA oracular ou manifesto V0.10 foi produzido para este envio.</p>
      <pre className={styles.audit}>{JSON.stringify({legality:response.legality,ritualIntegrity:response.ritualIntegrity},null,2)}</pre>
    </section>}

    {raw&&interpreted&&<section className={styles.results}>
      <div className={styles.resultHero}><div><p className={styles.kicker}>RAW V0.4 · IMUTÁVEL</p><h2>{raw.hnk.glyphId} · Path {raw.path32.index}</h2><p className={styles.hash}>{raw.raw.seed256}</p></div><div className={styles.colorTriad}><span style={{background:raw.colors.essence}}/><span style={{background:raw.colors.shadow}}/><span style={{background:raw.colors.manifestation}}/></div></div>
      {response?.manifest&&<ManifestActions manifest={response.manifest}/>}
      {response?.ritualIntegrity?.valid&&<div className={styles.validState}>✓ RITUAL_32 V0.9 confirmado: estado inicial + 32 movimentos = estado final.</div>}
      <div className={styles.resultGrid}>
        <article className={styles.resultCard}><small>Path-32</small><strong>{descriptor(interpreted.path)}</strong></article>
        <article className={styles.resultCard}><small>Tarot</small><strong>{descriptor(interpreted.tarot)}</strong><p>índice {raw.tarot.cardIndex}</p></article>
        <article className={styles.resultCard}><small>I Ching</small><strong>{raw.iching.primary.lowerTrigram.symbol} {raw.iching.primary.upperTrigram.symbol} · {raw.iching.primary.kingWen}</strong><p>linhas {raw.iching.movingLines.join(', ')||'nenhuma'} → {raw.iching.resulting.kingWen}</p></article>
        <article className={styles.resultCard}><small>Astrologia</small><strong>{raw.astrology.zodiac} · {raw.astrology.planet}</strong><p>{raw.astrology.element}</p></article>
        <article className={styles.resultCard}><small>Alquimia</small><strong>{raw.alchemy.principle}</strong><p>{raw.alchemy.phase}</p></article>
        <article className={styles.resultCard}><small>Numerologia</small><strong>{raw.numerology.raw}</strong><p>raiz {raw.numerology.digitalRoot} · hex {raw.numerology.hex}</p></article>
      </div>
      <div className={styles.analysisGrid}>
        <article className={styles.analysisCard}><h3>Convergências</h3>{interpreted.convergences.length?interpreted.convergences.map((item:any)=><div className={styles.signal} key={item.id}><strong>{item.id}</strong><span>{item.score}</span><small>{item.families.join(' + ')}</small></div>):<p>Nenhuma independente.</p>}</article>
        <article className={styles.analysisCard}><h3>Tensões</h3>{interpreted.tensions.length?interpreted.tensions.map((item:any)=><div className={styles.signal} key={item.axis}><strong>{item.axis}</strong><span>{item.left.score}:{item.right.score}</span><small>{item.authority}</small></div>):<p>Nenhuma ativa.</p>}</article>
      </div>
      <article className={styles.malkuth}><div><small>MALKUTH</small><h3>{interpreted.malkuth.dominantKey||'Sem dominante'}</h3></div><p>{interpreted.malkuth.actionTemplate}</p><strong>Verificação: {interpreted.malkuth.verificationRequired?'SIM':'NÃO'}</strong></article>
      <details className={styles.details}><summary>Auditoria técnica</summary><pre className={styles.audit}>{JSON.stringify({commit:raw.commit,scanProfile:response.scanProfile,legality:response.legality,ritualIntegrity:response.ritualIntegrity,manifestAudit:response.manifest?.audit,provenance:raw.provenance,signals:interpreted.signals},null,2)}</pre></details>
      <p className={styles.disclaimer}>Leitura simbólica/contemplativa; não afirma certeza sobrenatural ou previsão infalível.</p>
    </section>}
  </main>;
}
