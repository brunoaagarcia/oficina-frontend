import { useNavigate } from 'react-router-dom';

// Botão circular com seta - volta pra página anterior do histórico do navegador.
export function BotaoVoltar() {
  const navegar = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navegar(-1)}
      aria-label="Voltar"
      className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-sm transition-colors hover:border-ink/40"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}