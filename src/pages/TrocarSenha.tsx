import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { Campo } from '../components/Campo';
import { Botao } from '../components/Botao';
import { useAuth } from '../lib/AuthContext';
import { trocarSenha } from '../lib/authApi';
import { ApiError } from '../lib/api';

export function TrocarSenha() {
  const { usuario, marcarSenhaAtualizada } = useAuth();
  const navegar = useNavigate();

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const ehProvisoria = usuario?.senhaProvisoria === true;

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (novaSenha.length < 6) {
      setErro('A nova senha precisa ter no mínimo 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmaSenha) {
      setErro('As senhas não conferem.');
      return;
    }

    setEnviando(true);
    try {
      await trocarSenha(senhaAtual, novaSenha);
      marcarSenhaAtualizada();
      navegar('/');
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível trocar a senha.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <Topbar />

      <main className="mx-auto max-w-sm px-4 py-8 sm:px-6">
        {ehProvisoria && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Você está usando uma senha provisória. Crie uma senha pessoal para continuar.
          </div>
        )}

        <h1 className="mb-5 font-display text-xl font-bold text-ink">
          {ehProvisoria ? 'Criar senha pessoal' : 'Trocar senha'}
        </h1>

        <form onSubmit={aoEnviar} className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6 shadow-sm">
          <div className="relative">
            <Campo
              rotulo="Senha atual"
              id="senhaAtual"
              type={mostrarSenhaAtual ? 'text' : 'password'}
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setMostrarSenhaAtual((v) => !v)}
              className="absolute right-3 top-8 text-ink-soft"
              aria-label={mostrarSenhaAtual ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {mostrarSenhaAtual ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <div className="relative">
            <Campo
              rotulo="Nova senha"
              id="novaSenha"
              type={mostrarNovaSenha ? 'text' : 'password'}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setMostrarNovaSenha((v) => !v)}
              className="absolute right-3 top-8 text-ink-soft"
              aria-label={mostrarNovaSenha ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {mostrarNovaSenha ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <Campo
            rotulo="Confirmar nova senha"
            id="confirmaSenha"
            type="password"
            value={confirmaSenha}
            onChange={(e) => setConfirmaSenha(e.target.value)}
            autoComplete="new-password"
            required
          />

          {erro && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
          )}

          <Botao type="submit" disabled={enviando} className="mt-1">
            {enviando ? 'Salvando...' : 'Salvar nova senha'}
          </Botao>

          {!ehProvisoria && (
            <button type="button" onClick={() => navegar(-1)} className="text-center text-sm text-ink-soft underline">
              Cancelar
            </button>
          )}
        </form>
      </main>
    </div>
  );
}
