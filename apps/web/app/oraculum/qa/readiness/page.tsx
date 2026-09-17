import type {Metadata} from 'next';
import {PromotionReadinessClient} from './PromotionReadinessClient';

export const metadata:Metadata={
  title:'HOC V1.0 RC1 · Promotion Readiness',
  description:'Avaliação final dos gates RC1 → V1.0 sem autoridade automática de promoção.',
};

export default function PromotionReadinessPage(){return <PromotionReadinessClient/>;}
