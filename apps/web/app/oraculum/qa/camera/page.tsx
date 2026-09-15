import type { Metadata } from 'next';
import { CameraQaClient } from './CameraQaClient';

export const metadata: Metadata = {
  title: 'HOC V1.0 RC1 Camera QA',
  description: 'Validação de câmera, dispositivo, captura cromática e checklist end-to-end do HNK Oraculum Cube V1.0 RC1.',
};

export default function CameraQaPage(){
  return <CameraQaClient/>;
}
