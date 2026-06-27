import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarOrdensServico } from '../lib/ordensServicoApi';
import { ApiError } from '../lib/api';
import type { OrdemServico, StatusOrdemServico } from '../lib/types';
import { StatusTag } from '../components/StatusTag';
import { Topbar } from '../components/Topbar';

const FILTROS: { rotulo: string; valor: StatusOrdemServico | undefined }[] = [
  { rotulo: 'Todas', valor: undefined },
  { rotulo: 'Orçamento', valor: 'ORCAMENTO' },
  { rotulo: 'Em andamento', valor: 'EM_ANDAMENTO' },
  { rotulo: 'Finalizadas', valor: 'FINALIZADO' },
  { rotulo: 'Recusadas', valor: 'REJEITADO' },
];

export function ListaOS() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [filtro, setFiltro] = useState<StatusOrdemServico | undefined>(undefined);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setCarregando(true);
    setErro(null);
    listarOrdensServico({ status: filtro })
      .then(setOrdens)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar as ordens.'))
      .finally(() => setCarregando(false));
  }, [filtro]);

  // Busca por placa ou nome do cliente, direto na lista já carregada -
  // dá conta do recado enquanto o volume de OS for baixo/médio.
  const ordensFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return ordens;
    return ordens.filter(
      (os) =>
        os.veiculo.placa.toLowerCase().includes(termo) ||
        os.veiculo.cliente.nome.toLowerCase().includes(termo),
    );
  }, [ordens, busca]);

  return (
    <div className="min-h-screen bg-bg">
      <Topbar />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-ink">Ordens de Serviço</h1>
          <Link
            to="/abrir"
            className="rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent/90"
          >
            + Abrir OS
          </Link>
        </div>

        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por placa ou nome do cliente"
          className="mb-4 w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent"
        />

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {FILTROS.map((f) => (
            <button
              key={f.rotulo}
              onClick={() => setFiltro(f.valor)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filtro === f.valor
                  ? 'border-ink bg-ink text-white'
                  : 'border-line bg-white text-ink-soft hover:border-ink/40'
              }`}
            >
              {f.rotulo}
            </button>
          ))}
        </div>

        {carregando && <p className="py-10 text-center text-sm text-ink-soft">Carregando...</p>}

        {erro && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

        {!carregando && !erro && ordens.length === 0 && (
          <div className="rounded-lg border border-dashed border-line bg-white px-6 py-12 text-center">
            <p className="text-sm text-ink-soft">Nenhuma ordem de serviço por aqui ainda.</p>
            <Link to="/abrir" className="mt-2 inline-block text-sm font-medium text-accent-ink underline">
              Abrir a primeira
            </Link>
          </div>
        )}

        {!carregando && !erro && ordens.length > 0 && ordensFiltradas.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-soft">
            Nenhum resultado pra "{busca}".
          </p>
        )}

        <ul className="flex flex-col gap-2.5">
          {ordensFiltradas.map((os) => (
            <li key={os.id}>
              <Link
                to={`/os/${os.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-4 py-3.5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{os.veiculo.cliente.nome}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="font-mono text-xs tracking-wide text-ink-soft">
                      {os.veiculo.placa}
                    </span>
                    <span className="truncate text-xs text-ink-soft">{os.veiculo.modelo}</span>
                  </div>
                </div>
                <StatusTag status={os.status} />
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}