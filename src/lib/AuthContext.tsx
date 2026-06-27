import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Usuario } from './types';
import { login as loginApi } from './authApi';
import { obterToken, salvarToken, limparToken } from './api';

const CHAVE_USUARIO = 'oficina:usuario';

interface AuthContextValor {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (login: string, senha: string) => Promise<void>;
  sair: () => void;
}

const AuthContext = createContext<AuthContextValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Recupera a sessão salva (token + usuário) ao abrir o app de novo
  useEffect(() => {
    const token = obterToken();
    const usuarioSalvo = localStorage.getItem(CHAVE_USUARIO);
    if (token && usuarioSalvo) {
      try {
        setUsuario(JSON.parse(usuarioSalvo));
      } catch {
        limparToken();
      }
    }
    setCarregando(false);
  }, []);

  async function entrar(login: string, senha: string) {
    const resposta = await loginApi(login, senha);
    salvarToken(resposta.accessToken);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(resposta.usuario));
    setUsuario(resposta.usuario);
  }

  function sair() {
    limparToken();
    localStorage.removeItem(CHAVE_USUARIO);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth precisa estar dentro de um <AuthProvider>');
  }
  return contexto;
}
