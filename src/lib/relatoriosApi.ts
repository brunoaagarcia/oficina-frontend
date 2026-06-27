import { api } from './api';

export interface PainelMensal {
  periodoInicio: string;
  periodoFim: string;
  totalOS: number;
  totalFaturamentoCentavos: number;
  porStatus: {
    ORCAMENTO: number;
    EM_ANDAMENTO: number;
    FINALIZADO: number;
    REJEITADO: number;
  };
  osPorSemana: { semana: string; valor: number }[];
  faturamentoPorSemana: { semana: string; valor: number }[];
}

export function obterPainelMensal() {
  return api<PainelMensal>('/relatorios/painel');
}