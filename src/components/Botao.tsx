import type { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'perigo';
}

const VARIANTES: Record<string, string> = {
  primario: 'bg-ink text-white hover:bg-ink/90',
  secundario: 'bg-white text-ink border border-line hover:border-ink/40',
  perigo: 'bg-white text-red-700 border border-red-200 hover:border-red-400',
};

export function Botao({ variante = 'primario', className = '', ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${className}`}
      {...props}
    />
  );
}
