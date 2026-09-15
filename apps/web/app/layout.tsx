import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HNK Oraculum Cube',
  description: 'HOC-256 — consulta física reproduzível com cubo 3×3.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
