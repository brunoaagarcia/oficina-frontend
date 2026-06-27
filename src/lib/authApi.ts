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
