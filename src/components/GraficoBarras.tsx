interface Props {
  dados: { rotulo: string; valor: number }[];
  formatarValor?: (valor: number) => string;
}

const ALTURA = 160;
const LARGURA_BARRA = 48;
const ESPACO = 24;

export function GraficoBarras({ dados, formatarValor }: Props) {
  const maximo = Math.max(...dados.map((d) => d.valor), 1);
  const largura = dados.length * (LARGURA_BARRA + ESPACO) + ESPACO;

  return (
    <svg viewBox={`0 0 ${largura} ${ALTURA + 40}`} width="100%" height={ALTURA + 40} className="overflow-visible">
      {dados.map((ponto, i) => {
        const alturaBarra = (ponto.valor / maximo) * ALTURA;
        const x = ESPACO + i * (LARGURA_BARRA + ESPACO);
        const y = ALTURA - alturaBarra;
        return (
          <g key={ponto.rotulo}>
            <text
              x={x + LARGURA_BARRA / 2}
              y={y - 8}
              textAnchor="middle"
              className="fill-ink font-mono text-[11px] font-semibold"
            >
              {formatarValor ? formatarValor(ponto.valor) : ponto.valor}
            </text>
            <rect
              x={x}
              y={y}
              width={LARGURA_BARRA}
              height={Math.max(alturaBarra, 2)}
              rx={4}
              className="fill-accent"
            />
            <text x={x + LARGURA_BARRA / 2} y={ALTURA + 20} textAnchor="middle" className="fill-ink-soft text-[11px]">
              {ponto.rotulo}
            </text>
          </g>
        );
      })}
    </svg>
  );
}