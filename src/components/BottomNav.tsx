import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export function BottomNav() {
  const { usuario } = useAuth();
  const { pathname } = useLocation();

  const ativo = (rota: string) =>
    pathname === rota
      ? 'text-accent'
      : 'text-ink-soft';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-14 items-stretch border-t border-line bg-surface sm:hidden">
      <Link to="/" className={`flex flex-1 flex-col items-center justify-center gap-0.5 ${ativo('/')}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="16" x2="13" y2="16" />
        </svg>
        <span className="text-[10px] font-medium leading-none">OS</span>
      </Link>

      <Link
        to="/abrir"
        className="flex flex-1 flex-col items-center justify-center gap-0.5 text-accent"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <span className="text-[10px] font-medium leading-none">Abrir</span>
      </Link>

      {usuario?.papel === 'MODERADOR' && (
        <Link to="/painel" className={`flex flex-1 flex-col items-center justify-center gap-0.5 ${ativo('/painel')}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span className="text-[10px] font-medium leading-none">Painel</span>
        </Link>
      )}

      {usuario?.papel === 'MODERADOR' && (
        <Link to="/usuarios" className={`flex flex-1 flex-col items-center justify-center gap-0.5 ${ativo('/usuarios')}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
          <span className="text-[10px] font-medium leading-none">Usuários</span>
        </Link>
      )}

      {usuario?.papel === 'MODERADOR' && (
        <Link to="/backup" className={`flex flex-1 flex-col items-center justify-center gap-0.5 ${ativo('/backup')}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
          </svg>
          <span className="text-[10px] font-medium leading-none">Backup</span>
        </Link>
      )}
    </nav>
  );
}
