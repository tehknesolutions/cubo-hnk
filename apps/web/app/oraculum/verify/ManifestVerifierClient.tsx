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

  return <main className={styles.shell}>
    <header className={styles.hero}>
      <div>
        <p className={styles.kicker}>HOC V0.10 · AUDITORIA</p>
        <h1>Verificar Session Manifest</h1>
        <p>Cole ou abra um manifesto JSON. O servidor recalcula a canonicalização e o SHA-256; nenhum campo é aceito por confiança.</p>
        <p><Link href="/oraculum">← voltar ao Oraculum</Link></p>
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
      <p className={styles.disclaimer}>A verificação prova integridade criptográfica do registro segundo o protocolo V0.10; não prova validade sobrenatural ou verdade das interpretações simbólicas.</p>
    </section>}
  </main>;
}
