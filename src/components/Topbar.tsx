import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export function Topbar() {
  const { usuario, sair } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.jpg" alt="meca mecânica" className="h-9 w-9 rounded-md object-cover" />
          <span className="hidden flex-col sm:flex">
            <span className="font-display text-sm font-bold leading-tight tracking-tight text-ink">Meca</span>
            <span className="font-mono text-[10px] font-semibold leading-tight tracking-wider text-accent uppercase">
              Mecânica
            </span>
          </span>
        </Link>

        {usuario && (
          <div className="flex items-center gap-3">
            {usuario.papel === 'MODERADOR' && (
              <>
                <Link
                  to="/painel"
                  className="hidden text-xs font-medium text-ink-soft hover:text-ink sm:block"
                >
                  Painel
                </Link>
                <Link
                  to="/usuarios"
                  className="hidden text-xs font-medium text-ink-soft hover:text-ink sm:block"
                >
                  Usuários
                </Link>
              </>
            )}
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-medium text-ink">{usuario.nome}</span>
              <span className="block text-[11px] text-ink-soft">
                {usuario.papel === 'MODERADOR' ? 'Moderadora' : 'Mecânico'}
              </span>
            </span>
            <button
              onClick={sair}
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-ink/40 hover:text-ink"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}