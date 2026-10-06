import { api } from './api';

export type StatusAgendamento = 'AGENDADO' | 'CONCLUIDO' | 'CANCELADO';

export interface Agendamento {
  id: string;
  dataHora: string;
  // Opcional: quem liga para marcar nem sempre sabe a placa de cabeça.
  placa: string | null;
  modelo: string | null;
  nomeCliente: string | null;
  telefone: string | null;
  motivo: string | null;
  status: StatusAgendamento;
  criadoPor?: { id: string; nome: string; login: string } | null;
}

// Na edição, campo apagado vai como "" (e não omitido): omitido o backend
// entende "não mexer", e o telefone apagado continuaria lá.
export interface DadosAgendamento {
  dataHora: string;
  placa: string;
  modelo: string;
  nomeCliente: string;
  telefone: string;
  motivo: string;
}

// Intervalo [de, ate) - as datas vão como instante ISO calculado no fuso do
// navegador, então "dia 6" começa à meia-noite de Brasília, não de Londres.
export function listarAgendamentos(de: Date, ate: Date) {
  const params = new URLSearchParams({ de: de.toISOString(), ate: ate.toISOString() });
  return api<Agendamento[]>(`/agendamentos?${params}`);
}

export function criarAgendamento(dados: DadosAgendamento) {
  return api<Agendamento>('/agendamentos', { method: 'POST', body: dados });
}

export function atualizarAgendamento(id: string, dados: DadosAgendamento) {
  return api<Agendamento>(`/agendamentos/${id}`, { method: 'PATCH', body: dados });
}

export function mudarStatusAgendamento(id: string, status: StatusAgendamento) {
  return api<Agendamento>(`/agendamentos/${id}/status`, { method: 'PATCH', body: { status } });
}

// ---- Datas (sempre no fuso do navegador = horário da oficina) ----

export function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

export function somarDias(data: Date, dias: number): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias);
}

// A agenda da oficina começa na segunda; domingo fica no fim da linha.
export function segundaDaSemana(data: Date): Date {
  const dia = inicioDoDia(data);
  const deslocamento = (dia.getDay() + 6) % 7;
  return somarDias(dia, -deslocamento);
}

export function mesmoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// "2026-10-07" para <input type="date">, sem passar por UTC (toISOString
// mudaria o dia depois das 21h).
export function paraInputData(data: Date): string {
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const d = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${m}-${d}`;
}

export function deInputData(valor: string): Date | null {
  const [a, m, d] = valor.split('-').map(Number);
  if (!a || !m || !d) return null;
  return new Date(a, m - 1, d);
}

export function horaMinuto(data: Date): string {
  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
}

const SIGLAS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
export function siglaDoDia(data: Date): string {
  return SIGLAS[data.getDay()];
}

export function diaPorExtenso(data: Date, hoje = new Date()): string {
  const extenso = data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  if (mesmoDia(data, hoje)) return `Hoje · ${extenso}`;
  if (mesmoDia(data, somarDias(hoje, 1))) return `Amanhã · ${extenso}`;
  if (mesmoDia(data, somarDias(hoje, -1))) return `Ontem · ${extenso}`;
  return extenso.charAt(0).toUpperCase() + extenso.slice(1);
}

export function resumoDataHora(data: Date): string {
  const semana = data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  const diaMes = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${semana}, ${diaMes} às ${horaMinuto(data)}`;
}

export function tituloDaSemana(inicio: Date): string {
  const fim = somarDias(inicio, 6);
  const mes = (d: Date) => d.toLocaleDateString('pt-BR', { month: 'long' });
  if (inicio.getMonth() === fim.getMonth()) {
    return `${inicio.getDate()} – ${fim.getDate()} de ${mes(fim)} de ${fim.getFullYear()}`;
  }
  return `${inicio.getDate()} de ${mes(inicio)} – ${fim.getDate()} de ${mes(fim)}`;
}

// Expediente da oficina, de meia em meia hora: seg-sex 8h-18h, sáb 8h-13h.
export function horariosDoDia(data: Date): string[] {
  const diaSemana = data.getDay();
  if (diaSemana === 0) return [];
  const ultimoMinuto = diaSemana === 6 ? 12 * 60 + 30 : 17 * 60 + 30;
  const lista: string[] = [];
  for (let m = 8 * 60; m <= ultimoMinuto; m += 30) {
    lista.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return lista;
}

// Como o agendamento é chamado na tela: placa, senão nome, senão modelo.
export function identificacao(a: Agendamento): string {
  return a.placa ?? a.nomeCliente ?? a.modelo ?? a.telefone ?? 'Sem identificação';
}

// "(16) 99999-0000" -> "5516999990000"; número que não parece do Brasil -> null.
export function numeroParaWhatsApp(telefone: string): string | null {
  const digitos = telefone.replace(/\D/g, '').replace(/^0+/, '');
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) return digitos;
  return null;
}

export function mensagemDeConfirmacao(a: Agendamento): string {
  const primeiroNome = a.nomeCliente?.trim().split(' ')[0];
  const saudacao = primeiroNome ? `Olá, ${primeiroNome}!` : 'Olá!';
  const horario =
    a.modelo && a.placa ? `o horário do seu ${a.modelo} (${a.placa})`
      : a.modelo ? `o horário do seu ${a.modelo}`
        : a.placa ? `o horário do seu carro ${a.placa}`
          : 'o seu horário';
  return (
    `${saudacao} Aqui é da Meca Mecânica.\n\n` +
    `Confirmando ${horario}: ${resumoDataHora(new Date(a.dataHora))}.\n\n` +
    'Se precisar remarcar, é só responder esta mensagem. Até lá!'
  );
}
