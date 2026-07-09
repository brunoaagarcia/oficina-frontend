import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { BottomNav } from './BottomNav';

interface Props {
  children: ReactNode;
  semNav?: boolean;
}

export function RotaProtegida({ children, semNav }: Props) {
  const { usuario, carregando } = useAuth();
  const { pathname } = useLocation();

  if (carregando) {
    return <p className="py-10 text-center text-sm text-ink-soft">Carregando...</p>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.senhaProvisoria && pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />;
  }

  if (semNav) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="pb-14 sm:pb-0">{children}</div>
      <BottomNav />
    </>
  );
}
