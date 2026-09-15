'use client';

import Link from 'next/link';
import { useMemo,useState } from 'react';
import styles from '../../oraculum.module.css';

type CaseId='STATE_SOLVED'|'RITUAL32_OFFICIAL';
type QaReport={
  version:string;
  releaseId:string;
  caseId:CaseId;
  passed:boolean;
  physicalTranscriptionConfirmed:boolean;
  expectedState:string;
  actualState:string;
  mismatches:Array<{index:number;face:string|null;cell:number;row:number;column:number;expected:string|null;actual:string|null}>;
  legality:any;
  ritualIntegrity?:any;
  rawAudit?:any;
  initialState?:string;
  moves?:string[];
};

const CASES:{id:CaseId;title:string;summary:string;instructions:string[]}[]=[
  {
    id:'STATE_SOLVED',
    title:'STATE · cubo resolvido',
    summary:'Prova a calibração física U/R/F/D/L/B, a transcrição de 54 casas, a legalidade V0.8 e o seed RAW dourado.',
    instructions:[
      'Use um cubo 3×3 fisicamente resolvido.',
      'Escolha U e F e preserve essa orientação durante toda a leitura.',
      'Mapeie os centros U/R/F/D/L/B para 0/1/2/3/4/5.',
      'Leia cada face esquerda→direita, cima→baixo, na ordem U R F D L B.',
      'Digite abaixo exatamente a transcrição observada no cubo real.',
    ],
  },
  {
    id:'RITUAL32_OFFICIAL',
    title:'RITUAL_32 · vetor físico oficial',
    summary:'Parte de um cubo resolvido, executa os 32 movimentos oficiais e compara a transcrição final com o simulador V0.9.',
    instructions:[
      'Comece com um cubo 3×3 fisicamente resolvido e a orientação U/F já definida.',
      'Execute os 32 movimentos abaixo exatamente na ordem, sem rotações x/y/z, slices ou wide moves.',
      'Não consulte o estado final esperado antes de terminar a transcrição.',
      'Após o 32º movimento, preserve a orientação original U/F.',
      'Leia U R F D L B e digite a transcrição final observada.',
    ],
  },
];

const RITUAL_MOVES=`U R F D L B U' R' F2 D2 L2 B2 U2 R2 F' D' L' B' U F R B L D U' F' R' B' L' D' U2 F2`;

function compact(value:string){return value.replace(/\s+/gu,'');}

export function PhysicalQaClient(){
  const[caseId,setCaseId]=useState<CaseId>('STATE_SOLVED');
  const[cubeState,setCubeState]=useState('');
  const[confirmed,setConfirmed]=useState(false);
  const[report,setReport]=useState<QaReport|null>(null);
  const[error,setError]=useState<string|null>(null);
  const[busy,setBusy]=useState(false);

  const selected=CASES.find(item=>item.id===caseId)!;
  const normalized=useMemo(()=>compact(cubeState),[cubeState]);

  function changeCase(next:CaseId){
    setCaseId(next);
    setCubeState('');
    setConfirmed(false);
    setReport(null);
    setError(null);
  }

  async function validate(){
    setBusy(true);setError(null);setReport(null);
    try{
      const response=await fetch('/api/oraculum/qa/physical',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({caseId,cubeState,physicalTranscriptionConfirmed:confirmed}),
      });
      const data=await response.json();
      if(data.report)setReport(data.report as QaReport);
      if(!data.report&&data.error)throw new Error(data.error);
    }catch(cause){
      setError(cause instanceof Error?cause.message:'Falha no QA físico.');
    }finally{setBusy(false);}
  }

  function downloadEvidence(){
    if(!report)return;
    const evidence={
      evidenceKind:'HOC-RC1-PHYSICAL-QA-EVIDENCE/V1',
      exportedAt:new Date().toISOString(),
      report,
      note:'Human-entered QA evidence. Not a cryptographic signature and not equivalent to CI/build approval.',
    };
    const blob=new Blob([JSON.stringify(evidence,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');
    anchor.href=url;
    anchor.download=`HOC-RC1-${report.caseId}-${report.passed?'PASS':'FAIL'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <main className={styles.shell}>
    <header className={styles.hero}>
      <div>
        <p className={styles.kicker}>HOC V1.0 RC1 · PHYSICAL QA</p>
        <h1>Wizard de validação com cubo real</h1>
        <p>Este fluxo testa a implementação contra um cubo 3×3 físico. Ele não gera uma nova leitura simbólica e não altera protocolos.</p>
        <p><Link href="/oraculum/qa">← runtime QA</Link> · <Link href="/oraculum">Oraculum →</Link></p>
      </div>
      <div className={styles.badge}>PHYSICAL-EVIDENCE</div>
    </header>

    <section className={styles.card}>
      <h2>1. Escolha o caso oficial</h2>
      <div className={styles.modeRow}>
        {CASES.map(item=><button type="button" key={item.id} className={caseId===item.id?styles.modeActive:''} onClick={()=>changeCase(item.id)}>{item.id==='STATE_SOLVED'?'STATE resolvido':'RITUAL_32 oficial'}</button>)}
      </div>
      <h3>{selected.title}</h3>
      <p>{selected.summary}</p>
      <ol>{selected.instructions.map(step=><li key={step}>{step}</li>)}</ol>
    </section>

    {caseId==='RITUAL32_OFFICIAL'&&<section className={styles.card}>
      <h2>2. Execute os 32 movimentos</h2>
      <pre className={styles.audit}>{RITUAL_MOVES}</pre>
      <p>Conte os tokens: são exatamente 32. Mantenha a referência U/F original após o último movimento.</p>
    </section>}

    <section className={styles.card}>
      <h2>{caseId==='RITUAL32_OFFICIAL'?'3':'2'}. Transcreva o cubo observado</h2>
      <p>Digite apenas 0–5; espaços e quebras de linha são ignorados. A sequência final deve possuir 54 dígitos em ordem U R F D L B.</p>
      <label className={styles.label}>Transcrição física<textarea rows={6} value={cubeState} onChange={event=>{setCubeState(event.target.value);setReport(null);}} placeholder="000000000 111111111 ..."/></label>
      <div className={normalized.length===54?styles.validState:styles.invalidState}>{normalized.length}/54 posições digitadas.</div>
      <label className={styles.label}><span><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/> Confirmo que esta sequência foi transcrita de um cubo físico real seguindo HOC-FACELET-SCAN-V1.</span></label>
      <button type="button" className={styles.submit} onClick={validate} disabled={busy}>{busy?'Validando…':'Validar evidência física'}</button>
      {error&&<p className={styles.error}>{error}</p>}
    </section>

    {report&&<section className={styles.results}>
      <div className={report.passed?styles.validState:styles.invalidState}>{report.passed?'✓ PHYSICAL QA PASS':'✗ PHYSICAL QA FAIL'}</div>
      <div className={styles.resultGrid}>
        <article className={styles.resultCard}><small>Release</small><strong>{report.releaseId}</strong></article>
        <article className={styles.resultCard}><small>Caso</small><strong>{report.caseId}</strong></article>
        <article className={styles.resultCard}><small>V0.8</small><strong>{report.legality?.valid?'PASS':'FAIL'}</strong></article>
        <article className={styles.resultCard}><small>Divergências</small><strong>{report.mismatches.length}</strong></article>
        {report.ritualIntegrity&&<article className={styles.resultCard}><small>V0.9</small><strong>{report.ritualIntegrity.valid?'PASS':'FAIL'}</strong></article>}
        {report.rawAudit&&<article className={styles.resultCard}><small>RAW seed</small><strong>{report.rawAudit.actualSeed256===report.rawAudit.expectedSeed256?'PASS':'FAIL'}</strong></article>}
      </div>

      {report.mismatches.length>0&&<article className={styles.card}>
        <h2>Casas divergentes</h2>
        <div className={styles.analysisGrid}>{report.mismatches.map(item=><div className={styles.analysisCard} key={`${item.index}-${item.actual}`}><strong>{item.face??'?'}{item.cell}</strong><p>linha {item.row}, coluna {item.column}</p><small>esperado {item.expected??'∅'} · observado {item.actual??'∅'}</small></div>)}</div>
      </article>}

      <details className={styles.details}><summary>Auditoria completa</summary><pre className={styles.audit}>{JSON.stringify(report,null,2)}</pre></details>
      <div className={styles.inlineActions}><button type="button" onClick={downloadEvidence}>Baixar evidência JSON</button></div>
      <p className={styles.disclaimer}>Este JSON registra uma declaração humana + resultado computacional. Não é assinatura criptográfica, não substitui CI/build e não promove automaticamente a RC1 para V1.0.</p>
    </section>}
  </main>;
}
