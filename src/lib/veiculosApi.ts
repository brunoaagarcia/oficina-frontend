import { api } from './api';
import type { Veiculo } from './types';

export function buscarVeiculoPorPlaca(placa: string) {
  return api<{ veiculo: Veiculo | null }>(`/veiculos/por-placa/${encodeURIComponent(placa)}`);
}

export function buscarVeiculosPorTermo(termo: string) {
  return api<{ veiculos: Veiculo[] }>(`/veiculos/buscar?placa=${encodeURIComponent(termo)}`);
}
