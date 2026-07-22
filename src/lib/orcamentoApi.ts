import { api } from './api';
import type { ItemOrcamento, TipoItemOrcamento } from './types';

export interface NovoItemOrcamento {
  tipo: TipoItemOrcamento;
  descricao: string;
  quantidade?: number;
  unidade?: string;
  valorUnitarioCentavos?: number;
  fornecedor?: string;
  observacao?: string;
}

export interface EdicaoItemOrcamento {
  tipo?: TipoItemOrcamento;
  descricao?: string;
  quantidade?: number;
  unidade?: string;
  valorUnitarioCentavos?: number;
  fornecedor?: string;
  observacao?: string;
}

export function adicionarItemOrcamento(osId: string, dados: NovoItemOrcamento) {
  return api<ItemOrcamento>(`/ordens-servico/${osId}/orcamento`, { method: 'POST', body: dados });
}

export function atualizarItemOrcamento(osId: string, itemId: string, dados: EdicaoItemOrcamento) {
  return api<ItemOrcamento>(`/ordens-servico/${osId}/orcamento/${itemId}`, { method: 'PATCH', body: dados });
}

export function removerItemOrcamento(osId: string, itemId: string) {
  return api<void>(`/ordens-servico/${osId}/orcamento/${itemId}`, { method: 'DELETE' });
}

export interface SugestaoOrcamento {
  descricao: string;
  total: number;
  unidade: string;
  valorUnitarioCentavos?: number | null;
}

export function buscarSugestoesOrcamento(termo: string, tipo: TipoItemOrcamento) {
  const params = new URLSearchParams({ termo, tipo });
  return api<SugestaoOrcamento[]>(`/ordens-servico/orcamento/sugestoes?${params.toString()}`);
}
