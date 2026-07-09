import { api } from './api';
import type { Veiculo } from './types';

export function buscarVeiculoPorPlaca(placa: string) {
  return api<{ veiculo: Veiculo | null }>(`/veiculos/por-placa/${encodeURIComponent(placa)}`);
}
