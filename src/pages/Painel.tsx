import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { BotaoVoltar } from '../components/BotaoVoltar';
import { GraficoBarras } from '../components/GraficoBarras';
import { StatusTag } from '../components/StatusTag';
import { useAuth } from '../lib/AuthContext';
import { ApiError } from '../lib/api';
import { obterPainelMensal, type PainelMensal } from '../lib/relatoriosApi';
import { formatarCentavos } from '../lib/moeda';
import type { StatusOrdemServico } from '../lib/types';

const NOME_MES = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export function Painel() {
  const { usuario } = useAuth();
  const [dados, setDados] = useState<PainelMensal | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    obterPainelMensal()
      .then(setDados)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar o painel.'))
      .finally(() => setCarregando(false));
  }, []);

  // Só a moderadora acessa essa tela - mesma regra do backend, refletida aqui
  if (usuario && usuario.papel !== 'MODERADOR') {
    return <Navigate to="/" replace />;
  }

  const totalStatus = dados
    ? dados.porStatus.ORCAMENTO + dados.porStatus.EM_ANDAMENTO + dados.porStatus.FINALIZADO
    : 0;

  return (
    <div className="min-h-screen bg-bg">
      <Topbar />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <BotaoVoltar />
        <div className="mb-5">
          <h1 className="font-display text-xl font-bold text-ink">Painel</h1>
          <p className="text-sm capitalize text-ink-soft">{NOME_MES}</p>
        </div>

        {carregando && <p className="py-10 text-center text-sm text-ink-soft">Carregando...</p>}
        {erro && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

        {dados && (
          <div className="flex flex-col gap-5">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-white p-4">
                <p className="text-xs text-ink-soft">Ordens de Serviço</p>
                <p className="mt-1 font-display text-2xl font-bold text-ink">{dados.totalOS}</p>
              </div>
              <div className="rounded-lg border border-line bg-white p-4">
                <p className="text-xs text-ink-soft">Faturamento (mão de obra)</p>
                <p className="mt-1 font-display text-2xl font-bold text-ink">
                  {formatarCentavos(dados.totalFaturamentoCentavos)}
                </p>
              </div>
            </div>

            {/* OS por status */}
            <div className="rounded-lg border border-line bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-ink">Ordens por status</h2>
              {totalStatus === 0 ? (
                <p className="text-sm text-ink-soft">Nenhuma OS aberta esse mês ainda.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {(['ORCAMENTO', 'EM_ANDAMENTO', 'FINALIZADO'] as StatusOrdemServico[]).map((status) => {
                    const quantidade = dados.porStatus[status];
                    const porcentagem = totalStatus > 0 ? Math.round((quantidade / totalStatus) * 100) : 0;
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div className="w-32 shrink-0">
                          <StatusTag status={status} />
                        </div>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-bg">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${porcentagem}%` }} />
                        </div>
                        <span className="w-10 shrink-0 text-right font-mono text-sm text-ink-soft">
                          {quantidade}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* OS por semana */}
            <div className="rounded-lg border border-line bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-ink">Ordens de Serviço por semana</h2>
              {dados.osPorSemana.every((p) => p.valor === 0) ? (
                <p className="text-sm text-ink-soft">Nenhuma OS aberta esse mês ainda.</p>
              ) : (
                <GraficoBarras dados={dados.osPorSemana.map((p) => ({ rotulo: p.semana, valor: p.valor }))} />
              )}
            </div>

            {/* Faturamento por semana */}
            <div className="rounded-lg border border-line bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-ink">Faturamento (mão de obra) por semana</h2>
              {dados.faturamentoPorSemana.every((p) => p.valor === 0) ? (
                <p className="text-sm text-ink-soft">Nenhum lançamento esse mês ainda.</p>
              ) : (
                <GraficoBarras
                  dados={dados.faturamentoPorSemana.map((p) => ({ rotulo: p.semana, valor: p.valor }))}
                  formatarValor={(v) => formatarCentavos(v)}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}