import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { Campo } from '../components/Campo';
import { Botao } from '../components/Botao';
import { BotaoVoltar } from '../components/BotaoVoltar';
import { buscarClientes } from '../lib/clientesApi';
import { buscarVeiculoPorPlaca } from '../lib/veiculosApi';
import { abrirOrdemServico } from '../lib/ordensServicoApi';
import { comprimirImagem, registrarFoto, solicitarUrlUpload, uploadParaR2 } from '../lib/fotosApi';
import { ApiError } from '../lib/api';
import type { Cliente, Foto, OrdemServico, TipoPessoa, Veiculo } from '../lib/types';

const CHECKLIST_FOTOS_ENTRADA = [
  { chave: 'frente', rotulo: 'Frente' },
  { chave: 'traseira', rotulo: 'Traseira' },
  { chave: 'lateral_esquerda', rotulo: 'Lateral esquerda' },
  { chave: 'lateral_direita', rotulo: 'Lateral direita' },
  { chave: 'area_problema', rotulo: 'Área do problema' },
] as const;

export function AbrirOS() {
  const navegar = useNavigate();

  // Passo 0: placa
  const [placa, setPlaca] = useState('');
  const [buscandoPlaca, setBuscandoPlaca] = useState(false);
  const [veiculoEncontrado, setVeiculoEncontrado] = useState<Veiculo | null | undefined>(undefined);
  const [veiculoConfirmado, setVeiculoConfirmado] = useState(false);
  const veiculoBuscado = veiculoEncontrado !== undefined;

  // Passo 1b: cliente (quando veiculo não existe)
  const [nomeBusca, setNomeBusca] = useState('');
  const [sugestoesClientes, setSugestoesClientes] = useState<Cliente[]>([]);
  const [buscandoClientes, setBuscandoClientes] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
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

  // Passo 1b: veiculo novo (quando não existe)
  const [modeloNovo, setModeloNovo] = useState('');
  const [marcaNova, setMarcaNova] = useState('');
  const [anoNovo, setAnoNovo] = useState('');
  const [veiculoNovoConfirmado, setVeiculoNovoConfirmado] = useState(false);

  // Passo 2: serviço
  const [kmRegistrado, setKmRegistrado] = useState('');
  const [queixaInicial, setQueixaInicial] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Passo 3: fotos (após OS criada)
  const [osCriada, setOsCriada] = useState<OrdemServico | null>(null);
  const [fotosEntrada, setFotosEntrada] = useState<Record<string, Foto>>({});
  const [enviandoFotoChave, setEnviandoFotoChave] = useState<string | null>(null);
  const [erroFotoEntrada, setErroFotoEntrada] = useState<string | null>(null);

  const clienteResolvido = clienteSelecionado !== null || clienteNovoConfirmado;
  const veiculoNovoResolvido = veiculoNovoConfirmado;

  const mostraServico =
    (veiculoEncontrado !== null && veiculoEncontrado !== undefined && veiculoConfirmado) ||
    (veiculoEncontrado === null && clienteResolvido && veiculoNovoResolvido);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (veiculoEncontrado !== null || clienteResolvido) {
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
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [nomeBusca, clienteResolvido, veiculoEncontrado]);

  async function buscarPlaca() {
    const placaNorm = placa.trim().toUpperCase();
    if (!placaNorm) return;
    setBuscandoPlaca(true);
    setErro(null);
    try {
      const { veiculo } = await buscarVeiculoPorPlaca(placaNorm);
      setVeiculoEncontrado(veiculo);
    } catch {
      setErro('Não foi possível verificar a placa. Tente de novo.');
    } finally {
      setBuscandoPlaca(false);
    }
  }

  function aoApertarTeclaPlaca(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); buscarPlaca(); }
  }

  function voltarParaPlaca() {
    setVeiculoEncontrado(undefined);
    setVeiculoConfirmado(false);
    setClienteSelecionado(null);
    setCadastrandoCliente(false);
    setClienteNovoConfirmado(false);
    setNomeBusca('');
    setCpfCnpjCliente('');
    setTipoPessoaCliente('FISICA');
    setTelefoneCliente('');
    setEnderecoRuaCliente('');
    setEnderecoNumeroCliente('');
    setEnderecoBairroCliente('');
    setEnderecoCidadeCliente('');
    setEnderecoEstadoCliente('');
    setModeloNovo('');
    setMarcaNova('');
    setAnoNovo('');
    setVeiculoNovoConfirmado(false);
    setKmRegistrado('');
    setQueixaInicial('');
    setErro(null);
  }

  function selecionarCliente(cliente: Cliente) {
    setClienteSelecionado(cliente);
    setSugestoesClientes([]);
  }

  function avancarCliente() {
    const nome = nomeBusca.trim();
    if (!nome) return;
    const exato = sugestoesClientes.find((c) => c.nome.toLowerCase() === nome.toLowerCase());
    if (exato) { selecionarCliente(exato); }
    else { setCadastrandoCliente(true); }
  }

  function aoApertarTeclaCliente(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); avancarCliente(); }
  }

  function confirmarClienteNovo() {
    if (!nomeBusca.trim() || !cpfCnpjCliente.trim() || !telefoneCliente.trim()) return;
    setClienteNovoConfirmado(true);
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
    setVeiculoNovoConfirmado(false);
    setModeloNovo('');
    setMarcaNova('');
    setAnoNovo('');
  }

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const os = await abrirOrdemServico({
        placa: placa.trim().toUpperCase(),
        kmRegistrado: kmRegistrado ? Number(kmRegistrado) : undefined,
        queixaInicial: queixaInicial || undefined,
        ...(veiculoEncontrado
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
                  }),
            }),
      });
      setOsCriada(os);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível abrir a OS.');
    } finally {
      setEnviando(false);
    }
  }

  async function aoAdicionarFotoEntrada(chave: string, rotulo: string, evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!arquivo || !osCriada) return;

    setEnviandoFotoChave(chave);
    setErroFotoEntrada(null);
    try {
      const comprimido = await comprimirImagem(arquivo);
      const { uploadUrl, key } = await solicitarUrlUpload(osCriada.id, comprimido.type);
      await uploadParaR2(uploadUrl, comprimido);
      const novaFoto = await registrarFoto(osCriada.id, key, 'FOTO', rotulo, 'ENTRADA');
      setFotosEntrada((prev) => ({ ...prev, [chave]: novaFoto }));
    } catch (e) {
      setErroFotoEntrada(e instanceof Error ? e.message : 'Não foi possível enviar a foto.');
    } finally {
      setEnviandoFotoChave(null);
    }
  }

  // === TELA DE FOTOS (pós-criação) ===
  if (osCriada) {
    const totalFotos = Object.keys(fotosEntrada).length;
    return (
      <div className="min-h-screen bg-bg">
        <Topbar />
        <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
          <h1 className="mb-1 font-display text-xl font-bold text-ink">Fotos de entrada</h1>
          <p className="mb-2 text-sm text-ink-soft">
            Registre o estado do veículo antes de iniciar o serviço.
          </p>

          <div className="mb-4 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${(totalFotos / CHECKLIST_FOTOS_ENTRADA.length) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-medium text-ink-soft">
              {totalFotos}/{CHECKLIST_FOTOS_ENTRADA.length}
            </span>
          </div>

          {erroFotoEntrada && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erroFotoEntrada}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {CHECKLIST_FOTOS_ENTRADA.map((item) => {
              const foto = fotosEntrada[item.chave];
              const enviandoEsta = enviandoFotoChave === item.chave;
              return (
                <label key={item.chave} className="cursor-pointer">
                  <div
                    className={`relative aspect-square w-full overflow-hidden rounded-xl border-2 transition-colors ${
                      foto
                        ? 'border-green-500 bg-black'
                        : 'border-dashed border-line bg-bg hover:border-ink/30'
                    }`}
                  >
                    {foto ? (
                      <>
                        <img src={foto.url} alt={item.rotulo} className="h-full w-full object-cover opacity-90" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        </div>
                      </>
                    ) : enviandoEsta ? (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-xs text-ink-soft">Enviando...</p>
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-soft">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 7h3l2-2h6l2 2h3v12H4z" />
                          <circle cx="12" cy="13" r="3" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 text-center text-xs font-medium text-ink">{item.rotulo}</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => aoAdicionarFotoEntrada(item.chave, item.rotulo, e)}
                    disabled={enviandoEsta}
                  />
                </label>
              );
            })}
          </div>

          <Botao
            type="button"
            onClick={() => navegar(`/os/${osCriada.id}`)}
            disabled={totalFotos === 0}
            className="mt-6 w-full"
          >
            {totalFotos === 0 ? 'Adicione ao menos 1 foto para concluir' : 'Concluir e ir para a OS'}
          </Botao>
        </main>
      </div>
    );
  }

  // === FORMULÁRIO PRINCIPAL ===
  return (
    <div className="min-h-screen bg-bg">
      <Topbar />
      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        <BotaoVoltar />
        <h1 className="mb-5 font-display text-xl font-bold text-ink">Abrir Ordem de Serviço</h1>

        <form onSubmit={aoEnviar} className="flex flex-col gap-5">
          {/* Passo 0: Placa */}
          <div className="rounded-lg border border-line bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink">Placa do veículo</h2>

            {!veiculoBuscado ? (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Campo
                    rotulo="Placa"
                    id="placa"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    onKeyDown={aoApertarTeclaPlaca}
                    className="font-mono text-lg uppercase tracking-widest"
                    placeholder="ABC1234"
                    autoComplete="off"
                    maxLength={8}
                  />
                </div>
                <button
                  type="button"
                  onClick={buscarPlaca}
                  disabled={!placa.trim() || buscandoPlaca}
                  aria-label="Buscar placa"
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-ink/90 disabled:opacity-40"
                >
                  {buscandoPlaca ? (
                    <span className="text-xs">...</span>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-md bg-accent-soft px-3 py-2.5 text-sm">
                <p className="font-mono font-bold tracking-widest text-ink">{placa.toUpperCase()}</p>
                <button type="button" onClick={voltarParaPlaca} className="text-xs font-medium text-accent-ink underline">
                  Trocar
                </button>
              </div>
            )}
          </div>

          {/* Confirmação de carro encontrado */}
          {veiculoBuscado && veiculoEncontrado && !veiculoConfirmado && (
            <div className="rounded-lg border border-accent bg-accent-soft p-4">
              <p className="mb-1 text-xs font-medium text-ink-soft">Carro encontrado — é esse?</p>
              <p className="font-mono text-base font-bold text-ink">{veiculoEncontrado.placa}</p>
              <p className="text-sm text-ink">
                {veiculoEncontrado.modelo}
                {veiculoEncontrado.marca ? ` · ${veiculoEncontrado.marca}` : ''}
                {veiculoEncontrado.ano ? ` · ${veiculoEncontrado.ano}` : ''}
              </p>
              <p className="mt-1 text-xs text-ink-soft">Cliente: {veiculoEncontrado.cliente.nome}</p>
              <div className="mt-3 flex gap-2">
                <Botao type="button" onClick={() => setVeiculoConfirmado(true)}>
                  Sim, é esse
                </Botao>
                <Botao type="button" variante="secundario" onClick={voltarParaPlaca}>
                  Não é esse
                </Botao>
              </div>
            </div>
          )}

          {/* Placa não encontrada — fluxo de cliente novo */}
          {veiculoBuscado && veiculoEncontrado === null && (
            <>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Placa não encontrada. Preencha os dados do cliente e do carro para cadastrar.
              </div>

              {/* Cliente */}
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
                          onKeyDown={aoApertarTeclaCliente}
                          placeholder="Comece a digitar o nome..."
                          autoComplete="off"
                        />
                        {sugestoesClientes.length > 0 && (
                          <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-line bg-white shadow-md">
                            {sugestoesClientes.map((c) => (
                              <li key={c.id}>
                                <button type="button" onClick={() => selecionarCliente(c)} className="block w-full px-3 py-2.5 text-left text-sm hover:bg-bg">
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
                          Cadastrando <span className="font-medium text-ink">{nomeBusca.trim()}</span> como cliente novo:
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
                          <Campo rotulo="Rua" id="enderecoRua" className="col-span-2" value={enderecoRuaCliente} onChange={(e) => setEnderecoRuaCliente(e.target.value)} />
                          <Campo rotulo="Número" id="enderecoNumero" value={enderecoNumeroCliente} onChange={(e) => setEnderecoNumeroCliente(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Campo rotulo="Bairro" id="enderecoBairro" value={enderecoBairroCliente} onChange={(e) => setEnderecoBairroCliente(e.target.value)} />
                          <Campo rotulo="Cidade" id="enderecoCidade" value={enderecoCidadeCliente} onChange={(e) => setEnderecoCidadeCliente(e.target.value)} />
                        </div>
                        <Campo rotulo="Estado (UF)" id="enderecoEstado" maxLength={2} value={enderecoEstadoCliente} onChange={(e) => setEnderecoEstadoCliente(e.target.value.toUpperCase())} />
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
                    <button type="button" onClick={trocarCliente} className="text-xs font-medium text-accent-ink underline">Trocar</button>
                  </div>
                )}
              </div>

              {/* Carro novo */}
              {clienteResolvido && (
                <div className="rounded-lg border border-line bg-white p-4">
                  <h2 className="mb-3 text-sm font-semibold text-ink">Dados do veículo</h2>

                  {!veiculoNovoResolvido ? (
                    <div className="flex flex-col gap-3">
                      <div className="rounded-md bg-bg px-3 py-2 text-sm">
                        <span className="text-xs text-ink-soft">Placa: </span>
                        <span className="font-mono font-bold tracking-widest">{placa.toUpperCase()}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <Campo rotulo="Modelo" id="modeloNovo" className="col-span-2" value={modeloNovo} onChange={(e) => setModeloNovo(e.target.value)} required />
                        <Campo rotulo="Ano" id="anoNovo" type="number" inputMode="numeric" value={anoNovo} onChange={(e) => setAnoNovo(e.target.value)} />
                      </div>
                      <Campo rotulo="Marca (opcional)" id="marcaNova" value={marcaNova} onChange={(e) => setMarcaNova(e.target.value)} />
                      <Botao
                        type="button"
                        onClick={() => setVeiculoNovoConfirmado(true)}
                        disabled={!modeloNovo.trim()}
                        className="self-start"
                      >
                        Confirmar carro
                      </Botao>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-md bg-accent-soft px-3 py-2.5 text-sm">
                      <div>
                        <p className="font-mono font-bold tracking-widest text-ink">{placa.toUpperCase()}</p>
                        <p className="text-ink-soft">{modeloNovo}</p>
                      </div>
                      <button type="button" onClick={() => setVeiculoNovoConfirmado(false)} className="text-xs font-medium text-accent-ink underline">Editar</button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Passo 2: Serviço */}
          {mostraServico && (
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

          {mostraServico && (
            <Botao type="submit" disabled={enviando}>
              {enviando ? 'Abrindo...' : 'Abrir Ordem de Serviço'}
            </Botao>
          )}
        </form>
      </main>
    </div>
  );
}
