import type { StatusOrdemServico } from '../lib/types';

const ROTULOS: Record<StatusOrdemServico, string> = {
  ORCAMENTO: 'Orçamento',
  EM_ANDAMENTO: 'Em andamento',
  FINALIZADO: 'Finalizado',
  REJEITADO: 'Recusado',
};

const CORES: Record<StatusOrdemServico, { texto: string; fundo: string }> = {
  ORCAMENTO: { texto: 'var(--color-status-orcamento)', fundo: 'var(--color-status-orcamento-bg)' },
  EM_ANDAMENTO: { texto: 'var(--color-status-andamento)', fundo: 'var(--color-status-andamento-bg)' },
  FINALIZADO: { texto: 'var(--color-status-finalizado)', fundo: 'var(--color-status-finalizado-bg)' },
  REJEITADO: { texto: 'var(--color-status-rejeitado)', fundo: 'var(--color-status-rejeitado-bg)' },
};

// Visual de etiqueta física pendurada no carro (tipo as que ficam no
// retrovisor) - é o elemento de assinatura visual do app: furinho de
// argola + leve rotação, em fonte mono (ficha técnica).
export function StatusTag({ status }: { status: StatusOrdemServico }) {
  const cor = CORES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide uppercase shadow-[1px_2px_0_rgba(0,0,0,0.08)] -rotate-1"
      style={{ color: cor.texto, background: cor.fundo, border: `1px solid ${cor.texto}33` }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ background: cor.texto, opacity: 0.5 }}
        aria-hidden
      />
      {ROTULOS[status]}
    </span>
  );
}