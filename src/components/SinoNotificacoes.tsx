import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { contarNotificacoesNaoLidas, listarNotificacoes, marcarNotificacoesComoLidas } from '../lib/notificacoesApi';
import type { Notificacao } from '../lib/types';

const INTERVALO_POLLING_MS = 30000;

function formatarTempoRelativo(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffDias = Math.floor(diffH / 24);
  return `há ${diffDias}d`;
}

export function SinoNotificacoes() {
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const painelRef = useRef<HTMLDivElement>(null);

  // Busca a contagem de não lidas a cada 30s, pausando quando a aba está em
  // segundo plano - e busca na hora quando ela volta a ficar visível.
  useEffect(() => {
    if (!usuario) return;

    function buscarContagem() {
      if (document.hidden) return;
      contarNotificacoesNaoLidas().then(setNaoLidas).catch(() => {});
    }

    buscarContagem();
    const intervalo = setInterval(buscarContagem, INTERVALO_POLLING_MS);
    document.addEventListener('visibilitychange', buscarContagem);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', buscarContagem);
    };
  }, [usuario]);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(e: MouseEvent) {
      if (painelRef.current && !painelRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, [aberto]);

  async function aoAlternarPainel() {
    const vaiAbrir = !aberto;
    setAberto(vaiAbrir);
    if (!vaiAbrir) return;

    setCarregando(true);
    try {
      const lista = await listarNotificacoes();
      setNotificacoes(lista);
      await marcarNotificacoesComoLidas();
      setNaoLidas(0);
    } catch {
      // Sino nunca pode quebrar o resto do app - falha aqui é silenciosa
    } finally {
      setCarregando(false);
    }
  }

  function aoClicarItem(notificacao: Notificacao) {
    setAberto(false);
    if (notificacao.ordemServicoId) {
      navegar(`/os/${notificacao.ordemServicoId}`);
    }
  }

  if (!usuario) return null;

  return (
    <div className="relative" ref={painelRef}>
      <button
        type="button"
        onClick={aoAlternarPainel}
        aria-label="Notificações"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-line/60 hover:text-ink"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {naoLidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-11 z-30 max-h-[26rem] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-line bg-surface shadow-lg">
          <div className="sticky top-0 border-b border-line bg-surface px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notificações</p>
          </div>

          {carregando ? (
            <p className="px-4 py-8 text-center text-sm text-ink-soft">Carregando...</p>
          ) : notificacoes.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-soft">Nenhuma novidade por aqui ainda.</p>
          ) : (
            <ul className="divide-y divide-line">
              {notificacoes.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => aoClicarItem(n)}
                    disabled={!n.ordemServicoId}
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors ${
                      n.ordemServicoId ? 'hover:bg-bg' : 'cursor-default'
                    } ${!n.lida ? 'bg-accent-soft/30' : ''}`}
                  >
                    <span className="text-sm text-ink">{n.texto}</span>
                    <span className="text-[11px] text-ink-soft">{formatarTempoRelativo(n.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
