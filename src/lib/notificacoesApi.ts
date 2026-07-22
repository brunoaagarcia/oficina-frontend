import { api } from './api';
import type { Notificacao } from './types';

export function listarNotificacoes() {
  return api<Notificacao[]>('/notificacoes');
}

export function contarNotificacoesNaoLidas() {
  return api<number>('/notificacoes/nao-lidas/contagem');
}

export function marcarNotificacoesComoLidas() {
  return api<void>('/notificacoes/marcar-lidas', { method: 'PATCH' });
}
