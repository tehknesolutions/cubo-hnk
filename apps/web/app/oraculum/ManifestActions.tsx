'use client';

import Link from 'next/link';
import styles from './oraculum.module.css';

export function ManifestActions({manifest}:{manifest:any}){
  if(!manifest?.audit)return null;

  function download(){
    const blob=new Blob([JSON.stringify(manifest,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');
    anchor.href=url;
    anchor.download=`${manifest.audit.sessionId||'hoc-session'}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return <article className={styles.analysisCard}>
    <h3>Sessão V0.10</h3>
    <div className={styles.validState}>✓ Manifesto verificado antes da resposta</div>
    <p><strong>{manifest.audit.sessionId}</strong></p>
    <p className={styles.hash}>{manifest.audit.checksum}</p>
    <div className={styles.inlineActions}>
      <button type="button" onClick={download}>Baixar manifesto JSON</button>
      <Link href="/oraculum/verify">Verificar um manifesto →</Link>
    </div>
  </article>;
}
