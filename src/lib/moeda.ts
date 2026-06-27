export function formatarCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Converte um texto digitado (ex: "150,50" ou "150.50") pra centavos (15050).
// Retorna null se não for um número válido.
export function paraCentavos(texto: string): number | null {
  const normalizado = texto.replace(',', '.').trim();
  const valor = Number(normalizado);
  if (Number.isNaN(valor) || valor <= 0) return null;
  return Math.round(valor * 100);
}