import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { StatusTag } from '../components/StatusTag';
import { Botao } from '../components/Botao';
import { Campo } from '../components/Campo';
import { BotaoVoltar } from '../components/BotaoVoltar';
import { Lightbox } from '../components/Lightbox';
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
import { atualizarLegendaFoto, comprimirImagem, cortarVideo, deletarFoto, MAX_DURACAO_VIDEO_S, obterDuracaoVideo, registrarFoto, solicitarUrlUpload, uploadParaR2 } from '../lib/fotosApi';
import {
  adicionarItemOrcamento,
  atualizarItemOrcamento,
  buscarSugestoesOrcamento,
  removerItemOrcamento,
  type SugestaoOrcamento,
} from '../lib/orcamentoApi';
import { atualizarCliente } from '../lib/clientesApi';
import { formatarCentavos, paraCentavos } from '../lib/moeda';
import { CHECKLIST_FOTOS_ENTRADA } from '../lib/checklistFotosEntrada';
import type { Foto, ItemOrcamento, OrdemServico, StatusOrdemServico, TipoItemOrcamento, TipoMidia, TipoPessoa, TipoValorMaoDeObra } from '../lib/types';

const UNIDADES_COMUNS = ['un', 'par', 'jogo', 'L', 'kg', 'm', 'cx'];

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

  const [editandoKm, setEditandoKm] = useState(false);
  const [kmRegistrado, setKmRegistrado] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [novaObservacao, setNovaObservacao] = useState('');
  const [enviandoObservacao, setEnviandoObservacao] = useState(false);

  const [mostrarFormItem, setMostrarFormItem] = useState(false);
  const [tipoValorNovo, setTipoValorNovo] = useState<TipoValorMaoDeObra>('HORAS');
  const [descricaoItemNovo, setDescricaoItemNovo] = useState('');
  const [horasNovo, setHorasNovo] = useState('');
  const [valorHoraNovo, setValorHoraNovo] = useState('');
  const [valorFechadoNovo, setValorFechadoNovo] = useState('');
  const [enviandoItem, setEnviandoItem] = useState(false);
  const [removendoItemId, setRemovendoItemId] = useState<string | null>(null);

  const [uploadandoFoto, setUploadandoFoto] = useState(false);
  const [enviandoSlotEntrada, setEnviandoSlotEntrada] = useState<string | null>(null);
  const [removendoFotoId, setRemovendoFotoId] = useState<string | null>(null);
  const [erroFoto, setErroFoto] = useState<string | null>(null);
  const [editandoLegendaId, setEditandoLegendaId] = useState<string | null>(null);
  const [legendaTexto, setLegendaTexto] = useState('');
  const salvandoLegendaRef = useRef(false);
  const erroFotoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [videoParaCortar, setVideoParaCortar] = useState<{ arquivo: File; duracao: number } | null>(null);
  const [videoParaCortarUrl, setVideoParaCortarUrl] = useState<string | null>(null);
  const [inicioCorteSeg, setInicioCorteSeg] = useState(0);
  const [cortandoVideo, setCortandoVideo] = useState(false);
  const videoModalRef = useRef<HTMLVideoElement>(null);
  const [lightbox, setLightbox] = useState<{ itens: Foto[]; indice: number } | null>(null);
  const [sugestoesItem, setSugestoesItem] = useState<SugestaoMaoDeObra[]>([]);
  const debounceSugestaoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formOrcamento, setFormOrcamento] = useState<{ tipo: TipoItemOrcamento; itemId: string | null } | null>(null);
  const [descricaoOrcamento, setDescricaoOrcamento] = useState('');
  const [quantidadeOrcamento, setQuantidadeOrcamento] = useState('1');
  const [unidadeOrcamento, setUnidadeOrcamento] = useState('un');
  const [valorUnitarioOrcamento, setValorUnitarioOrcamento] = useState('');
  const [fornecedorOrcamento, setFornecedorOrcamento] = useState('');
  const [enviandoOrcamento, setEnviandoOrcamento] = useState(false);
  const [removendoOrcamentoId, setRemovendoOrcamentoId] = useState<string | null>(null);
  const [sugestoesOrcamento, setSugestoesOrcamento] = useState<SugestaoOrcamento[]>([]);
  const debounceOrcamentoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [completandoCadastro, setCompletandoCadastro] = useState(false);
  const [tipoPessoaCadastro, setTipoPessoaCadastro] = useState<TipoPessoa>('FISICA');
  const [cpfCnpjCadastro, setCpfCnpjCadastro] = useState('');
  const [telefoneCadastro, setTelefoneCadastro] = useState('');
  const [enderecoRuaCadastro, setEnderecoRuaCadastro] = useState('');
  const [enderecoNumeroCadastro, setEnderecoNumeroCadastro] = useState('');
  const [enderecoBairroCadastro, setEnderecoBairroCadastro] = useState('');
  const [enderecoCidadeCadastro, setEnderecoCidadeCadastro] = useState('');
  const [enderecoEstadoCadastro, setEnderecoEstadoCadastro] = useState('');
  const [salvandoCadastro, setSalvandoCadastro] = useState(false);

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

  const estadosFinais: StatusOrdemServico[] = ['FINALIZADO', 'REJEITADO'];
  const podeEditar = os && (!estadosFinais.includes(os.status) || ehModerador);

  const temAcaoDisponivel = os && (
    os.status === 'ORCAMENTO' ||
    (os.status === 'EM_ANDAMENTO' && ehModerador) ||
    (estadosFinais.includes(os.status) && ehModerador)
  );

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

  function abrirLightbox(itens: Foto[], indice: number) {
    setLightbox({ itens, indice });
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
    const novaFoto = await registrarFoto(os.id, key, tipo, undefined, 'SERVICO');
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

  async function aoAdicionarFotoEntradaSlot(chave: string, rotulo: string, evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!arquivo || !os) return;

    setEnviandoSlotEntrada(chave);
    setErroFoto(null);
    try {
      const comprimido = await comprimirImagem(arquivo);
      const { uploadUrl, key } = await solicitarUrlUpload(os.id, comprimido.type);
      await uploadParaR2(uploadUrl, comprimido);
      const novaFoto = await registrarFoto(os.id, key, 'FOTO', rotulo, 'ENTRADA');
      setOs((prev) => (prev ? { ...prev, fotos: [...prev.fotos, novaFoto] } : prev));
    } catch (e) {
      mostrarErroFoto(e instanceof Error ? e.message : 'Não foi possível enviar a foto.');
    } finally {
      setEnviandoSlotEntrada(null);
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

  function iniciarEdicaoLegenda(foto: { id: string; descricao?: string | null }) {
    setEditandoLegendaId(foto.id);
    setLegendaTexto(foto.descricao ?? '');
  }

  async function salvarLegenda(fotoId: string) {
    if (salvandoLegendaRef.current || !os) return;
    salvandoLegendaRef.current = true;
    setEditandoLegendaId(null);
    try {
      const fotoAtualizada = await atualizarLegendaFoto(os.id, fotoId, legendaTexto.trim());
      setOs((prev) =>
        prev
          ? { ...prev, fotos: prev.fotos.map((f) => (f.id === fotoId ? { ...f, descricao: fotoAtualizada.descricao } : f)) }
          : prev,
      );
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar a legenda.');
    } finally {
      salvandoLegendaRef.current = false;
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

  function iniciarCompletarCadastro() {
    if (!os) return;
    const cliente = os.veiculo.cliente;
    setTipoPessoaCadastro(cliente.tipoPessoa);
    setCpfCnpjCadastro(cliente.cpfCnpj ?? '');
    setTelefoneCadastro(cliente.telefone ?? '');
    setEnderecoRuaCadastro(cliente.enderecoRua ?? '');
    setEnderecoNumeroCadastro(cliente.enderecoNumero ?? '');
    setEnderecoBairroCadastro(cliente.enderecoBairro ?? '');
    setEnderecoCidadeCadastro(cliente.enderecoCidade ?? '');
    setEnderecoEstadoCadastro(cliente.enderecoEstado ?? '');
    setCompletandoCadastro(true);
  }

  async function aoSalvarCadastro(evento: FormEvent) {
    evento.preventDefault();
    if (!os) return;
    setSalvandoCadastro(true);
    setErro(null);
    try {
      const clienteAtualizado = await atualizarCliente(os.veiculo.cliente.id, {
        nome: os.veiculo.cliente.nome,
        tipoPessoa: tipoPessoaCadastro,
        cpfCnpj: cpfCnpjCadastro.trim() || undefined,
        telefone: telefoneCadastro.trim() || undefined,
        enderecoRua: enderecoRuaCadastro || undefined,
        enderecoNumero: enderecoNumeroCadastro || undefined,
        enderecoBairro: enderecoBairroCadastro || undefined,
        enderecoCidade: enderecoCidadeCadastro || undefined,
        enderecoEstado: enderecoEstadoCadastro || undefined,
      });
      setOs((prev) => prev ? { ...prev, veiculo: { ...prev.veiculo, cliente: clienteAtualizado } } : prev);
      setCompletandoCadastro(false);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar o cadastro.');
    } finally {
      setSalvandoCadastro(false);
    }
  }

  function aoDigitarDescricaoItem(valor: string) {
    setDescricaoItemNovo(valor);
    if (debounceSugestaoRef.current) clearTimeout(debounceSugestaoRef.current);
    if (!valor.trim()) { setSugestoesItem([]); return; }
    debounceSugestaoRef.current = setTimeout(() => {
      buscarSugestoesMaoDeObra(valor.trim(), os?.veiculo.modelo)
        .then(setSugestoesItem)
        .catch(() => setSugestoesItem([]));
    }, 300);
  }

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

  function abrirFormNovoItemOrcamento(tipo: TipoItemOrcamento) {
    setFormOrcamento({ tipo, itemId: null });
    setDescricaoOrcamento('');
    setQuantidadeOrcamento('1');
    setUnidadeOrcamento('un');
    setValorUnitarioOrcamento('');
    setFornecedorOrcamento('');
    setSugestoesOrcamento([]);
  }

  function abrirFormEdicaoItemOrcamento(item: ItemOrcamento) {
    setFormOrcamento({ tipo: item.tipo, itemId: item.id });
    setDescricaoOrcamento(item.descricao);
    setQuantidadeOrcamento(String(item.quantidade));
    setUnidadeOrcamento(item.unidade);
    setValorUnitarioOrcamento(item.valorUnitarioCentavos != null ? (item.valorUnitarioCentavos / 100).toFixed(2) : '');
    setFornecedorOrcamento(item.fornecedor ?? '');
    setSugestoesOrcamento([]);
  }

  function fecharFormOrcamento() {
    setFormOrcamento(null);
    setSugestoesOrcamento([]);
  }

  function aoDigitarDescricaoOrcamento(valor: string) {
    setDescricaoOrcamento(valor);
    if (!formOrcamento) return;
    if (debounceOrcamentoRef.current) clearTimeout(debounceOrcamentoRef.current);
    debounceOrcamentoRef.current = setTimeout(() => {
      buscarSugestoesOrcamento(valor.trim(), formOrcamento.tipo)
        .then(setSugestoesOrcamento)
        .catch(() => setSugestoesOrcamento([]));
    }, 300);
  }

  function aoFocarDescricaoOrcamento() {
    if (!formOrcamento) return;
    if (debounceOrcamentoRef.current) clearTimeout(debounceOrcamentoRef.current);
    buscarSugestoesOrcamento(descricaoOrcamento.trim(), formOrcamento.tipo)
      .then(setSugestoesOrcamento)
      .catch(() => setSugestoesOrcamento([]));
  }

  function aplicarSugestaoOrcamento(sugestao: SugestaoOrcamento) {
    setDescricaoOrcamento(sugestao.descricao);
    setUnidadeOrcamento(sugestao.unidade);
    if (ehModerador && sugestao.valorUnitarioCentavos != null) {
      setValorUnitarioOrcamento((sugestao.valorUnitarioCentavos / 100).toFixed(2));
    }
    setSugestoesOrcamento([]);
  }

  async function aoSubmeterFormOrcamento(evento: FormEvent) {
    evento.preventDefault();
    if (!os || !formOrcamento || !descricaoOrcamento.trim()) return;

    const quantidade = quantidadeOrcamento ? Number(quantidadeOrcamento.replace(',', '.')) : 1;
    const valorUnitarioCentavos = ehModerador && valorUnitarioOrcamento ? paraCentavos(valorUnitarioOrcamento) ?? undefined : undefined;

    setEnviandoOrcamento(true);
    setErro(null);
    try {
      const dados = {
        tipo: formOrcamento.tipo,
        descricao: descricaoOrcamento.trim(),
        quantidade,
        unidade: unidadeOrcamento.trim() || 'un',
        valorUnitarioCentavos,
        fornecedor: formOrcamento.tipo === 'TERCEIRIZADO' ? (fornecedorOrcamento.trim() || undefined) : undefined,
      };

      const item = formOrcamento.itemId
        ? await atualizarItemOrcamento(os.id, formOrcamento.itemId, dados)
        : await adicionarItemOrcamento(os.id, dados);

      setOs((prev) => {
        if (!prev) return prev;
        const jaExiste = prev.itensOrcamento.some((i) => i.id === item.id);
        return {
          ...prev,
          itensOrcamento: jaExiste
            ? prev.itensOrcamento.map((i) => (i.id === item.id ? item : i))
            : [...prev.itensOrcamento, item],
        };
      });
      fecharFormOrcamento();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar o item de orçamento.');
    } finally {
      setEnviandoOrcamento(false);
    }
  }

  async function aoRemoverItemOrcamento(itemId: string) {
    if (!os) return;
    const confirmado = window.confirm('Remover esse item de orçamento?');
    if (!confirmado) return;
    setRemovendoOrcamentoId(itemId);
    setErro(null);
    try {
      await removerItemOrcamento(os.id, itemId);
      setOs((prev) => prev ? { ...prev, itensOrcamento: prev.itensOrcamento.filter((i) => i.id !== itemId) } : prev);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível remover esse item.');
    } finally {
      setRemovendoOrcamentoId(null);
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

  if (erro && !os) {
    return (
      <div className="min-h-screen bg-bg">
        <Topbar />
        <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
          <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{erro}</p>
        </main>
      </div>
    );
  }

  if (!os) return null;

  const fotosEntrada = os.fotos.filter((f) => f.categoria === 'ENTRADA');
  const fotosServico = os.fotos.filter((f) => f.categoria !== 'ENTRADA');

  // Fotos de entrada que batem com um dos 5 rótulos do checklist viram os
  // slots visuais (mesmo formato da abertura da OS); o resto continua
  // listado embaixo como já era antes.
  const rotulosChecklist = new Set<string>(CHECKLIST_FOTOS_ENTRADA.map((item) => item.rotulo));
  const fotosEntradaPorRotulo = new Map<string, Foto>();
  fotosEntrada.forEach((f) => {
    if (f.descricao && rotulosChecklist.has(f.descricao) && !fotosEntradaPorRotulo.has(f.descricao)) {
      fotosEntradaPorRotulo.set(f.descricao, f);
    }
  });
  const fotosEntradaChecklist = CHECKLIST_FOTOS_ENTRADA
    .map((item) => fotosEntradaPorRotulo.get(item.rotulo))
    .filter((f): f is Foto => Boolean(f));
  const fotosEntradaExtras = fotosEntrada.filter((f) => fotosEntradaPorRotulo.get(f.descricao ?? '') !== f);

  const cadastroClienteIncompleto = !os.veiculo.cliente.cpfCnpj || !os.veiculo.cliente.telefone;

  const itensPecas = os.itensOrcamento.filter((i) => i.tipo === 'PECA');
  const itensTerceirizados = os.itensOrcamento.filter((i) => i.tipo === 'TERCEIRIZADO');

  const subtotalItemOrcamento = (item: ItemOrcamento): number | null =>
    item.valorUnitarioCentavos != null ? Math.round(item.valorUnitarioCentavos * item.quantidade) : null;

  const totalPecasCentavos = itensPecas.reduce((soma, item) => soma + (subtotalItemOrcamento(item) ?? 0), 0);
  const totalTerceirizadosCentavos = itensTerceirizados.reduce((soma, item) => soma + (subtotalItemOrcamento(item) ?? 0), 0);
  const totalMaoDeObraCentavos = os.itensMaoDeObra.reduce((soma, item) => soma + (item.valorTotalCentavos ?? 0), 0);
  const totalGeralOrcamentoCentavos = totalPecasCentavos + totalTerceirizadosCentavos + totalMaoDeObraCentavos;

  return (
    <div className="min-h-screen bg-bg">
      <Topbar />

      <main className={`mx-auto max-w-xl px-4 py-6 sm:px-6 ${temAcaoDisponivel ? 'pb-36 sm:pb-24' : ''}`}>
        <BotaoVoltar />

        {/* 1. Cabeçalho */}
        <div className="mb-5 rounded-lg border border-line bg-surface p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-lg font-bold tracking-wide text-ink">{os.veiculo.placa}</p>
              <p className="text-sm text-ink-soft">
                {[os.veiculo.modelo, os.veiculo.marca, os.veiculo.ano ? String(os.veiculo.ano) : null, os.veiculo.motor]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <StatusTag status={os.status} />
          </div>
          <div className="mt-3 border-t border-line pt-3 text-sm">
            <p className="text-ink">{os.veiculo.cliente.nome}</p>
            {os.veiculo.cliente.telefone && <p className="text-ink-soft">{os.veiculo.cliente.telefone}</p>}
          </div>
          <div className="mt-3 border-t border-line pt-3 text-xs text-ink-soft">
            Aberta em {formatarDataHora(os.createdAt)} por {os.criadoPor.nome}
          </div>
        </div>

        {cadastroClienteIncompleto && !completandoCadastro && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning-bg px-4 py-3 text-sm text-warning">
            <span>Cadastro do cliente incompleto.</span>
            <button
              type="button"
              onClick={iniciarCompletarCadastro}
              className="shrink-0 rounded-md border border-warning/40 px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/10"
            >
              Completar cadastro
            </button>
          </div>
        )}

        {completandoCadastro && (
          <div className="mb-5 rounded-lg border border-line bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink">Completar cadastro do cliente</h2>
            <form onSubmit={aoSalvarCadastro} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-ink-soft">Tipo de pessoa</span>
                  <select
                    value={tipoPessoaCadastro}
                    onChange={(e) => setTipoPessoaCadastro(e.target.value as TipoPessoa)}
                    className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent"
                  >
                    <option value="FISICA">Física</option>
                    <option value="JURIDICA">Jurídica</option>
                  </select>
                </label>
                <Campo rotulo="CPF ou CNPJ" id="cpfCnpjCadastro" value={cpfCnpjCadastro} onChange={(e) => setCpfCnpjCadastro(e.target.value)} />
              </div>
              <Campo rotulo="Telefone" id="telefoneCadastro" value={telefoneCadastro} onChange={(e) => setTelefoneCadastro(e.target.value)} />
              <div className="grid grid-cols-3 gap-3">
                <Campo rotulo="Rua" id="enderecoRuaCadastro" className="col-span-2" value={enderecoRuaCadastro} onChange={(e) => setEnderecoRuaCadastro(e.target.value)} />
                <Campo rotulo="Número" id="enderecoNumeroCadastro" value={enderecoNumeroCadastro} onChange={(e) => setEnderecoNumeroCadastro(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Campo rotulo="Bairro" id="enderecoBairroCadastro" value={enderecoBairroCadastro} onChange={(e) => setEnderecoBairroCadastro(e.target.value)} />
                <Campo rotulo="Cidade" id="enderecoCidadeCadastro" value={enderecoCidadeCadastro} onChange={(e) => setEnderecoCidadeCadastro(e.target.value)} />
              </div>
              <Campo rotulo="Estado (UF)" id="enderecoEstadoCadastro" maxLength={2} value={enderecoEstadoCadastro} onChange={(e) => setEnderecoEstadoCadastro(e.target.value.toUpperCase())} />
              <div className="flex gap-2">
                <Botao type="submit" disabled={salvandoCadastro}>{salvandoCadastro ? 'Salvando...' : 'Salvar cadastro'}</Botao>
                <Botao type="button" variante="secundario" onClick={() => setCompletandoCadastro(false)}>Cancelar</Botao>
              </div>
            </form>
          </div>
        )}

        {erro && <p className="mb-4 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{erro}</p>}

        {/* 2. Card de entrada: queixa + km + fotos de entrada */}
        <div className="mb-5 rounded-lg border border-line bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink">Entrada</h2>

          {os.queixaInicial && (
            <div className="mb-4">
              <p className="mb-1 text-xs font-medium text-ink-soft">Queixa inicial</p>
              <p className="whitespace-pre-line text-sm text-ink">"{os.queixaInicial}"</p>
            </div>
          )}

          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-ink-soft">Quilometragem</p>
              {!editandoKm ? (
                <p className="font-mono text-sm">{os.kmRegistrado ?? '—'}</p>
              ) : null}
            </div>
            {podeEditar && !editandoKm && (
              <button onClick={() => setEditandoKm(true)} className="text-xs font-medium text-accent-ink underline">
                Editar
              </button>
            )}
          </div>

          {editandoKm && (
            <div className="mb-4 flex items-end gap-2">
              <div className="flex-1">
                <Campo rotulo="Km registrado" id="kmEdicao" type="number" inputMode="numeric" value={kmRegistrado} onChange={(e) => setKmRegistrado(e.target.value)} />
              </div>
              <Botao type="button" onClick={salvarKm} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</Botao>
              <Botao type="button" variante="secundario" onClick={() => setEditandoKm(false)}>Cancelar</Botao>
            </div>
          )}

          <div className="border-t border-line pt-3">
            <p className="mb-2 text-xs font-medium text-ink-soft">Fotos de entrada</p>

            <div className="grid grid-cols-2 gap-3">
              {CHECKLIST_FOTOS_ENTRADA.map((item) => {
                const foto = fotosEntradaPorRotulo.get(item.rotulo);
                const enviandoEsta = enviandoSlotEntrada === item.chave;
                const indiceNoChecklist = foto ? fotosEntradaChecklist.findIndex((f) => f.id === foto.id) : -1;

                return (
                  <div key={item.chave}>
                    {foto ? (
                      <div
                        className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-xl border-2 border-green-500 bg-black"
                        onClick={() => abrirLightbox(fotosEntradaChecklist, indiceNoChecklist)}
                      >
                        <img src={foto.url} alt={item.rotulo} className="h-full w-full object-cover opacity-90" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        </div>
                        {podeEditar && (
                          <button
                            onClick={(e) => { e.stopPropagation(); aoRemoverFoto(foto.id); }}
                            disabled={removendoFotoId === foto.id}
                            className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white"
                          >
                            {removendoFotoId === foto.id ? '...' : '✕'}
                          </button>
                        )}
                      </div>
                    ) : podeEditar ? (
                      <label className="cursor-pointer">
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl border-2 border-dashed border-line bg-bg transition-colors hover:border-ink/30">
                          {enviandoEsta ? (
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
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/heic"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => aoAdicionarFotoEntradaSlot(item.chave, item.rotulo, e)}
                          disabled={enviandoEsta}
                        />
                      </label>
                    ) : (
                      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-bg text-ink-soft/40">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 7h3l2-2h6l2 2h3v12H4z" />
                          <circle cx="12" cy="13" r="3" />
                        </svg>
                      </div>
                    )}
                    <p className="mt-1.5 text-center text-xs font-medium text-ink">{item.rotulo}</p>
                  </div>
                );
              })}
            </div>

            {fotosEntradaExtras.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {fotosEntradaExtras.map((foto, indice) => (
                  <div key={foto.id}>
                    <div className="relative cursor-pointer" onClick={() => abrirLightbox(fotosEntradaExtras, indice)}>
                      <img
                        src={foto.url}
                        alt={foto.descricao ?? 'Foto de entrada'}
                        className="aspect-square w-full rounded-md object-cover"
                      />
                      {podeEditar && (
                        <button
                          onClick={(e) => { e.stopPropagation(); aoRemoverFoto(foto.id); }}
                          disabled={removendoFotoId === foto.id}
                          className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white"
                        >
                          {removendoFotoId === foto.id ? '...' : '✕'}
                        </button>
                      )}
                    </div>
                    {editandoLegendaId === foto.id ? (
                      <input
                        type="text"
                        value={legendaTexto}
                        maxLength={100}
                        autoFocus
                        onChange={(e) => setLegendaTexto(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); salvarLegenda(foto.id); }
                          if (e.key === 'Escape') { e.preventDefault(); setEditandoLegendaId(null); }
                        }}
                        onBlur={() => salvarLegenda(foto.id)}
                        className="mt-1 w-full rounded border border-line bg-surface px-1.5 py-0.5 text-center text-[11px] text-ink focus:border-accent focus:outline-none"
                      />
                    ) : foto.descricao ? (
                      <button
                        type="button"
                        onClick={podeEditar ? () => iniciarEdicaoLegenda(foto) : undefined}
                        disabled={!podeEditar}
                        className={`mt-1 line-clamp-2 w-full text-center text-[11px] text-ink-soft ${podeEditar ? 'cursor-text hover:text-ink' : ''}`}
                      >
                        {foto.descricao}
                      </button>
                    ) : podeEditar ? (
                      <button
                        type="button"
                        onClick={() => iniciarEdicaoLegenda(foto)}
                        className="mt-1 w-full text-center text-[11px] text-ink-soft/40 hover:text-ink-soft"
                      >
                        + legenda
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Observações */}
        <div className="mb-5 rounded-lg border border-line bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink">Observações</h2>

          {os.observacoes.length === 0 ? (
            <p className="text-sm text-ink-soft">Nenhuma observação ainda.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {os.observacoes.map((obs) => (
                <li key={obs.id} className="border-l-2 border-line pl-3">
                  <p className="whitespace-pre-line text-sm text-ink">{obs.texto}</p>
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
                className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent"
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

        {/* 4. Fotos do serviço */}
        <div className="mb-5 rounded-lg border border-line bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Fotos do serviço</h2>
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
            <div className="mb-3 flex items-start justify-between gap-2 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
              <span>{erroFoto}</span>
              <button onClick={() => setErroFoto(null)} className="shrink-0 text-danger/70 hover:text-danger">✕</button>
            </div>
          )}

          {uploadandoFoto && <p className="mb-3 text-xs text-ink-soft">Enviando...</p>}

          {fotosServico.length === 0 && !uploadandoFoto ? (
            <p className="text-sm text-ink-soft">Nenhuma foto do serviço ainda.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {fotosServico.map((foto, indice) => (
                <div key={foto.id}>
                  <div className="relative cursor-pointer" onClick={() => abrirLightbox(fotosServico, indice)}>
                    {foto.tipo === 'VIDEO' ? (
                      <video src={foto.url} className="aspect-square w-full rounded-md object-cover" preload="metadata" />
                    ) : (
                      <img src={foto.url} alt={foto.descricao ?? 'Foto'} className="aspect-square w-full rounded-md object-cover" />
                    )}
                    {podeEditar && (
                      <button
                        onClick={(e) => { e.stopPropagation(); aoRemoverFoto(foto.id); }}
                        disabled={removendoFotoId === foto.id}
                        className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white"
                      >
                        {removendoFotoId === foto.id ? '...' : '✕'}
                      </button>
                    )}
                  </div>
                  {editandoLegendaId === foto.id ? (
                    <input
                      type="text"
                      value={legendaTexto}
                      maxLength={100}
                      autoFocus
                      onChange={(e) => setLegendaTexto(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); salvarLegenda(foto.id); }
                        if (e.key === 'Escape') { e.preventDefault(); setEditandoLegendaId(null); }
                      }}
                      onBlur={() => salvarLegenda(foto.id)}
                      className="mt-1 w-full rounded border border-line bg-surface px-1.5 py-0.5 text-center text-[11px] text-ink focus:border-accent focus:outline-none"
                    />
                  ) : foto.descricao ? (
                    <button
                      type="button"
                      onClick={podeEditar ? () => iniciarEdicaoLegenda(foto) : undefined}
                      disabled={!podeEditar}
                      className={`mt-1 line-clamp-2 w-full text-center text-[11px] text-ink-soft ${podeEditar ? 'cursor-text hover:text-ink' : ''}`}
                    >
                      {foto.descricao}
                    </button>
                  ) : podeEditar ? (
                    <button
                      type="button"
                      onClick={() => iniciarEdicaoLegenda(foto)}
                      className="mt-1 w-full text-center text-[11px] text-ink-soft/40 hover:text-ink-soft"
                    >
                      + legenda
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. Orçamento: peças e serviços terceirizados */}
        <div className="mb-5 rounded-lg border border-line bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink">Orçamento</h2>

          {([
            { tipo: 'PECA' as const, titulo: 'Peças', itens: itensPecas },
            { tipo: 'TERCEIRIZADO' as const, titulo: 'Serviços terceirizados', itens: itensTerceirizados },
          ]).map((grupo, indiceGrupo) => (
            <div key={grupo.tipo} className={indiceGrupo > 0 ? 'mt-4 border-t border-line pt-4' : ''}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{grupo.titulo}</h3>
                {podeEditar && !(formOrcamento?.tipo === grupo.tipo && formOrcamento.itemId === null) && (
                  <button
                    type="button"
                    onClick={() => abrirFormNovoItemOrcamento(grupo.tipo)}
                    className="text-xs font-medium text-accent-ink underline"
                  >
                    + Adicionar
                  </button>
                )}
              </div>

              {grupo.itens.length === 0 ? (
                <p className="text-sm text-ink-soft">Nenhum item lançado.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {grupo.itens.map((item) => {
                    const subtotal = subtotalItemOrcamento(item);
                    return (
                      <li key={item.id} className="flex items-start justify-between gap-2 border-l-2 border-line pl-3">
                        <div>
                          <p className="text-sm text-ink">
                            {item.quantidade} {item.unidade} · {item.descricao}
                            {item.tipo === 'TERCEIRIZADO' && item.fornecedor ? ` · ${item.fornecedor}` : ''}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink-soft">{item.criadoPor.nome}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {ehModerador && subtotal != null && (
                            <span className="font-mono text-sm font-semibold text-ink">{formatarCentavos(subtotal)}</span>
                          )}
                          {podeEditar && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => abrirFormEdicaoItemOrcamento(item)}
                                className="text-xs text-ink-soft underline hover:text-ink"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => aoRemoverItemOrcamento(item.id)}
                                disabled={removendoOrcamentoId === item.id}
                                className="text-xs text-ink-soft underline hover:text-danger"
                              >
                                {removendoOrcamentoId === item.id ? '...' : 'Remover'}
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {formOrcamento?.tipo === grupo.tipo && (
                <form onSubmit={aoSubmeterFormOrcamento} className="mt-3 flex flex-col gap-3 border-t border-line pt-3">
                  <div className="relative">
                    <Campo
                      rotulo="Descrição"
                      id={`descricaoOrcamento-${grupo.tipo}`}
                      value={descricaoOrcamento}
                      onChange={(e) => aoDigitarDescricaoOrcamento(e.target.value)}
                      onFocus={aoFocarDescricaoOrcamento}
                      placeholder={grupo.tipo === 'PECA' ? 'Ex: Coxim do motor' : 'Ex: Alinhamento e balanceamento'}
                      autoComplete="off"
                      required
                    />
                    {sugestoesOrcamento.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface shadow-md">
                        {sugestoesOrcamento.map((s) => (
                          <li key={s.descricao}>
                            <button
                              type="button"
                              onClick={() => aplicarSugestaoOrcamento(s)}
                              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-bg"
                            >
                              <span className="text-ink">{s.descricao} · {s.total} {s.total === 1 ? 'uso' : 'usos'}</span>
                              {ehModerador && s.valorUnitarioCentavos != null && (
                                <span className="shrink-0 font-mono text-xs text-ink-soft">{formatarCentavos(s.valorUnitarioCentavos)}</span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Campo
                      rotulo="Quantidade"
                      id={`quantidadeOrcamento-${grupo.tipo}`}
                      inputMode="decimal"
                      value={quantidadeOrcamento}
                      onChange={(e) => setQuantidadeOrcamento(e.target.value)}
                      required
                    />
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-ink-soft">Unidade</span>
                      <select
                        value={UNIDADES_COMUNS.includes(unidadeOrcamento) ? unidadeOrcamento : 'outro'}
                        onChange={(e) => setUnidadeOrcamento(e.target.value === 'outro' ? '' : e.target.value)}
                        className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent"
                      >
                        {UNIDADES_COMUNS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                        <option value="outro">Outra...</option>
                      </select>
                    </label>
                  </div>

                  {!UNIDADES_COMUNS.includes(unidadeOrcamento) && (
                    <Campo
                      rotulo="Digite a unidade"
                      id={`unidadeCustom-${grupo.tipo}`}
                      value={unidadeOrcamento}
                      onChange={(e) => setUnidadeOrcamento(e.target.value)}
                      placeholder="Ex: metro linear"
                    />
                  )}

                  {grupo.tipo === 'TERCEIRIZADO' && (
                    <Campo
                      rotulo="Fornecedor (opcional)"
                      id={`fornecedorOrcamento-${grupo.tipo}`}
                      value={fornecedorOrcamento}
                      onChange={(e) => setFornecedorOrcamento(e.target.value)}
                    />
                  )}

                  {ehModerador && (
                    <Campo
                      rotulo="Valor unitário (R$)"
                      id={`valorUnitarioOrcamento-${grupo.tipo}`}
                      inputMode="decimal"
                      value={valorUnitarioOrcamento}
                      onChange={(e) => setValorUnitarioOrcamento(e.target.value)}
                      placeholder="Ex: 120"
                    />
                  )}

                  <div className="flex gap-2">
                    <Botao type="submit" disabled={enviandoOrcamento}>
                      {enviandoOrcamento ? 'Salvando...' : formOrcamento.itemId ? 'Salvar' : 'Adicionar'}
                    </Botao>
                    <Botao type="button" variante="secundario" onClick={fecharFormOrcamento}>Cancelar</Botao>
                  </div>
                </form>
              )}
            </div>
          ))}

          {ehModerador && os.itensOrcamento.length > 0 && (
            <div className="mt-4 flex flex-col gap-1 border-t border-line pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">Total peças</span>
                <span className="font-mono text-ink">{formatarCentavos(totalPecasCentavos)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">Total terceirizados</span>
                <span className="font-mono text-ink">{formatarCentavos(totalTerceirizadosCentavos)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-line pt-2">
                <span className="text-sm font-semibold text-ink">Total geral do orçamento</span>
                <span className="font-mono text-sm font-bold text-ink">{formatarCentavos(totalGeralOrcamentoCentavos)}</span>
              </div>
            </div>
          )}
        </div>

        {/* 6. Mão de obra — só moderador */}
        {ehModerador && (
          <div className="mb-5 rounded-lg border border-line bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Mão de obra</h2>
              {podeEditar && !mostrarFormItem && (
                <button onClick={() => setMostrarFormItem(true)} className="text-xs font-medium text-accent-ink underline">+ Lançar</button>
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
                        {item.tipoValor === 'HORAS' ? `${item.horas}h` : 'Valor fechado'}{' · '}{item.criadoPor.nome}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {item.valorTotalCentavos != null && (
                        <span className="font-mono text-sm font-semibold text-ink">{formatarCentavos(item.valorTotalCentavos)}</span>
                      )}
                      {podeEditar && (
                        <button onClick={() => aoRemoverItem(item.id)} disabled={removendoItemId === item.id} className="text-xs text-ink-soft underline hover:text-danger">
                          {removendoItemId === item.id ? '...' : 'Remover'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {os.itensMaoDeObra.length > 0 && (
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="text-sm font-semibold text-ink">Total mão de obra</span>
                <span className="font-mono text-sm font-bold text-ink">
                  {formatarCentavos(totalMaoDeObraCentavos)}
                </span>
              </div>
            )}

            {mostrarFormItem && (
              <form onSubmit={aoAdicionarItem} className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
                <div className="relative">
                  <Campo rotulo="Descrição do serviço" id="descricaoItemNovo" value={descricaoItemNovo} onChange={(e) => aoDigitarDescricaoItem(e.target.value)} placeholder="Ex: Troca de embreagem" autoComplete="off" required />
                  {sugestoesItem.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface shadow-md">
                      {sugestoesItem.map((s) => (
                        <li key={s.descricao}>
                          <button type="button" onClick={() => aplicarSugestao(s)} className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-bg">
                            <span className="text-ink">{s.descricao}</span>
                            <span className="font-mono text-xs text-ink-soft">{formatarCentavos(s.valorTotalCentavos)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => setTipoValorNovo('HORAS')} className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${tipoValorNovo === 'HORAS' ? 'border-accent bg-accent text-white' : 'border-line text-ink-soft'}`}>Por hora</button>
                  <button type="button" onClick={() => setTipoValorNovo('FECHADO')} className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${tipoValorNovo === 'FECHADO' ? 'border-accent bg-accent text-white' : 'border-line text-ink-soft'}`}>Valor fechado</button>
                </div>

                {tipoValorNovo === 'HORAS' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Campo rotulo="Horas trabalhadas" id="horasNovo" inputMode="decimal" value={horasNovo} onChange={(e) => setHorasNovo(e.target.value)} placeholder="Ex: 2.5" required />
                    <Campo rotulo="Valor por hora (R$)" id="valorHoraNovo" inputMode="decimal" value={valorHoraNovo} onChange={(e) => setValorHoraNovo(e.target.value)} placeholder="Ex: 80" required />
                  </div>
                ) : (
                  <Campo rotulo="Valor fechado (R$)" id="valorFechadoNovo" inputMode="decimal" value={valorFechadoNovo} onChange={(e) => setValorFechadoNovo(e.target.value)} placeholder="Ex: 250" required />
                )}

                <div className="flex gap-2">
                  <Botao type="submit" disabled={enviandoItem}>{enviandoItem ? 'Lançando...' : 'Lançar'}</Botao>
                  <Botao type="button" variante="secundario" onClick={() => { setMostrarFormItem(false); setSugestoesItem([]); }}>Cancelar</Botao>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 7. Histórico do veículo */}
        {historico.length > 0 && (
          <div className="rounded-lg border border-line bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink">Serviços anteriores deste veículo</h2>
            <ul className="flex flex-col gap-2">
              {historico.map((item) => (
                <li key={item.id}>
                  <Link to={`/os/${item.id}`} className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm hover:border-ink/40">
                    <span className="text-ink-soft">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                    <StatusTag status={item.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* Barra de ações sticky */}
      {temAcaoDisponivel && (
        <div className="fixed bottom-14 left-0 right-0 z-10 border-t border-line bg-surface px-4 py-3 sm:bottom-0">
          <div className="mx-auto flex max-w-xl flex-wrap gap-2">
            {os.status === 'ORCAMENTO' && (
              <>
                <Botao type="button" onClick={() => avançarStatus('EM_ANDAMENTO')} disabled={salvando}>
                  Aprovar orçamento
                </Botao>
                {ehModerador && (
                  <Botao type="button" variante="perigo" onClick={() => avançarStatus('REJEITADO')} disabled={salvando}>
                    Recusar
                  </Botao>
                )}
              </>
            )}
            {os.status === 'EM_ANDAMENTO' && ehModerador && (
              <Botao type="button" onClick={() => avançarStatus('FINALIZADO')} disabled={salvando}>
                Finalizar Ordem de Serviço
              </Botao>
            )}
            {estadosFinais.includes(os.status) && ehModerador && (
              <Botao type="button" variante="secundario" onClick={() => avançarStatus('EM_ANDAMENTO')} disabled={salvando}>
                Reabrir
              </Botao>
            )}
          </div>
        </div>
      )}

      {/* Modal de corte de vídeo */}
      {videoParaCortar && videoParaCortarUrl && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 sm:items-center">
          <div className="flex w-full max-w-lg flex-col bg-black sm:overflow-hidden sm:rounded-xl">
            <div className="flex items-center justify-between p-4">
              <p className="text-sm font-semibold text-white">Cortar vídeo</p>
              <button onClick={() => setVideoParaCortar(null)} className="text-sm text-white/70" disabled={cortandoVideo}>Cancelar</button>
            </div>
            <video ref={videoModalRef} src={videoParaCortarUrl} className="max-h-64 w-full object-contain" playsInline />
            <div className="bg-surface p-4">
              <p className="mb-3 text-xs text-ink-soft">
                Mova o slider para escolher o trecho de {MAX_DURACAO_VIDEO_S}s que quer enviar.
              </p>
              <input
                type="range"
                min={0}
                max={Math.max(0, videoParaCortar.duracao - MAX_DURACAO_VIDEO_S)}
                step={0.5}
                value={inicioCorteSeg}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setInicioCorteSeg(v);
                  if (videoModalRef.current) videoModalRef.current.currentTime = v;
                }}
                className="w-full"
                disabled={cortandoVideo}
              />
              <p className="mt-2 text-center text-sm font-medium text-ink">
                {formatarSegundos(inicioCorteSeg)}{' → '}{formatarSegundos(Math.min(inicioCorteSeg + MAX_DURACAO_VIDEO_S, videoParaCortar.duracao))}
              </p>
              <Botao type="button" onClick={aoEnviarVideoComCorte} disabled={cortandoVideo} className="mt-3 w-full">
                {cortandoVideo ? `Cortando... (pode levar até ${MAX_DURACAO_VIDEO_S}s)` : 'Cortar e Enviar'}
              </Botao>
            </div>
          </div>
        </div>
      )}

      {lightbox && (
        <Lightbox
          itens={lightbox.itens}
          indiceInicial={lightbox.indice}
          placa={os.veiculo.placa}
          aoFechar={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
