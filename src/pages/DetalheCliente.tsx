import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { BotaoVoltar } from '../components/BotaoVoltar';
import { StatusTag } from '../components/StatusTag';
import { Campo } from '../components/Campo';
import { Botao } from '../components/Botao';
import { useAuth } from '../lib/AuthContext';
import { ApiError } from '../lib/api';
import { atualizarCliente, buscarClientePorId, type ClienteFicha } from '../lib/clientesApi';
import type { TipoPessoa } from '../lib/types';

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function DetalheCliente() {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();

  const [cliente, setCliente] = useState<ClienteFicha | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState('');
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>('FISICA');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [enderecoRua, setEnderecoRua] = useState('');
  const [enderecoNumero, setEnderecoNumero] = useState('');
  const [enderecoBairro, setEnderecoBairro] = useState('');
  const [enderecoCidade, setEnderecoCidade] = useState('');
  const [enderecoEstado, setEnderecoEstado] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!id) return;
    setCarregando(true);
    setErro(null);
    buscarClientePorId(id)
      .then(setCliente)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar esse cliente.'))
      .finally(() => setCarregando(false));
  }, [id]);

  // Só a moderadora acessa essa tela - mesma regra do backend, refletida aqui
  if (usuario && usuario.papel !== 'MODERADOR') {
    return <Navigate to="/" replace />;
  }

  function iniciarEdicao() {
    if (!cliente) return;
    setNome(cliente.nome);
    setTipoPessoa(cliente.tipoPessoa);
    setCpfCnpj(cliente.cpfCnpj ?? '');
    setTelefone(cliente.telefone ?? '');
    setEnderecoRua(cliente.enderecoRua ?? '');
    setEnderecoNumero(cliente.enderecoNumero ?? '');
    setEnderecoBairro(cliente.enderecoBairro ?? '');
    setEnderecoCidade(cliente.enderecoCidade ?? '');
    setEnderecoEstado(cliente.enderecoEstado ?? '');
    setEditando(true);
  }

  async function aoSalvar(evento: FormEvent) {
    evento.preventDefault();
    if (!cliente || !nome.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      const atualizado = await atualizarCliente(cliente.id, {
        nome: nome.trim(),
        tipoPessoa,
        cpfCnpj: cpfCnpj.trim() || undefined,
        telefone: telefone.trim() || undefined,
        enderecoRua: enderecoRua || undefined,
        enderecoNumero: enderecoNumero || undefined,
        enderecoBairro: enderecoBairro || undefined,
        enderecoCidade: enderecoCidade || undefined,
        enderecoEstado: enderecoEstado || undefined,
      });
      setCliente((prev) => (prev ? { ...prev, ...atualizado } : prev));
      setEditando(false);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar o cadastro.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-bg">
        <Topbar />
        <p className="py-10 text-center text-sm text-ink-soft">Carregando...</p>
      </div>
    );
  }

  if (erro && !cliente) {
    return (
      <div className="min-h-screen bg-bg">
        <Topbar />
        <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
          <BotaoVoltar />
          <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{erro}</p>
        </main>
      </div>
    );
  }

  if (!cliente) return null;

  const enderecoCompleto = [cliente.enderecoRua, cliente.enderecoNumero].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-bg">
      <Topbar />

      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        <BotaoVoltar />

        <div className="mb-5 rounded-lg border border-line bg-surface p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-lg font-bold text-ink">{cliente.nome}</h1>
              <p className="text-xs text-ink-soft">{cliente.tipoPessoa === 'FISICA' ? 'Pessoa física' : 'Pessoa jurídica'}</p>
            </div>
            {!editando && (
              <button
                type="button"
                onClick={iniciarEdicao}
                className="shrink-0 text-xs font-medium text-accent-ink underline"
              >
                Editar
              </button>
            )}
          </div>

          {!editando ? (
            <div className="mt-3 border-t border-line pt-3 text-sm">
              <p className="text-ink">{cliente.telefone || '—'}</p>
              <p className="font-mono text-ink-soft">{cliente.cpfCnpj || 'CPF/CNPJ não informado'}</p>
              {(enderecoCompleto || cliente.enderecoCidade) && (
                <p className="mt-1 text-ink-soft">
                  {enderecoCompleto}
                  {cliente.enderecoBairro ? ` · ${cliente.enderecoBairro}` : ''}
                  {cliente.enderecoCidade ? ` · ${cliente.enderecoCidade}${cliente.enderecoEstado ? `/${cliente.enderecoEstado}` : ''}` : ''}
                </p>
              )}
              {(!cliente.cpfCnpj || !cliente.telefone) && (
                <p className="mt-2 rounded-md bg-warning-bg px-2.5 py-1.5 text-xs text-warning">Cadastro incompleto</p>
              )}
            </div>
          ) : (
            <form onSubmit={aoSalvar} className="mt-3 flex flex-col gap-3 border-t border-line pt-3">
              <Campo rotulo="Nome" id="nomeCliente" value={nome} onChange={(e) => setNome(e.target.value)} required />
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-ink-soft">Tipo de pessoa</span>
                  <select
                    value={tipoPessoa}
                    onChange={(e) => setTipoPessoa(e.target.value as TipoPessoa)}
                    className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent"
                  >
                    <option value="FISICA">Física</option>
                    <option value="JURIDICA">Jurídica</option>
                  </select>
                </label>
                <Campo rotulo="CPF ou CNPJ" id="cpfCnpjCliente" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} />
              </div>
              <Campo rotulo="Telefone" id="telefoneCliente" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              <div className="grid grid-cols-3 gap-3">
                <Campo rotulo="Rua" id="enderecoRuaCliente" className="col-span-2" value={enderecoRua} onChange={(e) => setEnderecoRua(e.target.value)} />
                <Campo rotulo="Número" id="enderecoNumeroCliente" value={enderecoNumero} onChange={(e) => setEnderecoNumero(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Campo rotulo="Bairro" id="enderecoBairroCliente" value={enderecoBairro} onChange={(e) => setEnderecoBairro(e.target.value)} />
                <Campo rotulo="Cidade" id="enderecoCidadeCliente" value={enderecoCidade} onChange={(e) => setEnderecoCidade(e.target.value)} />
              </div>
              <Campo rotulo="Estado (UF)" id="enderecoEstadoCliente" maxLength={2} value={enderecoEstado} onChange={(e) => setEnderecoEstado(e.target.value.toUpperCase())} />
              <div className="flex gap-2">
                <Botao type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</Botao>
                <Botao type="button" variante="secundario" onClick={() => setEditando(false)}>Cancelar</Botao>
              </div>
            </form>
          )}
        </div>

        {erro && <p className="mb-4 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{erro}</p>}

        <div className="mb-5 rounded-lg border border-line bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink">Veículos</h2>
          {cliente.veiculos.length === 0 ? (
            <p className="text-sm text-ink-soft">Nenhum veículo cadastrado.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {cliente.veiculos.map((v) => (
                <li key={v.id} className="rounded-md border border-line px-3 py-2.5 text-sm">
                  <p className="font-mono font-bold tracking-wide text-ink">{v.placa}</p>
                  <p className="text-ink-soft">
                    {[v.modelo, v.marca, v.ano ? String(v.ano) : null, v.motor].filter(Boolean).join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-line bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink">Histórico de Ordens de Serviço</h2>
          {cliente.historico.length === 0 ? (
            <p className="text-sm text-ink-soft">Nenhuma OS ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {cliente.historico.map((os) => (
                <li key={os.id}>
                  <Link
                    to={`/os/${os.id}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-line px-3 py-2.5 text-sm hover:border-ink/40"
                  >
                    <div>
                      <p className="font-mono text-xs font-bold tracking-wide text-ink">{os.placa}</p>
                      <p className="text-xs text-ink-soft">{formatarData(os.createdAt)}</p>
                    </div>
                    <StatusTag status={os.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
