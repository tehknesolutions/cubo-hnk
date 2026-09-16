'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from '../oraculum.module.css';

type Check={id:string;passed:boolean;actual:unknown;expected:unknown};
type Report={
  version:string;
  releaseId:string;
  passed:boolean;
  totalChecks:number;
  passedChecks:number;
  failedChecks:number;
  protocols:Record<string,string>;
  checks:Check[];
};

export function Rc1QaClient(){
  const[report,setReport]=useState<Report|null>(null);
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState<string|null>(null);

  async function run(){
    setBusy(true);
    setError(null);
    try{
      const response=await fetch('/api/oraculum/rc1-selftest',{cache:'no-store'});
      const data=await response.json();
      if(!data.report)throw new Error(data.error||'Self-test não retornou relatório.');
      setReport(data.report as Report);
      if(!response.ok&&!data.report.passed) setError('A RC1 apresentou uma ou mais divergências. Veja os checks abaixo.');
    }catch(cause){
      setError(cause instanceof Error?cause.message:'Falha ao executar self-test.');
    }finally{
      setBusy(false);
    }
  }

  useEffect(()=>{void run();},[]);

  return <main className={styles.shell}>
    <header className={styles.hero}>
      <div>
        <p className={styles.kicker}>HOC V1.0 RC1 · RUNTIME QA</p>
        <h1>Self-Test da Release Candidate</h1>
        <p>Executa os vetores congelados diretamente no runtime Node da aplicação. É evidência suplementar; não substitui CI, build de produção nem QA com cubo físico.</p>
        <p><Link href="/oraculum">← voltar ao Oraculum</Link> · <Link href="/oraculum/verify">verificar manifesto →</Link></p>
      </div>
      <div className={styles.badge}>{report?.passed?'RC1 SELF-TEST PASS':'RC1 SELF-TEST'}</div>
    </header>

    <section className={styles.card}>
      <div className={styles.inlineActions}>
        <button type="button" onClick={run} disabled={busy}>{busy?'Executando…':'Executar novamente'}</button>
      </div>
      {error&&<p className={styles.error}>{error}</p>}
      {!report&&busy&&<p>Validando protocolos e vetores oficiais…</p>}
      {report&&<>
        <div className={report.passed?styles.validState:styles.invalidState}>
          {report.passed?'✓ RC1 runtime íntegro':'✗ RC1 com divergências'} · {report.passedChecks}/{report.totalChecks} checks PASS
        </div>
        <div className={styles.resultGrid}>
          <article className={styles.resultCard}><small>Release</small><strong>{report.releaseId}</strong></article>
          <article className={styles.resultCard}><small>Self-test</small><strong>{report.version}</strong></article>
          <article className={styles.resultCard}><small>PASS</small><strong>{report.passedChecks}</strong></article>
          <article className={styles.resultCard}><small>FAIL</small><strong>{report.failedChecks}</strong></article>
        </div>
      </>}
    </section>

    {report&&<section className={styles.card}>
      <h2>Protocolos congelados</h2>
      <div className={styles.resultGrid}>{Object.entries(report.protocols).map(([key,value])=><article className={styles.resultCard} key={key}><small>{key}</small><strong>{value}</strong></article>)}</div>
    </section>}

    {report&&<section className={styles.card}>
      <h2>Matriz de checks</h2>
      <div className={styles.analysisGrid}>
        {report.checks.map(check=><article className={styles.analysisCard} key={check.id}>
          <div className={check.passed?styles.validState:styles.invalidState}>{check.passed?'PASS':'FAIL'}</div>
          <h3>{check.id}</h3>
          {!check.passed&&<pre className={styles.audit}>{JSON.stringify({expected:check.expected,actual:check.actual},null,2)}</pre>}
        </article>)}
      </div>
    </section>}

    <section className={styles.card}>
      <h2>O que este painel não prova</h2>
      <p>Um PASS aqui prova consistência dos vetores dentro do runtime carregado. Ainda são gates separados: instalação limpa, TypeScript, build Next.js, execução em dispositivo, câmera, cubo físico STATE, RITUAL_32 real e validação cross-device do manifesto.</p>
    </section>
  </main>;
}
