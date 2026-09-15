'use client';

import Link from 'next/link';
import { useEffect,useMemo,useRef,useState } from 'react';
import { classifyRgb,rgbToHex,sampleNinePatches,type Rgb } from '../../camera-color-utils.mjs';
import styles from '../../oraculum.module.css';

const FACES=['U','R','F','D','L','B'] as const;
type Face=(typeof FACES)[number];
type Captures=Partial<Record<Face,ReadonlyArray<Rgb>>>;

type ManualKey='orientation'|'manualReview'|'reviewGate'|'stateFlow'|'ritualFlow'|'manifestFlow';
const MANUAL_ITEMS:{key:ManualKey;label:string}[]=[
  {key:'orientation',label:'Capturei U/R/F/D/L/B mantendo a orientação canônica HOC-FACELET-SCAN-V1.'},
  {key:'manualReview',label:'Confirmei no fluxo /oraculum/camera que uma classificação candidata pode ser corrigida manualmente antes do hash.'},
  {key:'reviewGate',label:'Confirmei que o fluxo /oraculum/camera não gera hash sem a revisão humana das 54 casas.'},
  {key:'stateFlow',label:'Executei um STATE via câmera e o estado revisado passou pela V0.8.'},
  {key:'ritualFlow',label:'Executei RITUAL_32 via câmera com revisão humana separada do estado inicial e final.'},
  {key:'manifestFlow',label:'Baixei um manifesto gerado pelo fluxo de câmera e consegui revalidá-lo em /oraculum/verify.'},
];

function blankManual(){
  return Object.fromEntries(MANUAL_ITEMS.map(item=>[item.key,false])) as Record<ManualKey,boolean>;
}

export function CameraQaClient(){
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const streamRef=useRef<MediaStream|null>(null);
  const[activeFace,setActiveFace]=useState<Face>('U');
  const[captures,setCaptures]=useState<Captures>({});
  const[running,setRunning]=useState(false);
  const[permission,setPermission]=useState<'NOT_REQUESTED'|'GRANTED'|'DENIED'|'ERROR'>('NOT_REQUESTED');
  const[videoSize,setVideoSize]=useState({width:0,height:0});
  const[error,setError]=useState<string|null>(null);
  const[manual,setManual]=useState<Record<ManualKey,boolean>>(()=>blankManual());

  useEffect(()=>()=>streamRef.current?.getTracks().forEach(track=>track.stop()),[]);

  const secureContext=typeof window==='undefined'?false:window.isSecureContext;
  const mediaSupported=typeof navigator!=='undefined'&&Boolean(navigator.mediaDevices?.getUserMedia);
  const complete=FACES.every(face=>captures[face]?.length===9);

  const classification=useMemo(()=>{
    if(!complete)return null;
    const prototypes=FACES.map(face=>captures[face]![4]);
    const warnings:string[]=[];
    const counts=Array(6).fill(0) as number[];
    const confidences:number[]=[];
    const classified=Object.fromEntries(FACES.map((face,faceIndex)=>{
      const cells=captures[face]!.map((sample,cellIndex)=>{
        if(cellIndex===4){counts[faceIndex]+=1;return {digit:faceIndex,confidence:1};}
        const result=classifyRgb(sample,prototypes);
        counts[result.bestDigit]+=1;
        confidences.push(result.confidence);
        if(result.confidence<.2)warnings.push(`${face}${cellIndex+1}`);
        return {digit:result.bestDigit,confidence:result.confidence};
      });
      return [face,cells];
    }));
    const prototypeHex=prototypes.map(rgbToHex);
    const averageConfidence=confidences.length?confidences.reduce((sum,value)=>sum+value,0)/confidences.length:0;
    return {prototypes,prototypeHex,warnings,counts,classified,averageConfidence,balanced:counts.every(count=>count===9)};
  },[captures,complete]);

  const capabilityPass=secureContext&&mediaSupported&&permission==='GRANTED'&&videoSize.width>0&&videoSize.height>0&&complete;
  const manualPass=MANUAL_ITEMS.every(item=>manual[item.key]);
  const fullQaPass=capabilityPass&&manualPass;

  async function startCamera(){
    setError(null);
    if(!navigator.mediaDevices?.getUserMedia){setPermission('ERROR');setError('getUserMedia não está disponível neste navegador/contexto.');return;}
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      streamRef.current?.getTracks().forEach(track=>track.stop());
      streamRef.current=stream;
      setPermission('GRANTED');
      if(videoRef.current){
        videoRef.current.srcObject=stream;
        await videoRef.current.play();
        setVideoSize({width:videoRef.current.videoWidth,height:videoRef.current.videoHeight});
      }
      setRunning(true);
    }catch(cause){
      setPermission(cause instanceof DOMException&&cause.name==='NotAllowedError'?'DENIED':'ERROR');
      setError(cause instanceof Error?cause.message:'Falha ao abrir câmera.');
    }
  }

  function stopCamera(){
    streamRef.current?.getTracks().forEach(track=>track.stop());
    streamRef.current=null;
    if(videoRef.current)videoRef.current.srcObject=null;
    setRunning(false);
  }

  function captureFace(){
    const video=videoRef.current;
    const canvas=canvasRef.current;
    if(!video||!canvas||!video.videoWidth){setError('O vídeo ainda não possui frame capturável.');return;}
    canvas.width=video.videoWidth;canvas.height=video.videoHeight;
    const context=canvas.getContext('2d',{willReadFrequently:true});
    if(!context){setError('Canvas 2D indisponível.');return;}
    context.drawImage(video,0,0,canvas.width,canvas.height);
    const image=context.getImageData(0,0,canvas.width,canvas.height);
    const samples=sampleNinePatches(image.data,image.width,image.height);
    setCaptures(current=>({...current,[activeFace]:samples}));
    const next=FACES[FACES.indexOf(activeFace)+1];
    if(next)setActiveFace(next);
  }

  function resetCaptures(){
    setCaptures({});setActiveFace('U');setManual(blankManual());
  }

  function toggleManual(key:ManualKey,checked:boolean){
    setManual(current=>({...current,[key]:checked}));
  }

  function downloadEvidence(){
    const evidence={
      evidenceKind:'HOC-RC1-CAMERA-QA-EVIDENCE/V1',
      exportedAt:new Date().toISOString(),
      releaseId:'HOC-V1.0-RC1',
      fullQaPass,
      capabilityPass,
      manualPass,
      environment:{
        secureContext,
        mediaSupported,
        permission,
        videoSize,
        viewport:typeof window==='undefined'?null:{width:window.innerWidth,height:window.innerHeight},
        userAgent:typeof navigator==='undefined'?null:navigator.userAgent,
      },
      capture:{
        faces:Object.fromEntries(FACES.map(face=>[face,Boolean(captures[face])])),
        prototypeHex:classification?.prototypeHex??null,
        counts:classification?.counts??null,
        balanced:classification?.balanced??null,
        lowConfidenceCells:classification?.warnings??null,
        averageConfidence:classification?.averageConfidence??null,
      },
      manualChecklist:manual,
      privacy:'No image bytes, device IDs, or location are included in this evidence file.',
      note:'Human/device QA evidence only. Not a cryptographic signature and not equivalent to CI/build approval.',
    };
    const blob=new Blob([JSON.stringify(evidence,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');anchor.href=url;anchor.download=`HOC-RC1-CAMERA-QA-${fullQaPass?'PASS':'INCOMPLETE'}.json`;anchor.click();URL.revokeObjectURL(url);
  }

  return <main className={styles.shell}>
    <header className={styles.hero}>
      <div>
        <p className={styles.kicker}>HOC V1.0 RC1 · CAMERA / DEVICE QA</p>
        <h1>Validação de câmera em dispositivo real</h1>
        <p>Registra capacidades reais do navegador, seis capturas 3×3 e uma checklist humana do fluxo câmera→revisão→gates→manifesto.</p>
        <p><Link href="/oraculum/qa">← runtime QA</Link> · <Link href="/oraculum/qa/physical">physical QA</Link> · <Link href="/oraculum/camera">fluxo câmera →</Link></p>
      </div>
      <div className={styles.badge}>NO IMAGE PERSISTENCE</div>
    </header>

    <section className={styles.card}>
      <h2>1. Ambiente</h2>
      <div className={styles.resultGrid}>
        <article className={styles.resultCard}><small>Secure context</small><strong>{secureContext?'PASS':'FAIL'}</strong></article>
        <article className={styles.resultCard}><small>getUserMedia</small><strong>{mediaSupported?'PASS':'FAIL'}</strong></article>
        <article className={styles.resultCard}><small>Permissão</small><strong>{permission}</strong></article>
        <article className={styles.resultCard}><small>Vídeo</small><strong>{videoSize.width&&videoSize.height?`${videoSize.width}×${videoSize.height}`:'—'}</strong></article>
      </div>
      <div className={styles.inlineActions}><button type="button" onClick={running?stopCamera:startCamera}>{running?'Desligar câmera':'Ativar câmera'}</button></div>
      {error&&<p className={styles.error}>{error}</p>}
    </section>

    <section className={styles.card}>
      <h2>2. Capture U/R/F/D/L/B</h2>
      <p>Mantenha a orientação oficial. As imagens não são armazenadas: apenas nove amostras RGB por face permanecem em memória nesta página.</p>
      <div className={styles.inlineActions}>
        <select value={activeFace} onChange={event=>setActiveFace(event.target.value as Face)}>{FACES.map(face=><option key={face}>{face}</option>)}</select>
        <button type="button" disabled={!running} onClick={captureFace}>Capturar {activeFace}</button>
        <button type="button" onClick={resetCaptures}>Limpar capturas</button>
      </div>
      <video ref={videoRef} playsInline muted style={{width:'100%',maxHeight:520,objectFit:'cover',borderRadius:18,marginTop:16,background:'#050810'}}/>
      <canvas ref={canvasRef} hidden/>
      <p>{FACES.map(face=>`${face}:${captures[face]?'✓':'·'}`).join(' · ')}</p>
    </section>

    {classification&&<section className={styles.card}>
      <h2>3. Diagnóstico cromático</h2>
      <div className={styles.resultGrid}>
        {FACES.map((face,index)=><article className={styles.resultCard} key={face}><small>{face} → {index}</small><strong>{classification.prototypeHex[index]}</strong></article>)}
        <article className={styles.resultCard}><small>Contagens candidatas</small><strong>{classification.counts.join('·')}</strong></article>
        <article className={styles.resultCard}><small>9/9 automático</small><strong>{classification.balanced?'PASS':'REVIEW'}</strong></article>
        <article className={styles.resultCard}><small>Confiança média</small><strong>{(classification.averageConfidence*100).toFixed(1)}%</strong></article>
        <article className={styles.resultCard}><small>Baixa confiança</small><strong>{classification.warnings.length}</strong></article>
      </div>
      {classification.warnings.length>0&&<p className={styles.error}>Revisão recomendada: {classification.warnings.join(', ')}</p>}
      <p>Um resultado automático diferente de 9/9 não é falha de protocolo; a câmera é candidata e o fluxo oficial exige correção humana antes do hash.</p>
    </section>}

    <section className={styles.card}>
      <h2>4. Checklist humana end-to-end</h2>
      <p>Marque somente itens realmente observados neste dispositivo. Alguns exigem abrir o fluxo <Link href="/oraculum/camera">/oraculum/camera</Link>.</p>
      {MANUAL_ITEMS.map(item=><label className={styles.label} key={item.key}><span><input type="checkbox" checked={manual[item.key]} onChange={event=>toggleManual(item.key,event.target.checked)}/> {item.label}</span></label>)}
    </section>

    <section className={styles.card}>
      <h2>5. Resultado de QA</h2>
      <div className={fullQaPass?styles.validState:styles.invalidState}>{fullQaPass?'✓ CAMERA QA PASS':'CAMERA QA INCOMPLETO'}</div>
      <div className={styles.resultGrid}>
        <article className={styles.resultCard}><small>Captura programática</small><strong>{capabilityPass?'PASS':'PENDING'}</strong></article>
        <article className={styles.resultCard}><small>Checklist humana</small><strong>{manualPass?'PASS':'PENDING'}</strong></article>
        <article className={styles.resultCard}><small>Faces</small><strong>{FACES.filter(face=>captures[face]).length}/6</strong></article>
      </div>
      <div className={styles.inlineActions}><button type="button" onClick={downloadEvidence}>Baixar evidência JSON</button></div>
      <p className={styles.disclaimer}>A evidência não contém imagens, device IDs ou localização. Ela não substitui CI/build e só deve ser marcada PASS quando os itens humanos tiverem sido realmente observados.</p>
    </section>
  </main>;
}
