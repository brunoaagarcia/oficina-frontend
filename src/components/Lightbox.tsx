import { useEffect, useState } from 'react';
import { Botao } from './Botao';
import { salvarMidia } from '../lib/fotosApi';
import type { Foto } from '../lib/types';

interface Props {
  itens: Foto[];
  indiceInicial: number;
  placa: string;
  aoFechar: () => void;
}

function slugificar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function Lightbox({ itens, indiceInicial, placa, aoFechar }: Props) {
  const [indice, setIndice] = useState(indiceInicial);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  const item = itens[indice];
  const temNavegacao = itens.length > 1;

  function irParaAnterior() {
    setErroSalvar(null);
    setIndice((i) => (i - 1 + itens.length) % itens.length);
  }

  function irParaProxima() {
    setErroSalvar(null);
    setIndice((i) => (i + 1) % itens.length);
  }

  useEffect(() => {
    function aoApertarTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') aoFechar();
      if (e.key === 'ArrowLeft' && temNavegacao) irParaAnterior();
      if (e.key === 'ArrowRight' && temNavegacao) irParaProxima();
    }
    window.addEventListener('keydown', aoApertarTecla);
    return () => window.removeEventListener('keydown', aoApertarTecla);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temNavegacao, itens.length]);

  if (!item) return null;

  async function aoClicarSalvar() {
    setSalvando(true);
    setErroSalvar(null);
    try {
      const rotulo = item.descricao?.trim() || `midia-${indice + 1}`;
      const nomeBase = [slugificar(placa), slugificar(rotulo)].filter(Boolean).join('-');
      await salvarMidia(item.url, nomeBase);
    } catch {
      setErroSalvar('Não foi possível salvar a mídia.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={aoFechar}
    >
      <button
        type="button"
        onClick={aoFechar}
        aria-label="Fechar"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg text-white hover:bg-white/20"
      >
        ✕
      </button>

      {temNavegacao && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); irParaAnterior(); }}
            aria-label="Mídia anterior"
            className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-4"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); irParaProxima(); }}
            aria-label="Próxima mídia"
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-4"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </>
      )}

      <div
        className="flex max-h-full w-full max-w-lg flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {item.tipo === 'VIDEO' ? (
          <video src={item.url} controls autoPlay className="max-h-[70vh] w-full rounded-md object-contain" />
        ) : (
          <img src={item.url} alt={item.descricao ?? 'Mídia'} className="max-h-[70vh] w-full rounded-md object-contain" />
        )}

        {item.descricao && <p className="text-center text-sm text-white/90">{item.descricao}</p>}

        <Botao type="button" variante="secundario" onClick={aoClicarSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </Botao>

        {erroSalvar && <p className="text-xs text-danger">{erroSalvar}</p>}
      </div>
    </div>
  );
}
