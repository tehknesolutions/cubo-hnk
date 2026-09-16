import type { Metadata } from 'next';
import { ManifestVerifierClient } from './ManifestVerifierClient';

export const metadata: Metadata = {
  title: 'Verificar Manifesto · HNK Oraculum Cube',
  description: 'Recalcule o checksum de um HOC Session Manifest V0.10 e detecte alterações.',
};

export default function ManifestVerifierPage() {
  return <ManifestVerifierClient/>;
}
