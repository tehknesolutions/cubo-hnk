import type {Metadata} from 'next';
import {EvidenceLedgerClient} from './EvidenceLedgerClient';

export const metadata:Metadata={
  title:'HOC V1.0 RC1 · Release Evidence Ledger',
  description:'Agregador de evidências de QA para promoção controlada do HNK Oraculum Cube V1.0 RC1.',
};

export default function EvidenceLedgerPage(){return <EvidenceLedgerClient/>;}
