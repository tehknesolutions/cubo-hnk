'use client';

import Link from 'next/link';
import { useEffect,useMemo,useRef,useState } from 'react';
import { classifyRgb,rgbToHex,sampleNinePatches,type Rgb } from '../camera-color-utils.mjs';
import { ManifestActions } from '../ManifestActions';
import styles from '../oraculum.module.css';

const FACES=['U','R','F','D','L','B'] as const;
type Face=(typeof FACES)[number];
type Cell=number|null;
const COLORS=['#f5f5f2','#d94848','#34a853','#f2cf3a','#e8892f','#3f65d9'];
const SOLVED_STATE='000000000111111111222222222333333333444444444555555555';

function blank(){
  return FACES.reduce((acc,face,index)=>{
    const cells:Cell[]=Array(9).fill(null);
    cells[4]=index;
    acc[face]=cells;
    return acc;
  },{} as Record<Face,Cell[]>);
}

export function CameraConsultationClient(){
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const streamRef=useRef<MediaStream|null>(null);
  const[active,setActive]=useState<Face>('U');
  const[captures,setCaptures]=useState<Partial<Record<Face,ReadonlyArray<Rgb>>>>({});
  const[faces,setFaces]=useState<Record<Face,Cell[]>>(()=>blank());
  const[hex,setHex]=useState(COLORS);
  const[reviewed,setReviewed]=useState(false);
  const[intent,setIntent]=useState('');
  const[mode,setMode]=useState<'STATE'|'RITUAL_32'>('STATE');
  const[moves,setMoves]=useState('');
  const[initialCubeState,setInitialCubeState]=useState<string|null>(null);
  const[result,setResult]=useState<any>(null);
  const[error,setError]=useState<string|null>(null);
  const[running,setRunning]=useState(false);
  const[low,setLow]=useState<string[]>([]);

  useEffect(()=>()=>streamRef.current?.getTracks().forEach(track=>track.stop()),[]);

  const complete=FACES.every(face=>captures[face]?.length===9);
  const flat=useMemo(()=>FACES.flatMap(face=>faces[face]),[faces]);
  const counts=useMemo(()=>Array.from({length:6},(_,digit)=>flat.filter(value=>value===digit).length),[flat]);
  const balanced=flat.every(value=>value!==null)&&counts.every(count=>count===9);
  const moveCount=moves.trim()?moves.trim().split(/\s+/u).length:0;

  async function start(){
    setError(null);
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('Câmera indisponível; use /oraculum.');
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      streamRef.current?.getTracks().forEach(track=>track.stop());
      streamRef.current=stream;
      if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play();}
      setRunning(true);
    }catch(cause){
      setError(cause instanceof Error?cause.message:'Falha ao abrir câmera');
    }
  }

  function stop(){
    streamRef.current?.getTracks().forEach(track=>track.stop());
    streamRef.current=null;
    if(videoRef.current)videoRef.current.srcObject=null;
    setRunning(false);
  }

  function resetCapture(){
    setCaptures({});
    setFaces(blank());
    setReviewed(false);
    setLow([]);
    setActive('U');
  }

  function capture(){
    const video=videoRef.current;
    const canvas=canvasRef.current;
    if(!video||!canvas||!video.videoWidth)return setError('Câmera ainda não está pronta.');
    canvas.width=video.videoWidth;
    canvas.height=video.videoHeight;
    const context=canvas.getContext('2d',{willReadFrequently:true});
    if(!context)return;
    context.drawImage(video,0,0,canvas.width,canvas.height);
    const image=context.getImageData(0,0,canvas.width,canvas.height);
    setCaptures(current=>({...current,[active]:sampleNinePatches(image.data,image.width,image.height)}));
    const index=FACES.indexOf(active);
    if(FACES[index+1])setActive(FACES[index+1]);
    setReviewed(false);
  }

  function classify(){
    if(!complete)return;
    const prototypes=FACES.map(face=>captures[face]![4]);
    const warnings:string[]=[];
    const next=blank();
    FACES.forEach((face,faceIndex)=>{
      next[face]=captures[face]!.map((sample,cellIndex)=>{
        if(cellIndex===4)return faceIndex;
        const classified=classifyRgb(sample,prototypes);
        if(classified.confidence<.2)warnings.push(`${face}${cellIndex+1}`);
        return classified.bestDigit;
      });
    });
    setFaces(next);
    setHex(prototypes.map(rgbToHex));
    setLow(warnings);
    setReviewed(false);
  }

  function paint(face:Face,index:number,digit:number){
    if(index===4)return;
    setFaces(current=>({...current,[face]:current[face].map((value,i)=>i===index?digit:value)}));
    setReviewed(false);
  }

  function fixInitialFromCurrent(){
    setError(null);
    if(!balanced)return setError('O estado inicial precisa ter 54 casas e 9 de cada dígito.');
    if(!reviewed)return setError('Revise visualmente as 54 casas antes de fixar o estado inicial.');
    setInitialCubeState(flat.join(''));
    resetCapture();
  }

  async function submit(){
    setError(null);
    setResult(null);
    if(!balanced)return setError('A transcrição precisa ter 54 casas e 9 de cada dígito.');
    if(!reviewed)return setError('Confirme a revisão humana das 54 casas.');
    if(!intent.trim())return setError('Escreva a intenção/Alef.');
    if(mode==='RITUAL_32'&&!initialCubeState)return setError('RITUAL_32 exige estado inicial fixado.');
    if(mode==='RITUAL_32'&&moveCount!==32)return setError(`RITUAL_32 exige 32 movimentos; atual: ${moveCount}.`);
    try{
      const response=await fetch('/api/oraculum',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({
          intent,
          cubeState:flat.join(''),
          initialCubeState:mode==='RITUAL_32'?initialCubeState:undefined,
          mode,
          moves:mode==='RITUAL_32'?moves:undefined,
          profileId:'HNK_ORACULUM_DEFAULT_V1',
          includeResultingIChing:true,
        }),
      });
      const data=await response.json();
      setResult(data);
      if(!data.ok)throw new Error(data.error||'Falha na consulta');
    }catch(cause){
      setError(cause instanceof Error?cause.message:'Falha desconhecida');
    }
  }

  return <main className={styles.shell}>
    <header className={styles.hero}>
      <div><p className={styles.kicker}>V0.7 CÂMERA · V0.9 RITUAL · V0.10 MANIFEST</p><h1>Capture, corrija, confirme</h1><p>A câmera gera apenas um candidato. O hash só existe depois da revisão humana e dos gates físicos.</p><p><Link href="/oraculum">← voltar ao modo manual</Link> · <Link href="/oraculum/verify">verificar manifesto →</Link></p></div>
      <div className={styles.badge}>HUMAN-REVIEW-REQUIRED</div>
    </header>

    <section className={styles.card}>
      <div className={styles.modeRow}>
        <button type="button" className={mode==='STATE'?styles.modeActive:''} onClick={()=>setMode('STATE')}>STATE</button>
        <button type="button" className={mode==='RITUAL_32'?styles.modeActive:''} onClick={()=>setMode('RITUAL_32')}>RITUAL_32</button>
      </div>
      {mode==='RITUAL_32'&&<div className={styles.details}>
        <strong>Capture primeiro o estado inicial</strong>
        <p>Revise as 54 casas, fixe o snapshot inicial, execute fisicamente os 32 movimentos e então capture/revise o estado final.</p>
        <div className={styles.inlineActions}>
          <button type="button" disabled={!balanced||!reviewed} onClick={fixInitialFromCurrent}>Fixar revisão atual como inicial</button>
          <button type="button" onClick={()=>setInitialCubeState(SOLVED_STATE)}>Inicial = cubo resolvido</button>
          <button type="button" onClick={()=>setInitialCubeState(null)}>Limpar inicial</button>
        </div>
        <div className={initialCubeState?styles.validState:styles.invalidState}>{initialCubeState?'✓ Estado inicial V0.9 fixado.':'Estado inicial ainda não fixado.'}</div>
      </div>}
    </section>

    <section className={styles.card}>
      <div className={styles.inlineActions}>
        <button type="button" onClick={running?stop:start}>{running?'Desligar câmera':'Ativar câmera'}</button>
        <select value={active} onChange={event=>setActive(event.target.value as Face)}>{FACES.map(face=><option key={face}>{face}</option>)}</select>
        <button type="button" disabled={!running} onClick={capture}>Capturar {active}</button>
        <button type="button" disabled={!complete} onClick={classify}>Classificar 6 faces</button>
        <button type="button" onClick={resetCapture}>Limpar captura</button>
      </div>
      <video ref={videoRef} playsInline muted style={{width:'100%',maxHeight:520,objectFit:'cover',borderRadius:18,marginTop:16,background:'#050810'}}/>
      <canvas ref={canvasRef} hidden/>
      <p>{FACES.map(face=>`${face}:${captures[face]?'✓':'·'}`).join(' · ')}</p>
      {low.length>0&&<p className={styles.error}>Baixa confiança: {low.join(', ')} — revise manualmente.</p>}
    </section>

    <section className={styles.card}>
      <h2>Revisão das 54 casas</h2>
      <p>Toque numa casa móvel para ciclar 0→5. Centros permanecem fixos.</p>
      <div className={styles.faces}>{FACES.map((face,faceIndex)=><div className={styles.facePanel} key={face}>
        <div className={styles.faceTitle}><strong>{face}</strong><span>{counts[faceIndex]}/9</span></div>
        <div className={styles.faceGrid}>{faces[face].map((cell,index)=><button key={`${face}-${index}`} type="button" disabled={index===4} className={index===4?styles.centerSticker:styles.sticker} style={{background:cell===null?'#1a2232':hex[cell]}} onClick={()=>paint(face,index,cell===null?0:(cell+1)%6)}>{cell??'·'}</button>)}</div>
      </div>)}</div>
      <div className={balanced?styles.validState:styles.invalidState}>{balanced?'✓ 54/54 e 9 de cada dígito. A API ainda validará a mecânica 3×3.':`Contagens: ${counts.join(' · ')}`}</div>
      <label className={styles.label}><span><input type="checkbox" checked={reviewed} onChange={event=>setReviewed(event.target.checked)}/> Revisei visualmente todas as 54 casas e confirmo esta transcrição.</span></label>
      <label className={styles.label}>Intenção / Alef<textarea rows={3} value={intent} onChange={event=>setIntent(event.target.value)}/></label>
      {mode==='RITUAL_32'&&<label className={styles.label}>32 movimentos Singmaster · {moveCount}/32<textarea rows={4} value={moves} onChange={event=>setMoves(event.target.value)} placeholder="U R F2 L' ..."/></label>}
      <button className={styles.submit} type="button" onClick={submit}>Gerar consulta após revisão</button>
      {error&&<p className={styles.error}>{error}</p>}
    </section>

    {result&&!result.ok&&(result.legality||result.ritualIntegrity)&&<section className={styles.card}>
      <h2>Gate físico bloqueou a consulta</h2>
      <p>Nenhum SHA oracular ou manifesto V0.10 foi produzido para este envio.</p>
      <pre className={styles.audit}>{JSON.stringify({legality:result.legality,ritualIntegrity:result.ritualIntegrity},null,2)}</pre>
    </section>}

    {result?.raw&&<section className={styles.results}>
      <div className={styles.resultHero}><div><p className={styles.kicker}>RAW V0.4</p><h2>{result.raw.hnk.glyphId} · Path {result.raw.path32.index}</h2><p className={styles.hash}>{result.raw.raw.seed256}</p></div><div className={styles.colorTriad}><span style={{background:result.raw.colors.essence}}/><span style={{background:result.raw.colors.shadow}}/><span style={{background:result.raw.colors.manifestation}}/></div></div>
      {result.manifest&&<ManifestActions manifest={result.manifest}/>}
      {result.ritualIntegrity?.valid&&<div className={styles.validState}>✓ RITUAL_32 V0.9 confirmado fisicamente.</div>}
      <article className={styles.malkuth}><div><small>MALKUTH</small><h3>{result.interpretation?.malkuth?.dominantKey||'Sem dominante'}</h3></div><p>{result.interpretation?.malkuth?.actionTemplate}</p></article>
    </section>}
  </main>;
}
