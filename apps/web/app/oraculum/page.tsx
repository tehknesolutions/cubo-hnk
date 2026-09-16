import type { Metadata } from 'next';
import { OraculumClient } from './OraculumClient';
export const metadata: Metadata = { title:'HNK Oraculum Cube', description:'Consulta física do HNK Oraculum Cube com transcrição 3×3 reproduzível.' };
export default function OraculumPage(){ return <OraculumClient />; }
