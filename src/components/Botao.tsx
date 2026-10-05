import type { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'perigo';
  tamanho?: 'padrao' | 'compacto';
}

const VARIANTES: Record<string, string> = {
  primario: 'bg-accent text-white hover:bg-accent/90',
  secundario: 'bg-surface text-ink border border-line hover:border-ink/40',
  perigo: 'bg-surface text-danger border border-danger/40 hover:border-danger/70',
};

// "compacto" é para ações dentro de listas/cabeçalhos de seção (ex: "Pedir
// preço", "Editar" num item de orçamento) - onde o botão padrão (px-4 py-2.5)
// ficaria grande demais ao lado de um título ou dentro de uma linha de lista.
const TAMANHOS: Record<string, string> = {
  padrao: 'px-4 py-2.5 text-sm gap-2',
  compacto: 'px-2.5 py-1 text-xs gap-1',
};

export function Botao({ variante = 'primario', tamanho = 'padrao', className = '', ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${TAMANHOS[tamanho]} ${className}`}
      {...props}
    />
  );
}
