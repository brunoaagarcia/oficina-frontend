import { api } from './api';
import type { Usuario } from './types';

interface RespostaLogin {
  accessToken: string;
  usuario: Usuario;
}

export function login(login: string, senha: string) {
  return api<RespostaLogin>('/auth/login', {
    method: 'POST',
    body: { login, senha },
  });
}

export function me() {
  return api<Usuario>('/auth/me');
}

export function trocarSenha(senhaAtual: string, novaSenha: string) {
  return api<void>('/auth/trocar-senha', {
    method: 'PATCH',
    body: { senhaAtual, novaSenha },
  });
}
