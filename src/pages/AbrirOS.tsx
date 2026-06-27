import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { Campo } from '../components/Campo';
import { Botao } from '../components/Botao';
import { BotaoVoltar } from '../components/BotaoVoltar';
import { buscarClientes, listarVeiculosDoCliente } from '../lib/clientesApi';
import { abrirOrdemServico } from '../lib/ordensServicoApi';
import { ApiError } from '../lib/api';
import type { Cliente, TipoPessoa, Veiculo } from '../lib/types';

export function AbrirOS() {
  const navegar = useNavigate();

  // Etapa 1: cliente (busca por nome, com autocomplete)
  const [nomeBusca, setNomeBusca] = useState('');
  const [sugestoesClientes, setSugestoesClientes] = useState<Cliente[]>([]);
  const [buscandoClientes, setBuscandoClientes] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

  // Cadastro de cliente novo (aparece quando não acha o nome digitado)
  const [cadastrandoCliente, setCadastrandoCliente] = useState(false);
  const [clienteNovoConfirmado, setClienteNovoConfirmado] = useState(false);
  const [cpfCnpjCliente, setCpfCnpjCliente] = useState('');
  const [tipoPessoaCliente, setTipoPessoaCliente] = useState<TipoPessoa>('FISICA');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [enderecoRuaCliente, setEnderecoRuaCliente] = useState('');
  const [enderecoNumeroCliente, setEnderecoNumeroCliente] = useState('');
  const [enderecoBairroCliente, setEnderecoBairroCliente] = useState('');
  const [enderecoCidadeCliente, setEnderecoCidadeCliente] = useState('');
  const [enderecoEstadoCliente, setEnderecoEstadoCliente] = useState('');
  const [enderecoCepCliente, setEnderecoCepCliente] = useState('');

  // Etapa 2: carro do cliente (lista, ou cadastro de carro novo)
  const [veiculosDoCliente, setVeiculosDoCliente] = useState<Veiculo[] | null>(null);
  const [carregandoVeiculos, setCarregandoVeiculos] = useState(false);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<Veiculo | null>(null);
  const [mostrarNovoVeiculo, setMostrarNovoVeiculo] = useState(false);
  const [veiculoNovoConfirmado, setVeiculoNovoConfirmado] = useState(false);
  const [placaNova, setPlacaNova] = useState('');
  const [modeloNovo, setModeloNovo] = useState('');
  const [marcaNova, setMarcaNova] = useState('');
  const [anoNovo, setAnoNovo] = useState('');

  // Etapa 3: serviço
  const [kmRegistrado, setKmRegistrado] = useState('');
  const [queixaInicial, setQueixaInicial] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const clienteResolvido = clienteSelecionado || clienteNovoConfirmado;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Busca clientes por nome, com debounce. Roda mesmo com o campo vazio -
  // assim a lista de clientes já cadastrados aparece de cara, sem precisar
  // digitar nada (mais fácil de selecionar do que escrever, principalmente no celular).
  useEffect(() => {
    if (clienteResolvido) {
      setSugestoesClientes([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setBuscandoClientes(true);
      buscarClientes(nomeBusca.trim())
        .then(setSugestoesClientes)
        .catch(() => setSugestoesClientes([]))
        .finally(() => setBuscandoClientes(false));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nomeBusca, clienteResolvido]);

  function selecionarCliente(cliente: Cliente) {
    setClienteSelecionado(cliente);
    setSugestoesClientes([]);
    setCarregandoVeiculos(true);
    listarVeiculosDoCliente(cliente.id)
      .then((veiculos) => {
        setVeiculosDoCliente(veiculos);
        // Cliente sem nenhum carro ainda -> já abre direto o cadastro de carro novo
        if (veiculos.length === 0) setMostrarNovoVeiculo(true);
      })
      .catch(() => setVeiculosDoCliente([]))
      .finally(() => setCarregandoVeiculos(false));
  }

  // Clicar na seta (ou apertar Enter) com o nome digitado: se bater exatamente
  // com algum cliente já cadastrado, seleciona ele; se não, já abre o
  // cadastro de cliente novo direto, sem precisar clicar em outro link.
  function avancarCliente() {
    const nome = nomeBusca.trim();
    if (!nome) return;

    const correspondenciaExata = sugestoesClientes.find((c) => c.nome.toLowerCase() === nome.toLowerCase());
    if (correspondenciaExata) {
      selecionarCliente(correspondenciaExata);
    } else {
      setCadastrandoCliente(true);
    }
  }

  function aoApertarTecla(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      avancarCliente();
    }
  }

  function confirmarClienteNovo() {
    if (!nomeBusca.trim() || !cpfCnpjCliente.trim() || !telefoneCliente.trim()) return;
    setClienteNovoConfirmado(true);
    setVeiculosDoCliente([]); // cliente novo nunca tem carro cadastrado ainda
    setMostrarNovoVeiculo(true);
  }

  function trocarCliente() {
    setClienteSelecionado(null);
    setClienteNovoConfirmado(false);
    setCadastrandoCliente(false);
    setNomeBusca('');
    setSugestoesClientes([]);
    setCpfCnpjCliente('');
    setTipoPessoaCliente('FISICA');
    setTelefoneCliente('');
    setEnderecoRuaCliente('');
    setEnderecoNumeroCliente('');
    setEnderecoBairroCliente('');
    setEnderecoCidadeCliente('');
    setEnderecoEstadoCliente('');
    setEnderecoCepCliente('');
    setVeiculosDoCliente(null);
    setVeiculoSelecionado(null);
    setMostrarNovoVeiculo(false);
    setVeiculoNovoConfirmado(false);
    setPlacaNova('');
    setModeloNovo('');
    setMarcaNova('');
    setAnoNovo('');
  }

  function trocarVeiculo() {
    setVeiculoSelecionado(null);
    setMostrarNovoVeiculo(false);
    setVeiculoNovoConfirmado(false);
    setPlacaNova('');
    setModeloNovo('');
    setMarcaNova('');
    setAnoNovo('');
  }

  // IMPORTANTE: o carro novo só conta como "resolvido" depois de clicar em
  // "Confirmar carro" - nunca automaticamente enquanto a pessoa ainda está
  // digitando o modelo/ano (isso é o que causava o avanço sozinho no meio da digitação).
  const veiculoResolvido = veiculoSelecionado || (mostrarNovoVeiculo && veiculoNovoConfirmado);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const placa = veiculoSelecionado ? veiculoSelecionado.placa : placaNova.trim();

      const os = await abrirOrdemServico({
        placa,
        kmRegistrado: kmRegistrado ? Number(kmRegistrado) : undefined,
        queixaInicial: queixaInicial || undefined,
        ...(veiculoSelecionado
          ? {}
          : {
              modelo: modeloNovo,
              marca: marcaNova || undefined,
              ano: anoNovo ? Number(anoNovo) : undefined,
              cpfCnpjCliente: clienteSelecionado ? clienteSelecionado.cpfCnpj : cpfCnpjCliente.trim(),
              ...(clienteSelecionado
                ? {}
                : {
                    nomeCliente: nomeBusca.trim(),
                    tipoPessoaCliente,
                    telefoneCliente,
                    enderecoRuaCliente: enderecoRuaCliente || undefined,
                    enderecoNumeroCliente: enderecoNumeroCliente || undefined,
                    enderecoBairroCliente: enderecoBairroCliente || undefined,
                    enderecoCidadeCliente: enderecoCidadeCliente || undefined,
                    enderecoEstadoCliente: enderecoEstadoCliente || undefined,
                    enderecoCepCliente: enderecoCepCliente || undefined,
                  }),
            }),
      });
      navegar(`/os/${os.id}`);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível abrir a OS.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <Topbar />

      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        <BotaoVoltar />
        <h1 className="mb-5 font-display text-xl font-bold text-ink">Abrir Ordem de Serviço</h1>

        <form onSubmit={aoEnviar} className="flex flex-col gap-5">
          {/* Etapa 1: Cliente */}
          <div className="rounded-lg border border-line bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink">Cliente</h2>

            {!clienteResolvido ? (
              <>
                <div className="flex items-end gap-2">
                  <div className="relative flex-1">
                    <Campo
                      rotulo="Nome do cliente"
                      id="nomeBusca"
                      value={nomeBusca}
                      onChange={(e) => setNomeBusca(e.target.value)}
                      onKeyDown={aoApertarTecla}
                      placeholder="Comece a digitar o nome..."
                      autoComplete="off"
                    />

                    {sugestoesClientes.length > 0 && (
                      <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-line bg-white shadow-md">
                        {sugestoesClientes.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => selecionarCliente(c)}
                              className="block w-full px-3 py-2.5 text-left text-sm hover:bg-bg"
                            >
                              <span className="font-medium text-ink">{c.nome}</span>
                              <span className="ml-2 text-xs text-ink-soft">{c.telefone}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={avancarCliente}
                    disabled={!nomeBusca.trim()}
                    aria-label="Continuar"
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-ink/90 disabled:opacity-40"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>

                {buscandoClientes && <p className="mt-2 text-xs text-ink-soft">Buscando...</p>}

                {cadastrandoCliente && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
                    <p className="text-xs text-ink-soft">
                      Cadastrando <span className="font-medium text-ink">{nomeBusca.trim() || '(informe o nome acima)'}</span> como cliente novo:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-ink-soft">Tipo de pessoa</span>
                        <select
                          value={tipoPessoaCliente}
                          onChange={(e) => setTipoPessoaCliente(e.target.value as TipoPessoa)}
                          className="rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-accent"
                        >
                          <option value="FISICA">Física</option>
                          <option value="JURIDICA">Jurídica</option>
                        </select>
                      </label>
                      <Campo rotulo="CPF ou CNPJ" id="cpfCnpjCliente" value={cpfCnpjCliente} onChange={(e) => setCpfCnpjCliente(e.target.value)} required />
                    </div>
                    <Campo rotulo="Telefone" id="telefoneCliente" value={telefoneCliente} onChange={(e) => setTelefoneCliente(e.target.value)} required />
                    <div className="grid grid-cols-3 gap-3">
                      <Campo rotulo="Rua" id="enderecoRuaCliente" className="col-span-2" value={enderecoRuaCliente} onChange={(e) => setEnderecoRuaCliente(e.target.value)} />
                      <Campo rotulo="Número" id="enderecoNumeroCliente" value={enderecoNumeroCliente} onChange={(e) => setEnderecoNumeroCliente(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Campo rotulo="Bairro" id="enderecoBairroCliente" value={enderecoBairroCliente} onChange={(e) => setEnderecoBairroCliente(e.target.value)} />
                      <Campo rotulo="Cidade" id="enderecoCidadeCliente" value={enderecoCidadeCliente} onChange={(e) => setEnderecoCidadeCliente(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Campo rotulo="Estado (UF)" id="enderecoEstadoCliente" maxLength={2} value={enderecoEstadoCliente} onChange={(e) => setEnderecoEstadoCliente(e.target.value.toUpperCase())} />
                      <Campo rotulo="CEP" id="enderecoCepCliente" value={enderecoCepCliente} onChange={(e) => setEnderecoCepCliente(e.target.value)} />
                    </div>
                    <Botao
                      type="button"
                      onClick={confirmarClienteNovo}
                      disabled={!nomeBusca.trim() || !cpfCnpjCliente.trim() || !telefoneCliente.trim()}
                      className="self-start"
                    >
                      Confirmar cliente novo
                    </Botao>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between rounded-md bg-accent-soft px-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-ink">{clienteSelecionado ? clienteSelecionado.nome : nomeBusca.trim()}</p>
                  <p className="text-ink-soft">{clienteSelecionado ? 'Cliente já cadastrado' : 'Cliente novo'}</p>
                </div>
                <button type="button" onClick={trocarCliente} className="text-xs font-medium text-accent-ink underline">
                  Trocar
                </button>
              </div>
            )}
          </div>

          {/* Etapa 2: Carro - só aparece depois do cliente resolvido */}
          {clienteResolvido && (
            <div className="rounded-lg border border-line bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-ink">Veículo</h2>

              {carregandoVeiculos && <p className="text-sm text-ink-soft">Carregando carros do cliente...</p>}

              {!carregandoVeiculos && !veiculoResolvido && (
                <div className="flex flex-col gap-2">
                  {veiculosDoCliente && veiculosDoCliente.length > 0 && (
                    <ul className="flex flex-col gap-2">
                      {veiculosDoCliente.map((v) => (
                        <li key={v.id}>
                          <button
                            type="button"
                            onClick={() => setVeiculoSelecionado(v)}
                            className="flex w-full items-center justify-between rounded-md border border-line px-3 py-2.5 text-left text-sm hover:border-ink/40"
                          >
                            <span>
                              <span className="font-mono font-medium text-ink">{v.placa}</span>
                              <span className="ml-2 text-ink-soft">
                                {v.modelo} {v.marca ? `· ${v.marca}` : ''} {v.ano ? `· ${v.ano}` : ''}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {!mostrarNovoVeiculo && (
                    <button
                      type="button"
                      onClick={() => setMostrarNovoVeiculo(true)}
                      className="self-start text-xs font-medium text-accent-ink underline"
                    >
                      + Novo carro
                    </button>
                  )}

                  {mostrarNovoVeiculo && (
                    <div className="mt-2 flex flex-col gap-3 border-t border-line pt-3">
                      <Campo
                        rotulo="Placa"
                        id="placaNova"
                        value={placaNova}
                        onChange={(e) => setPlacaNova(e.target.value.toUpperCase())}
                        className="font-mono uppercase"
                        required
                      />
                      <div className="grid grid-cols-3 gap-3">
                        <Campo rotulo="Modelo" id="modeloNovo" className="col-span-2" value={modeloNovo} onChange={(e) => setModeloNovo(e.target.value)} required />
                        <Campo rotulo="Ano" id="anoNovo" type="number" inputMode="numeric" value={anoNovo} onChange={(e) => setAnoNovo(e.target.value)} />
                      </div>
                      <Campo rotulo="Marca (opcional)" id="marcaNova" value={marcaNova} onChange={(e) => setMarcaNova(e.target.value)} />
                      <Botao
                        type="button"
                        onClick={() => setVeiculoNovoConfirmado(true)}
                        disabled={!placaNova.trim() || !modeloNovo.trim()}
                        className="self-start"
                      >
                        Confirmar carro
                      </Botao>
                    </div>
                  )}
                </div>
              )}

              {!carregandoVeiculos && veiculoResolvido && (
                <div className="flex items-center justify-between rounded-md bg-accent-soft px-3 py-2.5 text-sm">
                  <div>
                    {veiculoSelecionado ? (
                      <>
                        <p className="font-mono font-medium text-ink">{veiculoSelecionado.placa}</p>
                        <p className="text-ink-soft">{veiculoSelecionado.modelo}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-mono font-medium text-ink">{placaNova}</p>
                        <p className="text-ink-soft">Carro novo · {modeloNovo}</p>
                      </>
                    )}
                  </div>
                  <button type="button" onClick={trocarVeiculo} className="text-xs font-medium text-accent-ink underline">
                    Trocar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Etapa 3: Serviço - só aparece depois do carro resolvido */}
          {clienteResolvido && veiculoResolvido && (
            <div className="rounded-lg border border-line bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-ink">Serviço</h2>
              <div className="flex flex-col gap-3">
                <Campo
                  rotulo="Km atual (opcional)"
                  id="kmRegistrado"
                  type="number"
                  inputMode="numeric"
                  value={kmRegistrado}
                  onChange={(e) => setKmRegistrado(e.target.value)}
                />
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-ink-soft">Queixa inicial (o que o cliente relatou)</span>
                  <textarea
                    value={queixaInicial}
                    onChange={(e) => setQueixaInicial(e.target.value)}
                    rows={3}
                    className="rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-accent"
                    placeholder='Ex: "Carro dando tranco na troca de marcha"'
                  />
                </label>
              </div>
            </div>
          )}

          {erro && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

          {clienteResolvido && veiculoResolvido && (
            <Botao type="submit" disabled={enviando}>
              {enviando ? 'Abrindo...' : 'Abrir Ordem de Serviço'}
            </Botao>
          )}
        </form>
      </main>
    </div>
  );
}