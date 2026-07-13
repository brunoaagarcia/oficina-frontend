import type { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'perigo';
}

const VARIANTES: Record<string, string> = {
  primario: 'bg-accent text-white hover:bg-accent/90',
  secundario: 'bg-surface text-ink border border-line hover:border-ink/40',
  perigo: 'bg-surface text-danger border border-danger/40 hover:border-danger/70',
};

export function Botao({ variante = 'primario', className = '', ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${className}`}
      {...props}
    />
  );
}
