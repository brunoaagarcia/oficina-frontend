import { api } from './api';
import type { PapelUsuario, Usuario } from './types';

export function listarUsuarios() {
  return api<Usuario[]>('/usuarios');
}

export function criarUsuario(dados: { nome: string; login: string; senha: string; papel: PapelUsuario }) {
  return api<Usuario>('/usuarios', { method: 'POST', body: dados });
}

export function desativarUsuario(id: string) {
  return api<Usuario>(`/usuarios/${id}/desativar`, { method: 'PATCH' });
}

export function resetarSenhaUsuario(id: string, novaSenha: string) {
  return api<void>(`/usuarios/${id}/resetar-senha`, { method: 'PATCH', body: { novaSenha } });
}