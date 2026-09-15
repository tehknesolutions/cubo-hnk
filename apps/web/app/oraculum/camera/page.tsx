import type { Metadata } from 'next';
import { CameraConsultationClient } from './CameraConsultationClient';
export const metadata: Metadata={title:'HNK Oraculum Cube · Câmera',description:'Captura assistida por câmera com revisão humana obrigatória.'};
export default function CameraPage(){return <CameraConsultationClient/>;}
