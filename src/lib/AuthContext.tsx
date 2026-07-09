import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Usuario } from './types';
import { login as loginApi, me } from './authApi';
import { obterToken, salvarToken, limparToken } from './api';

const CHAVE_USUARIO = 'oficina:usuario';

interface AuthContextValor {
  usuario: Usuario | null;
  carregando: boolean;
  motivoLogout: string | null;
  entrar: (login: string, senha: string) => Promise<void>;
  sair: () => void;
  marcarSenhaAtualizada: () => void;
}

const AuthContext = createContext<AuthContextValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [motivoLogout, setMotivoLogout] = useState<string | null>(null);

  // Valida o token no servidor ao abrir o app — não confia no localStorage como fonte da verdade
  useEffect(() => {
    const token = obterToken();
    if (!token) { setCarregando(false); return; }

    me()
      .then((dados) => {
        setUsuario(dados);
        localStorage.setItem(CHAVE_USUARIO, JSON.stringify(dados));
      })
      .catch(() => {
        limparToken();
        localStorage.removeItem(CHAVE_USUARIO);
      })
      .finally(() => setCarregando(false));
  }, []);

  // Quando a API detecta 401, dispara esse evento para deslogar de verdade
  useEffect(() => {
    function aoExpirar() {
      limparToken();
      localStorage.removeItem(CHAVE_USUARIO);
      setUsuario(null);
      setMotivoLogout('sessao-expirada');
    }
    window.addEventListener('oficina:sessao-expirada', aoExpirar);
    return () => window.removeEventListener('oficina:sessao-expirada', aoExpirar);
  }, []);

  async function entrar(login: string, senha: string) {
    const resposta = await loginApi(login, senha);
    salvarToken(resposta.accessToken);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(resposta.usuario));
    setUsuario(resposta.usuario);
    setMotivoLogout(null);
  }

  function sair() {
    limparToken();
    localStorage.removeItem(CHAVE_USUARIO);
    setUsuario(null);
  }

  function marcarSenhaAtualizada() {
    setUsuario((prev) => (prev ? { ...prev, senhaProvisoria: false } : prev));
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, motivoLogout, entrar, sair, marcarSenhaAtualizada }}>
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
