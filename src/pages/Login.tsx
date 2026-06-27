import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { ApiError } from '../lib/api';
import { Campo } from '../components/Campo';
import { Botao } from '../components/Botao';

export function Login() {
  const { entrar } = useAuth();
  const navegar = useNavigate();
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await entrar(login, senha);
      navegar('/');
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível entrar. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/logo.jpg" alt="Meca Mecânica" className="mx-auto mb-3 h-24 w-24 rounded-xl object-cover shadow-sm" />
          <p className="text-sm text-ink-soft">Sistema de ordens de serviço</p>
        </div>

        <form onSubmit={aoEnviar} className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6 shadow-sm">
          <Campo
            rotulo="Login"
            id="login"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="username"
            required
          />
          <Campo
            rotulo="Senha"
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            required
          />

          {erro && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
          )}

          <Botao type="submit" disabled={enviando} className="mt-1">
            {enviando ? 'Entrando...' : 'Entrar'}
          </Botao>
        </form>
      </div>
    </div>
  );
}
