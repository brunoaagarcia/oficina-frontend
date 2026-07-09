export type PapelUsuario = 'MECANICO' | 'MODERADOR';

export type StatusOrdemServico = 'ORCAMENTO' | 'EM_ANDAMENTO' | 'FINALIZADO' | 'REJEITADO';

export type TipoPessoa = 'FISICA' | 'JURIDICA';

export type TipoMidia = 'FOTO' | 'VIDEO';

export type CategoriaFoto = 'ENTRADA' | 'SERVICO';

export interface Usuario {
  id: string;
  nome: string;
  login: string;
  papel: PapelUsuario;
  ativo?: boolean;
  senhaProvisoria?: boolean;
}

export interface Cliente {
  id: string;
  nome: string;
  tipoPessoa: TipoPessoa;
  cpfCnpj: string;
  telefone: string;
  enderecoRua?: string | null;
  enderecoNumero?: string | null;
  enderecoBairro?: string | null;
  enderecoCidade?: string | null;
  enderecoEstado?: string | null;
  enderecoCep?: string | null;
}

export interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  marca?: string | null;
  ano?: number | null;
  kmAtual?: number | null;
  cliente: Cliente;
}

export interface Foto {
  id: string;
  key: string;
  url: string;
  tipo: TipoMidia;
  categoria: CategoriaFoto;
  descricao?: string | null;
  createdAt: string;
}

// Anotação acrescentada à OS ao longo do tempo - histórico append-only,
// nunca editado/apagado depois de criado.
export interface Observacao {
  id: string;
  texto: string;
  autor: { id: string; nome: string };
  createdAt: string;
}

export type TipoValorMaoDeObra = 'HORAS' | 'FECHADO';

// Valores monetários vêm em CENTAVOS do backend (Int) - formata na tela com formatarCentavos().
// Vêm como null quando o backend esconde o preço de quem não é moderador.
export interface ItemMaoDeObra {
  id: string;
  descricao: string;
  tipoValor: TipoValorMaoDeObra;
  horas?: number | null;
  valorHoraCentavos?: number | null;
  valorTotalCentavos: number | null;
  criadoPor: { id: string; nome: string };
  createdAt: string;
}

export interface OrdemServico {
  id: string;
  veiculoId: string;
  veiculo: Veiculo;
  status: StatusOrdemServico;
  kmRegistrado?: number | null;
  queixaInicial?: string | null;
  criadoPorId: string;
  criadoPor: { id: string; nome: string; login: string };
  createdAt: string;
  updatedAt: string;
  finalizadoEm?: string | null;
  fotos: Foto[];
  observacoes: Observacao[];
  itensMaoDeObra: ItemMaoDeObra[];
  totalFotosEntrada?: number;
}

// Dados pra abrir uma OS - tudo do cliente/carro é opcional porque só
// é exigido de verdade se a placa ainda não existir no sistema.
export interface AbrirOrdemServicoPayload {
  placa: string;
  modelo?: string;
  marca?: string;
  ano?: number;
  kmRegistrado?: number;
  queixaInicial?: string;
  cpfCnpjCliente?: string;
  nomeCliente?: string;
  tipoPessoaCliente?: TipoPessoa;
  telefoneCliente?: string;
  enderecoRuaCliente?: string;
  enderecoNumeroCliente?: string;
  enderecoBairroCliente?: string;
  enderecoCidadeCliente?: string;
  enderecoEstadoCliente?: string;
}