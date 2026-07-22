import { api } from './api';
import type { Cliente, StatusOrdemServico, TipoPessoa, Veiculo } from './types';

export function buscarClientes(termo: string) {
  return api<Cliente[]>(`/clientes?busca=${encodeURIComponent(termo)}`);
}

// Área de clientes (só moderadora): mesma busca, mas com contadores de
// veículos/OS pra dar uma visão geral rápida na listagem.
export interface ClienteComContadores extends Cliente {
  totalVeiculos: number;
  totalOrdensServico: number;
}

export function listarClientesGestao(busca: string) {
  return api<ClienteComContadores[]>(`/clientes/gestao?busca=${encodeURIComponent(busca)}`);
}

export interface VeiculoResumoCliente {
  id: string;
  placa: string;
  modelo: string;
  marca?: string | null;
  ano?: number | null;
  motor?: string | null;
}

export interface HistoricoOSCliente {
  id: string;
  status: StatusOrdemServico;
  createdAt: string;
  finalizadoEm: string | null;
  placa: string;
}

export interface ClienteFicha extends Cliente {
  veiculos: VeiculoResumoCliente[];
  historico: HistoricoOSCliente[];
}

export function buscarClientePorId(id: string) {
  return api<ClienteFicha>(`/clientes/${id}`);
}

export function listarVeiculosDoCliente(clienteId: string) {
  return api<Veiculo[]>(`/clientes/${clienteId}/veiculos`);
}

export interface AtualizarClienteDados {
  nome: string;
  tipoPessoa?: TipoPessoa;
  cpfCnpj?: string;
  telefone?: string;
  enderecoRua?: string;
  enderecoNumero?: string;
  enderecoBairro?: string;
  enderecoCidade?: string;
  enderecoEstado?: string;
}

export function atualizarCliente(id: string, dados: AtualizarClienteDados) {
  return api<Cliente>(`/clientes/${id}`, { method: 'PATCH', body: dados });
}

export function buscarVeiculoPorPlaca(placa: string) {
  // Não existe rota dedicada "por placa" ainda - listamos e filtramos no
  // front por enquanto (volume baixo de veículos no início do projeto).
  return api<Veiculo[]>('/veiculos').then((veiculos) =>
    veiculos.find((v) => v.placa.toUpperCase() === placa.toUpperCase()),
  );
}
