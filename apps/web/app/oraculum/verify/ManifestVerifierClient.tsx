'use client';

import Link from 'next/link';
import { ChangeEvent, useState } from 'react';
import styles from '../oraculum.module.css';

type VerifyResponse={
  ok:boolean;
  valid:boolean;
  manifestVersion?:string|null;
  sessionId?:string|null;
  checksum?:string|null;
  error?:string;
};

export function ManifestVerifierClient(){
  const[text,setText]=useState('');
  const[result,setResult]=useState<VerifyResponse|null>(null);
  const[deviceLabel,setDeviceLabel]=useState('');
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState<string|null>(null);

  async function loadFile(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];
    if(!file)return;
    setText(await file.text());
    setResult(null);
    setError(null);
  }

  async function verify(){
    setBusy(true);setError(null);setResult(null);
    try{
      const manifest=JSON.parse(text);
      const response=await fetch('/api/oraculum/manifest/verify',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({manifest}),
      });
      const data=(await response.json()) as VerifyResponse;
      setResult(data);
      if(!data.ok&&data.error)throw new Error(data.error);
    }catch(cause){
      setError(cause instanceof Error?cause.message:'Manifesto inválido');
    }finally{setBusy(false);}
  }

  function downloadVerificationEvidence(){
    if(!result)return;
    const label=deviceLabel.trim();
    if(!label){setError('Informe um label humano para este dispositivo antes de exportar a evidência.');return;}
    const evidence={
      evidenceKind:'HOC-RC1-MANIFEST-VERIFY-EVIDENCE/V1',
      exportedAt:new Date().toISOString(),
      releaseId:'HOC-V1.0-RC1',
      valid:result.valid,
      manifestVersion:result.manifestVersion??null,
      sessionId:result.sessionId??null,
      checksum:result.checksum??null,
      deviceLabel:label,
      environment:{
        secureContext:typeof window==='undefined'?false:window.isSecureContext,
        viewport:typeof window==='undefined'?null:{width:window.innerWidth,height:window.innerHeight},
        userAgent:typeof navigator==='undefined'?null:navigator.userAgent,
      },
      privacy:'No manifest body, image, deviceId, location, or hardware fingerprint is included.',
      note:'Operator-labeled verification evidence. Device label is a human QA declaration, not a cryptographic device identity.',
    };
    const blob=new Blob([JSON.stringify(evidence,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');
    anchor.href=url;
    anchor.download=`HOC-RC1-MANIFEST-VERIFY-${result.valid?'PASS':'FAIL'}-${label.replace(/[^a-z0-9_-]+/giu,'-')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <main className={styles.shell}>
    <header className={styles.hero}>
      <div>
        <p className={styles.kicker}>HOC V0.10 · AUDITORIA</p>
        <h1>Verificar Session Manifest</h1>
        <p>Cole ou abra um manifesto JSON. O servidor recalcula a canonicalização e o SHA-256; nenhum campo é aceito por confiança.</p>
        <p><Link href="/oraculum">← voltar ao Oraculum</Link> · <Link href="/oraculum/qa/evidence">Evidence Ledger →</Link></p>
      </div>
      <div className={styles.badge}>HOC-SESSION-MANIFEST/V0.10</div>
    </header>

    <section className={styles.card}>
      <div className={styles.step}><span>1</span><div><h2>Carregue o registro</h2><p>Use o JSON completo emitido por uma consulta HOC V0.10.</p></div></div>
      <label className={styles.label}>Arquivo JSON<input type="file" accept="application/json,.json" onChange={loadFile}/></label>
      <label className={styles.label}>Manifesto<textarea rows={18} value={text} onChange={event=>{setText(event.target.value);setResult(null)}} placeholder='{"manifestVersion":"HOC-SESSION-MANIFEST/V0.10", ...}'/></label>
      <button className={styles.submit} type="button" onClick={verify} disabled={busy||!text.trim()}>{busy?'Verificando…':'Recalcular checksum'}</button>
      {error&&<p className={styles.error}>{error}</p>}
    </section>

    {result&&<section className={styles.card}>
      <div className={result.valid?styles.validState:styles.invalidState}>{result.valid?'✓ MANIFESTO ÍNTEGRO':'✕ MANIFESTO ALTERADO OU INVÁLIDO'}</div>
      <div className={styles.resultGrid}>
        <article className={styles.resultCard}><small>Versão</small><strong>{result.manifestVersion??'—'}</strong></article>
        <article className={styles.resultCard}><small>Session ID</small><strong>{result.sessionId??'—'}</strong></article>
        <article className={styles.resultCard}><small>SHA-256</small><p className={styles.hash}>{result.checksum??'—'}</p></article>
      </div>
      <label className={styles.label}>Label deste dispositivo<input value={deviceLabel} onChange={event=>setDeviceLabel(event.target.value)} placeholder="Ex.: Desktop Edge / Android Chrome"/></label>
      <div className={styles.inlineActions}><button type="button" onClick={downloadVerificationEvidence}>Baixar evidência desta verificação</button></div>
      <p className={styles.disclaimer}>A evidência exportada não contém o manifesto completo nem uma identidade criptográfica do dispositivo. O label é uma declaração humana usada somente no QA cross-device. A verificação prova integridade criptográfica do registro segundo V0.10; não prova validade sobrenatural ou verdade das interpretações simbólicas.</p>
    </section>}
  </main>;
}
