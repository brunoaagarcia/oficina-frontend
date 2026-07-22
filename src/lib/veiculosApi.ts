import { api } from './api';
import type { Veiculo } from './types';

export function buscarVeiculoPorPlaca(placa: string) {
  return api<{ veiculo: Veiculo | null }>(`/veiculos/por-placa/${encodeURIComponent(placa)}`);
}

export function buscarVeiculosPorTermo(termo: string) {
  return api<{ veiculos: Veiculo[] }>(`/veiculos/buscar?placa=${encodeURIComponent(termo)}`);
}

export function listarModelosVeiculo(termo: string) {
  return api<{ modelos: { nome: string; total: number }[] }>(
    `/veiculos/modelos?termo=${encodeURIComponent(termo)}`,
  );
}

export function listarMarcasVeiculo(termo: string) {
  return api<{ marcas: { nome: string; total: number }[] }>(
    `/veiculos/marcas?termo=${encodeURIComponent(termo)}`,
  );
}

export function listarMotoresVeiculo(termo: string) {
  return api<{ motores: { nome: string; total: number }[] }>(
    `/veiculos/motores?termo=${encodeURIComponent(termo)}`,
  );
}
