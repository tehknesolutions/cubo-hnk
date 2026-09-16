'use client';

import Link from 'next/link';
import {ChangeEvent,useMemo,useState} from 'react';
import {evaluateRc1PromotionReadiness} from '../evidence/promotion-readiness.mjs';
import styles from '../../oraculum.module.css';

type LedgerArtifact={evidenceKind?:string;exportedAt?:string;releaseId?:string;ledgerVersion?:string;report?:unknown;};

function statusClass(status:string){return status==='READY_FOR_HUMAN_REVIEW'||status==='PASS'?styles.validState:styles.invalidState;}

export function PromotionReadinessClient(){
  const[artifact,setArtifact]=useState<LedgerArtifact|null>(null);
  const[fileName,setFileName]=useState<string|null>(null);
  const[error,setError]=useState<string|null>(null);
  const report=useMemo(()=>evaluateRc1PromotionReadiness(artifact?.report??null),[artifact]);

  async function importLedger(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];
    if(!file)return;
    setError(null);
    try{
      const parsed=JSON.parse(await file.text()) as LedgerArtifact;
      if(parsed?.evidenceKind!=='HOC-RC1-RELEASE-EVIDENCE-LEDGER/V1')throw new Error('O arquivo não é um HOC-RC1-RELEASE-EVIDENCE-LEDGER/V1.');
      if(parsed?.releaseId!=='HOC-V1.0-RC1')throw new Error('O ledger pertence a outra release.');
      setArtifact(parsed);setFileName(file.name);
    }catch(cause){setArtifact(null);setFileName(null);setError(cause instanceof Error?cause.message:'Ledger inválido.');}
    event.target.value='';
  }

  function clear(){setArtifact(null);setFileName(null);setError(null);}

  function downloadReadiness(){
    if(!artifact||!report.sourceLedgerValid)return;
    const evidence={evidenceKind:'HOC-RC1-PROMOTION-READINESS/V1',generatedAt:new Date().toISOString(),releaseId:report.releaseId,sourceLedger:{evidenceKind:artifact.evidenceKind,exportedAt:artifact.exportedAt??null,ledgerVersion:artifact.ledgerVersion??null,importedRecords:(artifact.report as {importedRecords?:number})?.importedRecords??null,acceptedRecords:(artifact.report as {acceptedRecords?:number})?.acceptedRecords??null},assessment:report,governance:{cryptographicSignature:false,automaticPromotion:false,mergeAuthorized:false,stablePromotionAuthorized:false,hnkCanonPromotionAuthorized:false,note:'Readiness assessment only. Human approval remains mandatory and external to this artifact.'}};
    const blob=new Blob([JSON.stringify(evidence,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=`HOC-V1.0-RC1-PROMOTION-READINESS-${report.status}.json`;anchor.click();URL.revokeObjectURL(url);
  }

  return <main className={styles.shell}>
    <header className={styles.hero}><div><p className={styles.kicker}>HOC V1.0 RC1 · PROMOTION READINESS</p><h1>RC1 → V1.0</h1><p>Importe o Release Evidence Ledger e obtenha blockers, evidências obrigatórias pendentes e o ponto exato em que a release pode ser submetida à decisão humana.</p><p><Link href="/oraculum/qa">← QA Hub</Link> · <Link href="/oraculum/qa/evidence">Evidence Ledger</Link> · <Link href="/oraculum/qa/decision">Human Decision</Link></p></div><div className={styles.badge}>{artifact?report.status:'READINESS'}</div></header>

    <section className={styles.card}><h2>1. Carregar ledger consolidado</h2><p>Este avaliador aceita somente `HOC-RC1-RELEASE-EVIDENCE-LEDGER/V1` da release `HOC-V1.0-RC1`. O arquivo é processado localmente no navegador.</p><label className={styles.label}>Release Evidence Ledger<input type="file" accept="application/json,.json" onChange={importLedger}/></label><div className={styles.inlineActions}><button type="button" onClick={clear} disabled={!artifact}>Limpar</button><button type="button" onClick={downloadReadiness} disabled={!artifact||!report.sourceLedgerValid}>Baixar Promotion Readiness JSON</button></div>{fileName&&<p>Arquivo carregado: <strong>{fileName}</strong></p>}{error&&<p className={styles.error}>{error}</p>}</section>

    <section className={styles.card}><h2>2. Readiness</h2><div className={statusClass(report.status)}>{report.status}</div><div className={styles.resultGrid}><article className={styles.resultCard}><small>Required PASS</small><strong>{report.required.pass}/{report.required.total}</strong></article><article className={styles.resultCard}><small>PENDING</small><strong>{report.required.pending}</strong></article><article className={styles.resultCard}><small>BLOCKED</small><strong>{report.required.blocked}</strong></article><article className={styles.resultCard}><small>Missing</small><strong>{report.required.missing}</strong></article></div><p>{report.readyForHumanReview?'Todos os gates obrigatórios pré-humanos estão PASS. Exporte o readiness e registre a decisão humana explícita em Human Decision.':'A release ainda não está pronta para decisão humana de aprovação; DEFER/REJECT continuam registráveis em Human Decision.'}</p></section>

    {report.blockers.length>0&&<section className={styles.card}><h2>3. Blockers obrigatórios</h2><div className={styles.analysisGrid}>{report.blockers.map(item=><article className={styles.analysisCard} key={item.id}><div className={styles.invalidState}>BLOCKED</div><h3>{item.label}</h3><p>{item.detail}</p></article>)}</div></section>}
    {report.pendingRequirements.length>0&&<section className={styles.card}><h2>4. Evidências obrigatórias pendentes</h2><div className={styles.analysisGrid}>{report.pendingRequirements.map(item=><article className={styles.analysisCard} key={item.id}><div className={styles.invalidState}>PENDING</div><h3>{item.label}</h3><p>{item.detail}</p></article>)}</div></section>}
    <section className={styles.card}><h2>5. Próximas ações</h2>{report.nextActions.length===0?<p>Nenhuma ação calculada.</p>:<ol>{report.nextActions.map((action,index)=><li key={`${index}-${action}`}>{action}</li>)}</ol>}</section>
    <section className={styles.card}><h2>6. Evidência suplementar</h2>{report.supplemental.length===0?<p>Nenhum gate suplementar encontrado.</p>:report.supplemental.map(item=><p key={item.id}><strong>{item.label}:</strong> {item.status} — {item.detail}</p>)}<p>O Independent Executor é evidência adicional. Ele não substitui o gate obrigatório de GitHub CI.</p></section>
    <section className={styles.card}><h2>7. Limite de autoridade</h2><p>Este avaliador não faz merge, não promove stable e não altera `HNK_CANON`. Mesmo `READY_FOR_HUMAN_REVIEW` significa apenas que os gates pré-humanos estão completos. A decisão humana é registrada separadamente em <Link href="/oraculum/qa/decision">Human Decision</Link>.</p><pre className={styles.audit}>{JSON.stringify(report.governance,null,2)}</pre></section>
  </main>;
}
