import { api } from './api';
import type { AbrirOrdemServicoPayload, OrdemServico, StatusOrdemServico } from './types';

export function abrirOrdemServico(dados: AbrirOrdemServicoPayload) {
  return api<OrdemServico>('/ordens-servico', { method: 'POST', body: dados });
}

export function listarOrdensServico(filtros?: { status?: StatusOrdemServico; veiculoId?: string; criadoPorId?: string }) {
  const params = new URLSearchParams();
  if (filtros?.status) params.set('status', filtros.status);
  if (filtros?.veiculoId) params.set('veiculoId', filtros.veiculoId);
  if (filtros?.criadoPorId) params.set('criadoPorId', filtros.criadoPorId);
  const query = params.toString() ? `?${params.toString()}` : '';
  return api<OrdemServico[]>(`/ordens-servico${query}`);
}

export function buscarOrdemServico(id: string) {
  return api<OrdemServico>(`/ordens-servico/${id}`);
}

export function atualizarOrdemServico(id: string, dados: { kmRegistrado?: number }) {
  return api<OrdemServico>(`/ordens-servico/${id}`, { method: 'PATCH', body: dados });
}

export function atualizarStatusOrdemServico(id: string, status: StatusOrdemServico) {
  return api<OrdemServico>(`/ordens-servico/${id}/status`, { method: 'PATCH', body: { status } });
}

export function adicionarObservacao(id: string, texto: string) {
  return api<OrdemServico>(`/ordens-servico/${id}/observacoes`, { method: 'POST', body: { texto } });
}

export interface NovoItemMaoDeObra {
  descricao: string;
  tipoValor: 'HORAS' | 'FECHADO';
  horas?: number;
  valorHoraCentavos?: number;
  valorFechadoCentavos?: number;
}

export function adicionarItemMaoDeObra(id: string, dados: NovoItemMaoDeObra) {
  return api<OrdemServico>(`/ordens-servico/${id}/itens-mao-de-obra`, { method: 'POST', body: dados });
}

export function removerItemMaoDeObra(id: string, itemId: string) {
  return api<OrdemServico>(`/ordens-servico/${id}/itens-mao-de-obra/${itemId}`, { method: 'DELETE' });
}

export interface SugestaoMaoDeObra {
  descricao: string;
  tipoValor: 'HORAS' | 'FECHADO';
  horas: number | null;
  valorHoraCentavos: number | null;
  valorTotalCentavos: number;
}

export function buscarSugestoesMaoDeObra(termo: string, modelo?: string) {
  const params = new URLSearchParams({ descricao: termo });
  if (modelo) params.set('modelo', modelo);
  return api<SugestaoMaoDeObra[]>(`/ordens-servico/itens-mao-de-obra/sugestoes?${params.toString()}`);
}