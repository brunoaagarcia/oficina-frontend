import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
}

export function Campo({ rotulo, id, className = '', ...props }: Props) {
  return (
    <label className="flex flex-col gap-1.5" htmlFor={id}>
      <span className="text-xs font-medium text-ink-soft">{rotulo}</span>
      <input
        id={id}
        className={`rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent ${className}`}
        {...props}
      />
    </label>
  );
}
