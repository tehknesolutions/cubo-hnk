import type { Metadata } from 'next';
import { Rc1QaClient } from './Rc1QaClient';

export const metadata: Metadata = {
  title: 'HOC V1.0 RC1 Runtime QA',
  description: 'Self-test executável dos vetores oficiais e protocolos congelados do HNK Oraculum Cube V1.0 RC1.',
};

export default function Rc1QaPage(){
  return <Rc1QaClient/>;
}
