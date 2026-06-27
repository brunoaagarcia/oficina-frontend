import { api } from './api';
import type { Cliente, Veiculo } from './types';

export function buscarClientes(termo: string) {
  return api<Cliente[]>(`/clientes?busca=${encodeURIComponent(termo)}`);
}

export function listarVeiculosDoCliente(clienteId: string) {
  return api<Veiculo[]>(`/clientes/${clienteId}/veiculos`);
}

export function buscarVeiculoPorPlaca(placa: string) {
  // Não existe rota dedicada "por placa" ainda - listamos e filtramos no
  // front por enquanto (volume baixo de veículos no início do projeto).
  return api<Veiculo[]>('/veiculos').then((veiculos) =>
    veiculos.find((v) => v.placa.toUpperCase() === placa.toUpperCase()),
  );
}
