import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { StatusTag } from '../components/StatusTag';
import { Botao } from '../components/Botao';
import { Campo } from '../components/Campo';
import { BotaoVoltar } from '../components/BotaoVoltar';
import { useAuth } from '../lib/AuthContext';
import { ApiError } from '../lib/api';
import {
  adicionarItemMaoDeObra,
  adicionarObservacao,
  atualizarOrdemServico,
  atualizarStatusOrdemServico,
  buscarOrdemServico,
  buscarSugestoesMaoDeObra,
  listarOrdensServico,
  removerItemMaoDeObra,
  type SugestaoMaoDeObra,
} from '../lib/ordensServicoApi';
import { comprimirImagem, cortarVideo, deletarFoto, MAX_DURACAO_VIDEO_S, obterDuracaoVideo, registrarFoto, solicitarUrlUpload, uploadParaR2 } from '../lib/fotosApi';
import { formatarCentavos, paraCentavos } from '../lib/moeda';
import type { OrdemServico, StatusOrdemServico, TipoMidia, TipoValorMaoDeObra } from '../lib/types';

const PROXIMO_STATUS: Partial<Record<StatusOrdemServico, { valor: StatusOrdemServico; rotulo: string }>> = {
  EM_ANDAMENTO: { valor: 'FINALIZADO', rotulo: 'Finalizar Ordem de Serviço' },
};

function formatarSegundos(s: number): string {
  const min = Math.floor(s / 60);
  const seg = Math.floor(s % 60);
  return `${min}:${String(seg).padStart(2, '0')}`;
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function DetalheOS() {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const ehModerador = usuario?.papel === 'MODERADOR';

  const [os, setOs] = useState<OrdemServico | null>(null);
  const [historico, setHistorico] = useState<OrdemServico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Edição de km
  const [editandoKm, setEditandoKm] = useState(false);
  const [kmRegistrado, setKmRegistrado] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Nova observação
  const [novaObservacao, setNovaObservacao] = useState('');
  const [enviandoObservacao, setEnviandoObservacao] = useState(false);

  // Mão de obra - novo lançamento
  const [mostrarFormItem, setMostrarFormItem] = useState(false);
  const [tipoValorNovo, setTipoValorNovo] = useState<TipoValorMaoDeObra>('HORAS');
  const [descricaoItemNovo, setDescricaoItemNovo] = useState('');
  const [horasNovo, setHorasNovo] = useState('');
  const [valorHoraNovo, setValorHoraNovo] = useState('');
  const [valorFechadoNovo, setValorFechadoNovo] = useState('');
  const [enviandoItem, setEnviandoItem] = useState(false);
  const [removendoItemId, setRemovendoItemId] = useState<string | null>(null);

  // Fotos
  const [uploadandoFoto, setUploadandoFoto] = useState(false);
  const [removendoFotoId, setRemovendoFotoId] = useState<string | null>(null);
  const [erroFoto, setErroFoto] = useState<string | null>(null);
  const erroFotoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [videoParaCortar, setVideoParaCortar] = useState<{ arquivo: File; duracao: number } | null>(null);
  const [videoParaCortarUrl, setVideoParaCortarUrl] = useState<string | null>(null);
  const [inicioCorteSeg, setInicioCorteSeg] = useState(0);
  const [cortandoVideo, setCortandoVideo] = useState(false);
  const [sugestoesItem, setSugestoesItem] = useState<SugestaoMaoDeObra[]>([]);
  const debounceSugestaoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;
    carregar();
  }, [id]);

  function carregar() {
    if (!id) return;
    setCarregando(true);
    setErro(null);
    buscarOrdemServico(id)
      .then((dados) => {
        setOs(dados);
        setKmRegistrado(dados.kmRegistrado != null ? String(dados.kmRegistrado) : '');
        return listarOrdensServico({ veiculoId: dados.veiculoId });
      })
      .then((todas) => setHistorico(todas.filter((item) => item.id !== id)))
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar essa OS.'))
      .finally(() => setCarregando(false));
  }

  // Mecânico não edita OS num estado final (finalizada/recusada) - moderador sim
  const estadosFinais: StatusOrdemServico[] = ['FINALIZADO', 'REJEITADO'];
  const podeEditar = os && (!estadosFinais.includes(os.status) || ehModerador);

  async function salvarKm() {
    if (!os) return;
    setSalvando(true);
    setErro(null);
    try {
      const atualizado = await atualizarOrdemServico(os.id, {
        kmRegistrado: kmRegistrado ? Number(kmRegistrado) : undefined,
      });
      setOs(atualizado);
      setEditandoKm(false);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  async function aoAdicionarObservacao(evento: FormEvent) {
    evento.preventDefault();
    if (!os || !novaObservacao.trim()) return;
    setEnviandoObservacao(true);
    setErro(null);
    try {
      const atualizado = await adicionarObservacao(os.id, novaObservacao.trim());
      setOs(atualizado);
      setNovaObservacao('');
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível adicionar a observação.');
    } finally {
      setEnviandoObservacao(false);
    }
  }

  async function avançarStatus(novoStatus: StatusOrdemServico) {
    if (!os) return;
    setSalvando(true);
    setErro(null);
    try {
      const atualizado = await atualizarStatusOrdemServico(os.id, novoStatus);
      setOs(atualizado);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível trocar o status.');
    } finally {
      setSalvando(false);
    }
  }

  async function aoAdicionarItem(evento: FormEvent) {
    evento.preventDefault();
    if (!os || !descricaoItemNovo.trim()) return;

    const horasNumero = horasNovo ? Number(horasNovo.replace(',', '.')) : undefined;
    const valorHoraCentavos = valorHoraNovo ? paraCentavos(valorHoraNovo) ?? undefined : undefined;
    const valorFechadoCentavos = valorFechadoNovo ? paraCentavos(valorFechadoNovo) ?? undefined : undefined;

    setEnviandoItem(true);
    setErro(null);
    try {
      const atualizado = await adicionarItemMaoDeObra(os.id, {
        descricao: descricaoItemNovo.trim(),
        tipoValor: tipoValorNovo,
        horas: tipoValorNovo === 'HORAS' ? horasNumero : undefined,
        valorHoraCentavos: tipoValorNovo === 'HORAS' ? valorHoraCentavos : undefined,
        valorFechadoCentavos: tipoValorNovo === 'FECHADO' ? valorFechadoCentavos : undefined,
      });
      setOs(atualizado);
      setDescricaoItemNovo('');
      setHorasNovo('');
      setValorHoraNovo('');
      setValorFechadoNovo('');
      setSugestoesItem([]);
      setMostrarFormItem(false);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível lançar a mão de obra.');
    } finally {
      setEnviandoItem(false);
    }
  }

  async function aoRemoverItem(itemId: string) {
    if (!os) return;
    const confirmado = window.confirm('Remover esse lançamento de mão de obra?');
    if (!confirmado) return;

    setRemovendoItemId(itemId);
    setErro(null);
    try {
      const atualizado = await removerItemMaoDeObra(os.id, itemId);
      setOs(atualizado);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível remover esse item.');
    } finally {
      setRemovendoItemId(null);
    }
  }

  function mostrarErroFoto(msg: string) {
    setErroFoto(msg);
    if (erroFotoTimerRef.current) clearTimeout(erroFotoTimerRef.current);
    erroFotoTimerRef.current = setTimeout(() => setErroFoto(null), 5000);
  }

  useEffect(() => {
    if (!videoParaCortar) { setVideoParaCortarUrl(null); return; }
    const url = URL.createObjectURL(videoParaCortar.arquivo);
    setVideoParaCortarUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoParaCortar]);

  async function enviarArquivo(arquivoFinal: File, tipo: TipoMidia) {
    if (!os) return;
    const { uploadUrl, key } = await solicitarUrlUpload(os.id, arquivoFinal.type);
    await uploadParaR2(uploadUrl, arquivoFinal);
    const novaFoto = await registrarFoto(os.id, key, tipo);
    setOs((prev) => prev ? { ...prev, fotos: [...prev.fotos, novaFoto] } : prev);
  }

  async function aoAdicionarFoto(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo || !os) return;
    evento.target.value = '';

    const isVideo = arquivo.type.startsWith('video/');
    setUploadandoFoto(true);
    setErroFoto(null);
    try {
      let arquivoFinal = arquivo;
      if (isVideo) {
        const duracao = await obterDuracaoVideo(arquivo);
        if (duracao > MAX_DURACAO_VIDEO_S) {
          setVideoParaCortar({ arquivo, duracao });
          setInicioCorteSeg(0);
          return;
        }
      } else {
        arquivoFinal = await comprimirImagem(arquivo);
      }
      await enviarArquivo(arquivoFinal, isVideo ? 'VIDEO' : 'FOTO');
    } catch (e) {
      mostrarErroFoto(e instanceof Error ? e.message : 'Não foi possível enviar a mídia.');
    } finally {
      setUploadandoFoto(false);
    }
  }

  async function aoEnviarVideoComCorte() {
    if (!videoParaCortar || !os) return;
    const fimCorteSeg = Math.min(inicioCorteSeg + MAX_DURACAO_VIDEO_S, videoParaCortar.duracao);
    setCortandoVideo(true);
    try {
      const cortado = await cortarVideo(videoParaCortar.arquivo, inicioCorteSeg, fimCorteSeg);
      setVideoParaCortar(null);
      setUploadandoFoto(true);
      await enviarArquivo(cortado, 'VIDEO');
    } catch (e) {
      mostrarErroFoto(e instanceof Error ? e.message : 'Não foi possível cortar o vídeo.');
    } finally {
      setCortandoVideo(false);
      setUploadandoFoto(false);
    }
  }

  async function aoRemoverFoto(fotoId: string) {
    if (!os || !window.confirm('Remover esta foto?')) return;
    setRemovendoFotoId(fotoId);
    setErro(null);
    try {
      await deletarFoto(os.id, fotoId);
      setOs({ ...os, fotos: os.fotos.filter((f) => f.id !== fotoId) });
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível remover a foto.');
    } finally {
      setRemovendoFotoId(null);
    }
  }

  // Busca lançamentos parecidos já feitos antes, enquanto a pessoa digita
  // a descrição - é o que dá a "sugestão de preço".
  function aoDigitarDescricaoItem(valor: string) {
    setDescricaoItemNovo(valor);
    if (debounceSugestaoRef.current) clearTimeout(debounceSugestaoRef.current);

    if (!valor.trim()) {
      setSugestoesItem([]);
      return;
    }

    debounceSugestaoRef.current = setTimeout(() => {
      buscarSugestoesMaoDeObra(valor.trim(), os?.veiculo.modelo)
        .then(setSugestoesItem)
        .catch(() => setSugestoesItem([]));
    }, 300);
  }

  // Preenche o formulário com os dados de uma sugestão escolhida -
  // a pessoa ainda pode ajustar o valor antes de confirmar.
  function aplicarSugestao(sugestao: SugestaoMaoDeObra) {
    setDescricaoItemNovo(sugestao.descricao);
    setTipoValorNovo(sugestao.tipoValor);
    if (sugestao.tipoValor === 'HORAS') {
      setHorasNovo(sugestao.horas != null ? String(sugestao.horas) : '');
      setValorHoraNovo(sugestao.valorHoraCentavos != null ? (sugestao.valorHoraCentavos / 100).toFixed(2) : '');
      setValorFechadoNovo('');
    } else {
      setValorFechadoNovo((sugestao.valorTotalCentavos / 100).toFixed(2));
      setHorasNovo('');
      setValorHoraNovo('');
    }
    setSugestoesItem([]);
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-bg">
        <Topbar />
        <p className="py-10 text-center text-sm text-ink-soft">Carregando...</p>
      </div>
    );
  }

  if (erro && !os) {
    return (
      <div className="min-h-screen bg-bg">
        <Topbar />
        <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
        </main>
      </div>
    );
  }

  if (!os) return null;

  const proximo = PROXIMO_STATUS[os.status];

  return (
    <div className="min-h-screen bg-bg">
      <Topbar />

      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        <BotaoVoltar />

        {/* Cabeçalho: placa, modelo, cliente, status */}
        <div className="mb-5 rounded-lg border border-line bg-white p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-lg font-bold tracking-wide text-ink">{os.veiculo.placa}</p>
              <p className="text-sm text-ink-soft">
                {os.veiculo.modelo} {os.veiculo.marca ? `· ${os.veiculo.marca}` : ''}
              </p>
            </div>
            <StatusTag status={os.status} />
          </div>
          <div className="mt-3 border-t border-line pt-3 text-sm">
            <p className="text-ink">{os.veiculo.cliente.nome}</p>
            <p className="text-ink-soft">{os.veiculo.cliente.telefone}</p>
          </div>
          <div className="mt-3 border-t border-line pt-3 text-xs text-ink-soft">
            Aberta em {formatarDataHora(os.createdAt)} por {os.criadoPor.nome}
          </div>
        </div>

        {erro && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

        {/* Queixa inicial - fixa, registrada na abertura, nunca editada depois */}
        {os.queixaInicial && (
          <div className="mb-5 rounded-lg border border-line bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-ink">Queixa inicial</h2>
            <p className="text-sm text-ink-soft">"{os.queixaInicial}"</p>
          </div>
        )}

        {/* Km - edição inline */}
        <div className="mb-5 rounded-lg border border-line bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Quilometragem</h2>
            {podeEditar && !editandoKm && (
              <button onClick={() => setEditandoKm(true)} className="text-xs font-medium text-accent-ink underline">
                Editar
              </button>
            )}
          </div>

          {!editandoKm ? (
            <p className="font-mono text-sm">{os.kmRegistrado ?? '—'}</p>
          ) : (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Campo
                  rotulo="Km registrado"
                  id="kmEdicao"
                  type="number"
                  inputMode="numeric"
                  value={kmRegistrado}
                  onChange={(e) => setKmRegistrado(e.target.value)}
                />
              </div>
              <Botao type="button" onClick={salvarKm} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </Botao>
              <Botao type="button" variante="secundario" onClick={() => setEditandoKm(false)}>
                Cancelar
              </Botao>
            </div>
          )}
        </div>

        {/* Observações - histórico append-only */}
        <div className="mb-5 rounded-lg border border-line bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink">Observações</h2>

          {os.observacoes.length === 0 ? (
            <p className="text-sm text-ink-soft">Nenhuma observação ainda.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {os.observacoes.map((obs) => (
                <li key={obs.id} className="border-l-2 border-line pl-3">
                  <p className="text-sm text-ink">{obs.texto}</p>
                  <p className="mt-0.5 text-[11px] text-ink-soft">
                    {obs.autor.nome} · {formatarDataHora(obs.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {podeEditar ? (
            <form onSubmit={aoAdicionarObservacao} className="mt-4 flex flex-col gap-2">
              <textarea
                value={novaObservacao}
                onChange={(e) => setNovaObservacao(e.target.value)}
                rows={2}
                placeholder="Ex: Peça X precisa ser trocada, aguardando fornecedor"
                className="rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-accent"
              />
              <Botao type="submit" disabled={enviandoObservacao || !novaObservacao.trim()} className="self-start">
                {enviandoObservacao ? 'Adicionando...' : 'Adicionar observação'}
              </Botao>
            </form>
          ) : (
            <p className="mt-3 text-xs text-ink-soft">
              Essa OS já foi finalizada. Só a moderadora pode adicionar novas observações.
            </p>
          )}
        </div>

        {/* Mão de obra - só moderador vê e lança (regra da família) */}
        {ehModerador && (
        <div className="mb-5 rounded-lg border border-line bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Mão de obra</h2>
            {podeEditar && !mostrarFormItem && (
              <button onClick={() => setMostrarFormItem(true)} className="text-xs font-medium text-accent-ink underline">
                + Lançar
              </button>
            )}
          </div>

          {os.itensMaoDeObra.length === 0 ? (
            <p className="text-sm text-ink-soft">Nenhum lançamento ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {os.itensMaoDeObra.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-2 border-l-2 border-line pl-3">
                  <div>
                    <p className="text-sm text-ink">{item.descricao}</p>
                    <p className="mt-0.5 text-[11px] text-ink-soft">
                      {item.tipoValor === 'HORAS' ? `${item.horas}h` : 'Valor fechado'}
                      {' · '}
                      {item.criadoPor.nome}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {ehModerador && item.valorTotalCentavos != null && (
                      <span className="font-mono text-sm font-semibold text-ink">
                        {formatarCentavos(item.valorTotalCentavos)}
                      </span>
                    )}
                    {podeEditar && (
                      <button
                        onClick={() => aoRemoverItem(item.id)}
                        disabled={removendoItemId === item.id}
                        className="text-xs text-ink-soft underline hover:text-red-700"
                      >
                        {removendoItemId === item.id ? '...' : 'Remover'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {ehModerador && os.itensMaoDeObra.length > 0 && (
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <span className="text-sm font-semibold text-ink">Total mão de obra</span>
              <span className="font-mono text-sm font-bold text-ink">
                {formatarCentavos(
                  os.itensMaoDeObra.reduce((soma, item) => soma + (item.valorTotalCentavos ?? 0), 0),
                )}
              </span>
            </div>
          )}

          {mostrarFormItem && (
            <form onSubmit={aoAdicionarItem} className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
              <div className="relative">
                <Campo
                  rotulo="Descrição do serviço"
                  id="descricaoItemNovo"
                  value={descricaoItemNovo}
                  onChange={(e) => aoDigitarDescricaoItem(e.target.value)}
                  placeholder="Ex: Troca de embreagem"
                  autoComplete="off"
                  required
                />

                {sugestoesItem.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-line bg-white shadow-md">
                    {sugestoesItem.map((s) => (
                      <li key={s.descricao}>
                        <button
                          type="button"
                          onClick={() => aplicarSugestao(s)}
                          className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-bg"
                        >
                          <span className="text-ink">{s.descricao}</span>
                          <span className="font-mono text-xs text-ink-soft">
                            {formatarCentavos(s.valorTotalCentavos)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTipoValorNovo('HORAS')}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                    tipoValorNovo === 'HORAS' ? 'border-ink bg-ink text-white' : 'border-line text-ink-soft'
                  }`}
                >
                  Por hora
                </button>
                <button
                  type="button"
                  onClick={() => setTipoValorNovo('FECHADO')}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                    tipoValorNovo === 'FECHADO' ? 'border-ink bg-ink text-white' : 'border-line text-ink-soft'
                  }`}
                >
                  Valor fechado
                </button>
              </div>

              {tipoValorNovo === 'HORAS' ? (
                <div className="grid grid-cols-2 gap-3">
                  <Campo
                    rotulo="Horas trabalhadas"
                    id="horasNovo"
                    inputMode="decimal"
                    value={horasNovo}
                    onChange={(e) => setHorasNovo(e.target.value)}
                    placeholder="Ex: 2.5"
                    required
                  />
                  <Campo
                    rotulo="Valor por hora (R$)"
                    id="valorHoraNovo"
                    inputMode="decimal"
                    value={valorHoraNovo}
                    onChange={(e) => setValorHoraNovo(e.target.value)}
                    placeholder="Ex: 80"
                    required
                  />
                </div>
              ) : (
                <Campo
                  rotulo="Valor fechado (R$)"
                  id="valorFechadoNovo"
                  inputMode="decimal"
                  value={valorFechadoNovo}
                  onChange={(e) => setValorFechadoNovo(e.target.value)}
                  placeholder="Ex: 250"
                  required
                />
              )}

              <div className="flex gap-2">
                <Botao type="submit" disabled={enviandoItem}>
                  {enviandoItem ? 'Lançando...' : 'Lançar'}
                </Botao>
                <Botao type="button" variante="secundario" onClick={() => { setMostrarFormItem(false); setSugestoesItem([]); }}>
                  Cancelar
                </Botao>
              </div>
            </form>
          )}

          {!podeEditar && os.itensMaoDeObra.length === 0 && (
            <p className="mt-3 text-xs text-ink-soft">Essa OS já foi finalizada.</p>
          )}
        </div>
        )}

        {/* Troca de status */}
        <div className="mb-5 rounded-lg border border-line bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink">Status</h2>
          <div className="flex flex-wrap gap-2">
            {os.status === 'ORCAMENTO' && (
              <>
                <Botao type="button" onClick={() => avançarStatus('EM_ANDAMENTO')} disabled={salvando}>
                  Aprovar orçamento
                </Botao>
                {ehModerador ? (
                  <Botao type="button" variante="perigo" onClick={() => avançarStatus('REJEITADO')} disabled={salvando}>
                    Recusar orçamento
                  </Botao>
                ) : (
                  <p className="self-center text-xs text-ink-soft">Só a moderadora pode recusar um orçamento.</p>
                )}
              </>
            )}

            {proximo && (
              <Botao type="button" onClick={() => avançarStatus(proximo.valor)} disabled={salvando}>
                {proximo.rotulo}
              </Botao>
            )}

            {(os.status === 'FINALIZADO' || os.status === 'REJEITADO') && ehModerador && (
              <Botao type="button" variante="secundario" onClick={() => avançarStatus('EM_ANDAMENTO')} disabled={salvando}>
                Reabrir
              </Botao>
            )}

            {os.status === 'EM_ANDAMENTO' && !ehModerador && (
              <p className="text-xs text-ink-soft">Só a moderadora pode finalizar uma Ordem de Serviço.</p>
            )}
          </div>
        </div>

        {/* Fotos */}
        <div className="mb-5 rounded-lg border border-line bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Fotos</h2>
            {podeEditar && (
              <label className="cursor-pointer text-xs font-medium text-accent-ink underline">
                + Adicionar
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
                  className="hidden"
                  onChange={aoAdicionarFoto}
                  disabled={uploadandoFoto}
                />
              </label>
            )}
          </div>

          {erroFoto && (
            <div className="mb-3 flex items-start justify-between gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              <span>{erroFoto}</span>
              <button onClick={() => setErroFoto(null)} className="shrink-0 text-red-400 hover:text-red-700">✕</button>
            </div>
          )}

          {uploadandoFoto && (
            <p className="mb-3 text-xs text-ink-soft">Enviando...</p>
          )}

          {os.fotos.length === 0 && !uploadandoFoto ? (
            <p className="text-sm text-ink-soft">Nenhuma foto ainda.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {os.fotos.map((foto) => (
                <div key={foto.id} className="relative">
                  {foto.tipo === 'VIDEO' ? (
                    <video
                      src={foto.url}
                      className="aspect-square w-full rounded-md object-cover"
                      controls
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={foto.url}
                      alt={foto.descricao ?? 'Foto'}
                      className="aspect-square w-full rounded-md object-cover"
                    />
                  )}
                  {podeEditar && (
                    <button
                      onClick={() => aoRemoverFoto(foto.id)}
                      disabled={removendoFotoId === foto.id}
                      className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white"
                    >
                      {removendoFotoId === foto.id ? '...' : '✕'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico do veículo - inclui finalizadas */}
        {historico.length > 0 && (
          <div className="rounded-lg border border-line bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink">
              Serviços anteriores deste veículo
            </h2>
            <ul className="flex flex-col gap-2">
              {historico.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/os/${item.id}`}
                    className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm hover:border-ink/40"
                  >
                    <span className="text-ink-soft">
                      {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    <StatusTag status={item.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* Modal de corte de vídeo longo */}
      {videoParaCortar && videoParaCortarUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between p-4">
            <p className="text-sm font-semibold text-white">Cortar vídeo</p>
            <button
              onClick={() => setVideoParaCortar(null)}
              className="text-sm text-white/70"
              disabled={cortandoVideo}
            >
              Cancelar
            </button>
          </div>

          <video
            src={videoParaCortarUrl}
            className="w-full flex-1 object-contain"
            controls
            playsInline
          />

          <div className="bg-white p-4">
            <p className="mb-1 text-xs text-ink-soft">
              Início do trecho (o vídeo terá {MAX_DURACAO_VIDEO_S}s a partir daqui)
            </p>
            <input
              type="range"
              min={0}
              max={Math.max(0, Math.floor(videoParaCortar.duracao - MAX_DURACAO_VIDEO_S))}
              step={0.5}
              value={inicioCorteSeg}
              onChange={(e) => setInicioCorteSeg(Number(e.target.value))}
              className="w-full"
              disabled={cortandoVideo}
            />
            <p className="mt-1 text-center text-sm text-ink">
              {formatarSegundos(inicioCorteSeg)}
              {' – '}
              {formatarSegundos(Math.min(inicioCorteSeg + MAX_DURACAO_VIDEO_S, videoParaCortar.duracao))}
              {' '}
              <span className="text-ink-soft">
                ({Math.round(Math.min(MAX_DURACAO_VIDEO_S, videoParaCortar.duracao - inicioCorteSeg))}s)
              </span>
            </p>
            <Botao
              type="button"
              onClick={aoEnviarVideoComCorte}
              disabled={cortandoVideo}
              className="mt-3 w-full"
            >
              {cortandoVideo ? `Cortando... (pode levar até ${MAX_DURACAO_VIDEO_S}s)` : 'Cortar e Enviar'}
            </Botao>
          </div>
        </div>
      )}
    </div>
  );
}