import type {Metadata} from 'next';
import {HumanPromotionDecisionClient} from './HumanPromotionDecisionClient';

export const metadata:Metadata={
  title:'HOC V1.0 RC1 · Human Promotion Decision',
  description:'Registro explícito de decisão humana sobre a promoção RC1 → V1.0 sem execução automática.',
};

export default function HumanPromotionDecisionPage(){return <HumanPromotionDecisionClient/>;}
