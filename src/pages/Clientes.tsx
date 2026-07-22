import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { BotaoVoltar } from '../components/BotaoVoltar';
import { useAuth } from '../lib/AuthContext';
import { ApiError } from '../lib/api';
import { listarClientesGestao, type ClienteComContadores } from '../lib/clientesApi';

export function Clientes() {
  const { usuario } = useAuth();
  const [busca, setBusca] = useState('');
  const [clientes, setClientes] = useState<ClienteComContadores[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCarregando(true);
    setErro(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      listarClientesGestao(busca.trim())
        .then(setClientes)
        .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar os clientes.'))
        .finally(() => setCarregando(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [busca]);

  // Só a moderadora acessa essa tela - mesma regra do backend, refletida aqui
  if (usuario && usuario.papel !== 'MODERADOR') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-bg">
      <Topbar />

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <BotaoVoltar />
        <h1 className="mb-5 font-display text-xl font-bold text-ink">Clientes</h1>

        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, CPF/CNPJ ou telefone"
          className="mb-4 w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent"
        />

        {carregando && <p className="py-10 text-center text-sm text-ink-soft">Carregando...</p>}

        {erro && <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{erro}</p>}

        {!carregando && !erro && clientes.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-soft">
            Nenhum cliente encontrado{busca ? ` pra "${busca}"` : ''}.
          </p>
        )}

        <ul className="flex flex-col gap-2.5">
          {clientes.map((cliente) => {
            const incompleto = !cliente.cpfCnpj || !cliente.telefone;
            return (
              <li key={cliente.id}>
                <Link
                  to={`/clientes/${cliente.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3.5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{cliente.nome}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      {cliente.telefone && <span className="text-xs text-ink-soft">{cliente.telefone}</span>}
                      {cliente.cpfCnpj && <span className="font-mono text-xs text-ink-soft">{cliente.cpfCnpj}</span>}
                      {incompleto && (
                        <span className="rounded-full bg-warning-bg px-1.5 py-0.5 text-[10px] font-medium text-warning">
                          cadastro incompleto
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-ink-soft">
                    <p>{cliente.totalVeiculos} {cliente.totalVeiculos === 1 ? 'veículo' : 'veículos'}</p>
                    <p>{cliente.totalOrdensServico} OS</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
