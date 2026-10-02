import type { ItemOrcamento, OrdemServico } from './types';

/**
 * Monta a mensagem de cotação de peças para mandar aos vendedores.
 *
 * Marca, modelo, ano e motorização vêm antes das peças porque é o que o
 * vendedor pergunta de volta quando falta - peça de motor 1.0 não serve no
 * 1.6. Sem valores: quem está pedindo preço é a oficina.
 *
 * Mesmo formato usado no app Android, de propósito: o vendedor recebe a
 * mensagem igual, venha ela do balcão ou do celular.
 */
export function montarMensagemDePecas(os: OrdemServico, pecas: ItemOrcamento[]): string {
  const veiculo = os.veiculo;
  const carro = [veiculo?.marca, veiculo?.modelo, veiculo?.ano]
    .filter((parte) => parte != null && String(parte).trim() !== '')
    .join(' ');

  const linhas = ['*Orçamento de peças*'];
  linhas.push(carro || 'Veículo não informado');
  if (veiculo?.motor) linhas.push(`Motor ${veiculo.motor}`);
  linhas.push(`Placa ${veiculo?.placa?.toUpperCase() ?? '—'}`);
  linhas.push('');

  for (const peca of pecas) {
    linhas.push(`• ${peca.quantidade} ${peca.unidade} - ${peca.descricao}`);
  }

  return linhas.join('\n');
}

/**
 * Abre o WhatsApp com a mensagem pronta.
 *
 * Sem número de destino de propósito: a tela do WhatsApp deixa escolher
 * vários contatos de uma vez, que é exatamente o caso de pedir cotação para
 * quatro vendedores. Um cadastro de fornecedor aqui seria uma lista a manter
 * em paralelo à agenda que ela já tem.
 */
export function abrirWhatsAppCom(texto: string): void {
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
}
