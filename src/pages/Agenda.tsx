import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { Botao } from '../components/Botao';
import { Campo } from '../components/Campo';
import { ApiError } from '../lib/api';
import { buscarVeiculoPorPlaca } from '../lib/veiculosApi';
import {
  type Agendamento,
  type StatusAgendamento,
  atualizarAgendamento,
  criarAgendamento,
  deInputData,
  diaPorExtenso,
  horaMinuto,
  horariosDoDia,
  inicioDoDia,
  listarAgendamentos,
  mensagemDeConfirmacao,
  mesmoDia,
  mudarStatusAgendamento,
  numeroParaWhatsApp,
  paraInputData,
  resumoDataHora,
  segundaDaSemana,
  siglaDoDia,
  somarDias,
  tituloDaSemana,
} from '../lib/agendaApi';
import type { Veiculo } from '../lib/types';

const ESTILO_STATUS: Record<StatusAgendamento, { rotulo: string; texto: string; fundo: string; barra: string }> = {
  AGENDADO: {
    rotulo: 'Agendado',
    texto: 'text-status-andamento',
    fundo: 'bg-status-andamento-bg',
    barra: 'bg-status-andamento',
  },
  // No banco é CONCLUIDO; na tela é o que aconteceu de fato: o carro chegou.
  CONCLUIDO: {
    rotulo: 'Chegou',
    texto: 'text-status-finalizado',
    fundo: 'bg-status-finalizado-bg',
    barra: 'bg-status-finalizado',
  },
  CANCELADO: {
    rotulo: 'Cancelado',
    texto: 'text-status-rejeitado',
    fundo: 'bg-status-rejeitado-bg',
    barra: 'bg-status-rejeitado',
  },
};

type Formulario = { existente: Agendamento | null; dia: Date } | null;

function ordenar(lista: Agendamento[]): Agendamento[] {
  return [...lista].sort((a, b) => a.dataHora.localeCompare(b.dataHora));
}

export function Agenda() {
  const navegar = useNavigate();
  const hoje = inicioDoDia(new Date());

  const [diaSelecionado, setDiaSelecionado] = useState<Date>(hoje);
  const inicioSemana = useMemo(() => segundaDaSemana(diaSelecionado), [diaSelecionado]);
  const chaveSemana = inicioSemana.getTime();

  // Resultado guardado junto da semana a que pertence: enquanto a semana
  // nova não chega, a tela sabe que o que tem em mãos é da semana errada.
  const [resultado, setResultado] = useState<{ chave: number; lista: Agendamento[]; erro: string | null } | null>(null);
  const [recarga, setRecarga] = useState(0);
  const carregando = resultado?.chave !== chaveSemana;
  const agendamentos = resultado && !carregando ? resultado.lista : [];
  const erro = resultado && !carregando ? resultado.erro : null;

  const [aberto, setAberto] = useState<Agendamento | null>(null);
  const [formulario, setFormulario] = useState<Formulario>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Uma chamada por semana: trocar de dia dentro dela é só filtro em
  // memória, e os pontinhos de "tem carro" saem da mesma resposta.
  useEffect(() => {
    let ativo = true;
    const inicio = new Date(chaveSemana);
    listarAgendamentos(inicio, somarDias(inicio, 7))
      .then((lista) => {
        if (ativo) setResultado({ chave: chaveSemana, lista: ordenar(lista), erro: null });
      })
      .catch((e) => {
        if (ativo) {
          setResultado({
            chave: chaveSemana,
            lista: [],
            erro: e instanceof ApiError ? e.message : 'Não foi possível carregar a agenda.',
          });
        }
      });
    return () => { ativo = false; };
  }, [chaveSemana, recarga]);

  const carregar = useCallback(() => {
    setResultado(null);
    setRecarga((n) => n + 1);
  }, []);

  function setAgendamentos(mudar: (lista: Agendamento[]) => Agendamento[]) {
    setResultado((r) => (r ? { ...r, lista: ordenar(mudar(r.lista)) } : r));
  }

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => somarDias(inicioSemana, i)), [inicioSemana]);
  const doDia = agendamentos.filter((a) => mesmoDia(new Date(a.dataHora), diaSelecionado));
  const quantidadeNoDia = (dia: Date) =>
    agendamentos.filter((a) => a.status !== 'CANCELADO' && mesmoDia(new Date(a.dataHora), dia)).length;

  function aoSalvar(salvo: Agendamento, eraNovo: boolean) {
    setFormulario(null);
    setAberto(null);
    const dia = inicioDoDia(new Date(salvo.dataHora));
    const mesmaSemana = segundaDaSemana(dia).getTime() === chaveSemana;
    setDiaSelecionado(dia);
    if (mesmaSemana) {
      setAgendamentos((lista) => [...lista.filter((a) => a.id !== salvo.id), salvo]);
    }
    setAviso(eraNovo ? 'Horário agendado' : 'Agendamento atualizado');
  }

  async function mudarStatus(a: Agendamento, status: StatusAgendamento) {
    try {
      const atualizado = await mudarStatusAgendamento(a.id, status);
      setAgendamentos((lista) => lista.map((x) => (x.id === a.id ? atualizado : x)));
      setAberto(null);
      return atualizado;
    } catch (e) {
      setAviso(e instanceof ApiError ? e.message : 'Não foi possível atualizar o agendamento.');
      return null;
    }
  }

  async function carroChegou(a: Agendamento) {
    await mudarStatus(a, 'CONCLUIDO');
    // A abertura da OS já começa com o que foi combinado por telefone.
    const params = new URLSearchParams({ placa: a.placa });
    if (a.motivo) params.set('queixa', a.motivo);
    if (a.modelo) params.set('modelo', a.modelo);
    if (a.nomeCliente) params.set('nome', a.nomeCliente);
    if (a.telefone) params.set('telefone', a.telefone);
    navegar(`/abrir?${params}`);
  }

  return (
    <div className="min-h-screen bg-bg">
      <Topbar />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-ink">Agenda</h1>
            <p className="text-xs text-ink-soft">{tituloDaSemana(inicioSemana)}</p>
          </div>
          <div className="flex items-center gap-2">
            {!mesmoDia(diaSelecionado, hoje) && (
              <Botao variante="secundario" tamanho="compacto" onClick={() => setDiaSelecionado(hoje)}>
                Hoje
              </Botao>
            )}
            <button
              type="button"
              aria-label="Semana anterior"
              onClick={() => setDiaSelecionado(somarDias(diaSelecionado, -7))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink hover:border-ink/40"
            >
              <Seta direcao="esquerda" />
            </button>
            <button
              type="button"
              aria-label="Próxima semana"
              onClick={() => setDiaSelecionado(somarDias(diaSelecionado, 7))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink hover:border-ink/40"
            >
              <Seta direcao="direita" />
            </button>
            <Botao onClick={() => setFormulario({ existente: null, dia: diaSelecionado.getTime() < hoje.getTime() ? hoje : diaSelecionado })}>
              + Agendar
            </Botao>
          </div>
        </div>

        {/* Faixa da semana: dá para ver de relance que dia está cheio. */}
        <div className="mb-6 grid grid-cols-7 gap-1.5 sm:gap-2">
          {dias.map((dia) => {
            const selecionado = mesmoDia(dia, diaSelecionado);
            const ehHoje = mesmoDia(dia, hoje);
            const domingo = dia.getDay() === 0;
            const qtd = quantidadeNoDia(dia);
            return (
              <button
                key={dia.getTime()}
                type="button"
                onClick={() => setDiaSelecionado(dia)}
                className={`flex flex-col items-center gap-0.5 rounded-xl border py-2 transition-colors ${
                  selecionado
                    ? 'border-accent bg-accent text-white'
                    : ehHoje
                      ? 'border-accent-ink bg-surface text-accent-ink'
                      : `border-line bg-surface hover:border-ink/40 ${domingo ? 'text-ink-soft/60' : 'text-ink'}`
                }`}
              >
                <span className={`text-[11px] font-semibold tracking-wide ${selecionado ? 'text-white/85' : 'opacity-75'}`}>
                  {siglaDoDia(dia)}
                </span>
                <span className="font-display text-lg font-bold leading-tight">{dia.getDate()}</span>
                <span className="flex h-2 items-center gap-0.5">
                  {qtd > 0 && qtd <= 3 &&
                    Array.from({ length: qtd }, (_, i) => (
                      <span key={i} className={`h-1.5 w-1.5 rounded-full ${selecionado ? 'bg-white' : 'bg-accent-ink'}`} />
                    ))}
                  {qtd > 3 && (
                    <span className={`text-[10px] font-bold leading-none ${selecionado ? 'text-white' : 'text-accent-ink'}`}>{qtd}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="truncate text-sm font-semibold text-ink">{diaPorExtenso(diaSelecionado, hoje)}</h2>
          {quantidadeNoDia(diaSelecionado) > 0 && (
            <span className="shrink-0 text-xs text-ink-soft">
              {quantidadeNoDia(diaSelecionado) === 1 ? '1 carro' : `${quantidadeNoDia(diaSelecionado)} carros`}
            </span>
          )}
        </div>

        {carregando && agendamentos.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-soft">Carregando a agenda...</p>
        )}

        {erro && (
          <div className="flex items-center justify-between gap-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            <span>{erro}</span>
            <button type="button" onClick={carregar} className="font-medium underline">Tentar de novo</button>
          </div>
        )}

        {!carregando && !erro && doDia.length === 0 && (
          <div className="rounded-lg border border-dashed border-line bg-surface px-6 py-12 text-center">
            <p className="font-medium text-ink">{diaSelecionado.getTime() < hoje.getTime() ? 'Nenhum carro marcado' : 'Dia livre'}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {diaSelecionado.getTime() < hoje.getTime() ? 'Não houve agendamento neste dia.' : 'Nenhum carro marcado para este dia ainda.'}
            </p>
            {diaSelecionado.getTime() >= hoje.getTime() && (
              <Botao
                variante="secundario"
                className="mt-4"
                onClick={() => setFormulario({ existente: null, dia: diaSelecionado })}
              >
                + Agendar horário
              </Botao>
            )}
          </div>
        )}

        <ul className="flex flex-col gap-2.5">
          {doDia.map((a) => (
            <li key={a.id}>
              <LinhaAgendamento agendamento={a} aoClicar={() => setAberto(a)} />
            </li>
          ))}
        </ul>
      </main>

      {aberto && (
        <FichaAgendamento
          agendamento={aberto}
          aoFechar={() => setAberto(null)}
          aoCarroChegou={() => carroChegou(aberto)}
          aoEditar={() => {
            setFormulario({ existente: aberto, dia: inicioDoDia(new Date(aberto.dataHora)) });
            setAberto(null);
          }}
          aoMudarStatus={async (status) => {
            const ok = await mudarStatus(aberto, status);
            if (ok) {
              setAviso(
                status === 'CANCELADO'
                  ? `Agendamento de ${aberto.placa} cancelado`
                  : `${aberto.placa} voltou para a agenda`,
              );
            }
          }}
        />
      )}

      {formulario && (
        <FormularioAgendamento
          existente={formulario.existente}
          diaInicial={formulario.dia}
          aoFechar={() => setFormulario(null)}
          aoSalvar={aoSalvar}
        />
      )}

      {aviso && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg shadow-lg sm:bottom-6">
          {aviso}
        </div>
      )}
    </div>
  );
}

function Seta({ direcao }: { direcao: 'esquerda' | 'direita' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d={direcao === 'esquerda' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  );
}

function ChipStatus({ status }: { status: StatusAgendamento }) {
  const e = ESTILO_STATUS[status];
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${e.fundo} ${e.texto}`}>
      {e.rotulo}
    </span>
  );
}

// "em 40 min" / "atrasado 15 min" - só hoje e só para quem ainda não chegou.
function tempoAte(data: Date): { texto: string; atrasado: boolean } | null {
  const agora = new Date();
  if (!mesmoDia(data, agora)) return null;
  const minutos = Math.round((data.getTime() - agora.getTime()) / 60000);
  if (minutos >= 0 && minutos < 60) return { texto: `em ${minutos} min`, atrasado: false };
  if (minutos >= 60) return { texto: `em ${Math.floor(minutos / 60)} h`, atrasado: false };
  if (minutos > -60) return { texto: `atrasado ${-minutos} min`, atrasado: true };
  return { texto: `atrasado ${Math.floor(-minutos / 60)} h`, atrasado: true };
}

function LinhaAgendamento({ agendamento: a, aoClicar }: { agendamento: Agendamento; aoClicar: () => void }) {
  const data = new Date(a.dataHora);
  const cancelado = a.status === 'CANCELADO';
  const falta = a.status === 'AGENDADO' ? tempoAte(data) : null;

  return (
    <div className={`flex gap-3 ${cancelado ? 'opacity-55' : ''}`}>
      <div className="w-14 shrink-0 pt-3 text-right">
        <p className="font-display text-base font-bold text-ink">{horaMinuto(data)}</p>
        {falta && (
          <p className={`text-[11px] font-medium ${falta.atrasado ? 'text-danger' : 'text-warning'}`}>{falta.texto}</p>
        )}
      </div>
      <button
        type="button"
        onClick={aoClicar}
        className="flex min-w-0 flex-1 overflow-hidden rounded-lg border border-line bg-surface text-left shadow-sm transition-shadow hover:shadow-md"
      >
        <span className={`w-1.5 shrink-0 ${ESTILO_STATUS[a.status].barra}`} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-3">
          <span className="flex items-center justify-between gap-2">
            <span className={`font-mono text-base font-bold tracking-widest text-ink ${cancelado ? 'line-through' : ''}`}>
              {a.placa}
            </span>
            <ChipStatus status={a.status} />
          </span>
          {a.modelo && <span className="truncate text-sm text-ink">{a.modelo}</span>}
          {a.nomeCliente && <span className="truncate text-xs text-ink-soft">{a.nomeCliente}</span>}
          {a.motivo && <span className="mt-1 line-clamp-2 text-sm text-ink-soft">{a.motivo}</span>}
        </span>
      </button>
    </div>
  );
}

function Modal({ titulo, aoFechar, children }: { titulo: string; aoFechar: () => void; children: ReactNode }) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') aoFechar(); };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={aoFechar}>
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="font-display text-base font-bold text-ink">{titulo}</p>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className="rounded-full p-1 text-ink-soft hover:text-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FichaAgendamento({
  agendamento: a,
  aoFechar,
  aoCarroChegou,
  aoEditar,
  aoMudarStatus,
}: {
  agendamento: Agendamento;
  aoFechar: () => void;
  aoCarroChegou: () => void;
  aoEditar: () => void;
  aoMudarStatus: (status: StatusAgendamento) => Promise<void>;
}) {
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const data = new Date(a.dataHora);
  const numero = a.telefone ? numeroParaWhatsApp(a.telefone) : null;
  const linkWhatsApp = `https://wa.me/${numero ?? ''}?text=${encodeURIComponent(mensagemDeConfirmacao(a))}`;

  async function executar(status: StatusAgendamento) {
    setOcupado(true);
    await aoMudarStatus(status);
    setOcupado(false);
  }

  return (
    <Modal titulo="Agendamento" aoFechar={aoFechar}>
      <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-2xl font-bold tracking-widest text-ink">{a.placa}</span>
          <ChipStatus status={a.status} />
        </div>
        {a.modelo && <p className="-mt-2 text-base font-medium text-ink">{a.modelo}</p>}

        <dl className="flex flex-col gap-2 text-sm">
          <Detalhe rotulo="Quando" valor={`${diaPorExtenso(inicioDoDia(data))} às ${horaMinuto(data)}`} />
          {a.nomeCliente && <Detalhe rotulo="Cliente" valor={a.nomeCliente} />}
          {a.telefone && <Detalhe rotulo="Telefone" valor={a.telefone} />}
          {a.motivo && <Detalhe rotulo="O que vai ser feito" valor={a.motivo} />}
        </dl>
        {a.criadoPor?.nome && <p className="text-xs text-ink-soft">Marcado por {a.criadoPor.nome}</p>}

        {a.status === 'AGENDADO' && !confirmandoCancelamento && (
          <div className="flex flex-col gap-2 pt-1">
            <Botao onClick={aoCarroChegou} disabled={ocupado}>Carro chegou · abrir OS</Botao>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={linkWhatsApp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-line bg-surface px-3 py-2.5 text-sm font-medium text-ink hover:border-ink/40"
              >
                Confirmar no WhatsApp
              </a>
              <Botao variante="secundario" onClick={aoEditar} disabled={ocupado}>Editar ou remarcar</Botao>
            </div>
            <Botao variante="perigo" onClick={() => setConfirmandoCancelamento(true)} disabled={ocupado}>
              Cancelar agendamento
            </Botao>
          </div>
        )}

        {confirmandoCancelamento && (
          <div className="rounded-lg border border-danger/40 bg-danger-bg p-4">
            <p className="text-sm font-medium text-ink">Cancelar o horário de {a.placa}?</p>
            <p className="mt-1 text-xs text-ink-soft">O horário fica livre. Se o cliente mudar de ideia, dá para reativar depois.</p>
            <div className="mt-3 flex gap-2">
              <Botao variante="secundario" onClick={() => setConfirmandoCancelamento(false)} disabled={ocupado}>Manter</Botao>
              <Botao variante="perigo" onClick={() => executar('CANCELADO')} disabled={ocupado}>
                {ocupado ? 'Cancelando...' : 'Cancelar horário'}
              </Botao>
            </div>
          </div>
        )}

        {a.status === 'CANCELADO' && (
          <div className="flex flex-col gap-2 pt-1">
            <Botao onClick={() => executar('AGENDADO')} disabled={ocupado}>Reativar agendamento</Botao>
            <Botao variante="secundario" onClick={aoEditar} disabled={ocupado}>Remarcar para outro dia</Botao>
          </div>
        )}

        {a.status === 'CONCLUIDO' && (
          <Botao variante="secundario" onClick={() => executar('AGENDADO')} disabled={ocupado}>
            Marcou sem querer? Voltar para agendado
          </Botao>
        )}
      </div>
    </Modal>
  );
}

function Detalhe({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">{rotulo}</dt>
      <dd className="whitespace-pre-line text-ink">{valor}</dd>
    </div>
  );
}

function FormularioAgendamento({
  existente,
  diaInicial,
  aoFechar,
  aoSalvar,
}: {
  existente: Agendamento | null;
  diaInicial: Date;
  aoFechar: () => void;
  aoSalvar: (salvo: Agendamento, eraNovo: boolean) => void;
}) {
  const dataExistente = existente ? new Date(existente.dataHora) : null;

  const [placa, setPlaca] = useState(existente?.placa ?? '');
  const [data, setData] = useState<Date>(dataExistente ? inicioDoDia(dataExistente) : diaInicial);
  const [hora, setHora] = useState<string>(dataExistente ? horaMinuto(dataExistente) : '');
  const [modelo, setModelo] = useState(existente?.modelo ?? '');
  const [nomeCliente, setNomeCliente] = useState(existente?.nomeCliente ?? '');
  const [telefone, setTelefone] = useState(existente?.telefone ?? '');
  const [motivo, setMotivo] = useState(existente?.motivo ?? '');

  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);
  const [doDia, setDoDia] = useState<Agendamento[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // O que a busca pela placa preencheu sozinha: se a placa mudar, só isso
  // é limpo - o que a pessoa digitou à mão nunca some.
  const preenchidoAuto = useRef({ modelo: '', nome: '', telefone: '' });

  const placaLimpa = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const placaValida = placaLimpa.length >= 7;

  // Carro que já veio aqui: modelo, dono e telefone aparecem sozinhos.
  useEffect(() => {
    if (!placaValida) return;
    const t = setTimeout(() => {
      buscarVeiculoPorPlaca(placaLimpa)
        .then(({ veiculo: v }) => {
          if (!v) return;
          setVeiculo(v);
          const descricao = [v.marca, v.modelo, v.ano].filter(Boolean).join(' ');
          setModelo((atual) => {
            if (atual.trim()) return atual;
            preenchidoAuto.current.modelo = descricao;
            return descricao;
          });
          setNomeCliente((atual) => {
            if (atual.trim()) return atual;
            preenchidoAuto.current.nome = v.cliente?.nome ?? '';
            return v.cliente?.nome ?? '';
          });
          setTelefone((atual) => {
            if (atual.trim()) return atual;
            preenchidoAuto.current.telefone = v.cliente?.telefone ?? '';
            return v.cliente?.telefone ?? '';
          });
        })
        .catch(() => {});
    }, 350);
    return () => clearTimeout(t);
  }, [placaLimpa, placaValida]);

  function aoMudarPlaca(valor: string) {
    const auto = preenchidoAuto.current;
    if (auto.modelo && modelo === auto.modelo) setModelo('');
    if (auto.nome && nomeCliente === auto.nome) setNomeCliente('');
    if (auto.telefone && telefone === auto.telefone) setTelefone('');
    preenchidoAuto.current = { modelo: '', nome: '', telefone: '' };
    setVeiculo(null);
    setPlaca(valor.toUpperCase().slice(0, 8));
  }

  // Os outros carros do dia escolhido: mostra horário já ocupado.
  const chaveDia = data.getTime();
  useEffect(() => {
    const inicio = new Date(chaveDia);
    listarAgendamentos(inicio, somarDias(inicio, 1)).then(setDoDia).catch(() => setDoDia([]));
  }, [chaveDia]);

  const outrosAtivos = doDia.filter((a) => a.id !== existente?.id && a.status !== 'CANCELADO');
  const ocupacao = (h: string) => outrosAtivos.filter((a) => horaMinuto(new Date(a.dataHora)) === h).length;
  const mesmoCarro = placaValida
    ? outrosAtivos.find((a) => a.placa.replace(/[^A-Za-z0-9]/g, '') === placaLimpa)
    : undefined;

  const horarios = horariosDoDia(data);
  const todosHorarios = hora && !horarios.includes(hora) ? [...horarios, hora].sort() : horarios;

  const dataHora = (() => {
    if (!hora) return null;
    const [h, m] = hora.split(':').map(Number);
    return new Date(data.getFullYear(), data.getMonth(), data.getDate(), h, m);
  })();
  // "Agora" fixado quando o formulário abre - recalcular a cada tecla
  // faria o aviso piscar no exato minuto em que o horário passa.
  const [agora] = useState(() => Date.now());
  const jaPassou = dataHora !== null && dataHora.getTime() < agora;
  const podeSalvar = placaValida && dataHora !== null && !salvando;

  async function salvar() {
    if (!podeSalvar || !dataHora) return;
    setSalvando(true);
    setErro(null);
    const dados = {
      dataHora: dataHora.toISOString(),
      placa: placaLimpa,
      modelo: modelo.trim(),
      nomeCliente: nomeCliente.trim(),
      telefone: telefone.trim(),
      motivo: motivo.trim(),
    };
    try {
      const salvo = existente ? await atualizarAgendamento(existente.id, dados) : await criarAgendamento(dados);
      aoSalvar(salvo, !existente);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar o agendamento.');
      setSalvando(false);
    }
  }

  const rotuloBotao = salvando
    ? 'Salvando...'
    : !placaValida
      ? 'Informe a placa'
      : !dataHora
        ? 'Escolha o horário'
        : `${existente ? 'Salvar' : 'Agendar'} · ${resumoDataHora(dataHora)}`;

  return (
    <Modal titulo={existente ? 'Editar agendamento' : 'Novo agendamento'} aoFechar={aoFechar}>
      <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-soft">Placa</span>
          <input
            value={placa}
            onChange={(e) => aoMudarPlaca(e.target.value)}
            placeholder="ABC1D23"
            autoFocus={!existente}
            className="rounded-md border border-line bg-bg px-3 py-3 text-center font-mono text-2xl font-bold tracking-[0.25em] text-ink placeholder:text-ink-soft/30 focus:border-accent"
          />
        </label>
        {veiculo && (
          <p className="-mt-2 rounded-md bg-success-bg px-3 py-2 text-xs text-success">
            Carro já cadastrado: {[veiculo.marca, veiculo.modelo, veiculo.ano].filter(Boolean).join(' ')}
            {veiculo.cliente?.nome ? ` · ${veiculo.cliente.nome}` : ''}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-soft">Dia</span>
          <div className="flex flex-wrap items-center gap-2">
            {[0, 1].map((n) => {
              const dia = somarDias(inicioDoDia(new Date()), n);
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setData(dia)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                    mesmoDia(dia, data) ? 'border-accent bg-accent text-white' : 'border-line bg-bg text-ink hover:border-ink/40'
                  }`}
                >
                  {n === 0 ? 'Hoje' : 'Amanhã'}
                </button>
              );
            })}
            <input
              type="date"
              value={paraInputData(data)}
              onChange={(e) => { const d = deInputData(e.target.value); if (d) setData(d); }}
              className="rounded-md border border-line bg-bg px-3 py-1.5 text-sm text-ink focus:border-accent [color-scheme:dark]"
            />
          </div>
          <p className="text-xs text-ink-soft">{diaPorExtenso(data)}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-soft">Horário</span>
          {horarios.length === 0 && (
            <p className="text-xs text-ink-soft">Domingo a oficina não abre. Se for o caso, escolha o horário à mão.</p>
          )}
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
            {todosHorarios.map((h) => {
              const qtd = ocupacao(h);
              const selecionado = h === hora;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHora(h)}
                  className={`relative rounded-md border py-2 text-sm font-medium ${
                    selecionado
                      ? 'border-accent bg-accent text-white'
                      : qtd > 0
                        ? 'border-warning/50 bg-bg text-ink hover:border-warning'
                        : 'border-line bg-bg text-ink hover:border-ink/40'
                  }`}
                >
                  {h}
                  {qtd > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold text-bg">
                      {qtd}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">Outro horário:</span>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="rounded-md border border-line bg-bg px-2 py-1 text-sm text-ink focus:border-accent [color-scheme:dark]"
            />
          </div>
          {horarios.length > 0 && (
            <p className="text-[11px] text-ink-soft">Número em amarelo = carros já marcados naquele horário.</p>
          )}
        </div>

        {mesmoCarro && (
          <p className="rounded-md bg-warning-bg px-3 py-2 text-xs text-warning">
            {mesmoCarro.placa} já tem horário neste dia às {horaMinuto(new Date(mesmoCarro.dataHora))}. Confira se não é o
            mesmo agendamento marcado duas vezes.
          </p>
        )}
        {jaPassou && (
          <p className="rounded-md bg-bg px-3 py-2 text-xs text-ink-soft">
            Esse horário já passou. Dá para salvar assim mesmo, para ficar registrado.
          </p>
        )}

        <Campo rotulo="Modelo do carro" id="ag-modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome do cliente" id="ag-nome" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} />
          <Campo rotulo="Telefone / WhatsApp" id="ag-telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </div>
        <label className="flex flex-col gap-1.5" htmlFor="ag-motivo">
          <span className="text-xs font-medium text-ink-soft">O que vai ser feito</span>
          <textarea
            id="ag-motivo"
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: revisão, barulho na suspensão, troca de óleo"
            className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent"
          />
        </label>

        {erro && <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{erro}</p>}
      </div>

      {/* Botão resume o que vai ser salvo: quem marca por telefone confere
          dia e hora no próprio botão - e já repete para o cliente. */}
      <div className="border-t border-line px-5 py-3.5">
        <Botao className="w-full" onClick={salvar} disabled={!podeSalvar}>{rotuloBotao}</Botao>
      </div>
    </Modal>
  );
}
