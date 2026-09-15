import type { Metadata } from 'next';
import { PhysicalQaClient } from './PhysicalQaClient';

export const metadata: Metadata = {
  title: 'HOC V1.0 RC1 Physical QA',
  description: 'Wizard de validação física dos vetores STATE e RITUAL_32 oficiais do HNK Oraculum Cube V1.0 RC1.',
};

export default function PhysicalQaPage(){
  return <PhysicalQaClient/>;
}
