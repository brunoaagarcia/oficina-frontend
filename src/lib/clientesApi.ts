import { api } from './api';
import type { Cliente, TipoPessoa, Veiculo } from './types';

export function buscarClientes(termo: string) {
  return api<Cliente[]>(`/clientes?busca=${encodeURIComponent(termo)}`);
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
