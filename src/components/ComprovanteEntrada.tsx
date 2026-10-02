import type { OrdemServico } from '../lib/types';

/**
 * Comprovante de entrada do veículo, para imprimir ou salvar em PDF.
 *
 * Fica escondido na tela e só aparece na impressão (`hidden print:block`),
 * enquanto o resto da página some. Assim o navegador imprime só esta folha,
 * sem precisar de biblioteca de PDF: no diálogo de impressão a pessoa
 * escolhe a impressora do balcão ou "Salvar como PDF".
 *
 * As cores são declaradas na mão, claras, em vez de herdar o tema do site.
 * O site é escuro permanente - imprimir aquilo gastaria um cartucho por
 * folha e sairia ilegível.
 *
 * Leva só as fotos de entrada e o que o cliente relatou. Valores e serviços
 * ficam de fora de propósito: isso é conversa interna da oficina.
 */
export function ComprovanteEntrada({ os }: { os: OrdemServico }) {
  const fotosDeEntrada = os.fotos.filter((f) => f.categoria === 'ENTRADA' && f.tipo === 'FOTO');
  const veiculo = os.veiculo;

  const descricaoDoCarro = [veiculo?.marca, veiculo?.modelo, veiculo?.ano]
    .filter((parte) => parte != null && String(parte).trim() !== '')
    .join(' ');

  return (
    <div className="hidden bg-white p-8 font-body text-[#1a1a1a] print:block">
      <h1 className="text-2xl font-bold">Meca Mecânica</h1>
      <p className="text-sm font-semibold">Comprovante de entrada</p>

      <hr className="my-4 border-[#cccccc]" />

      <p className="font-mono text-2xl font-bold tracking-wider">{veiculo?.placa?.toUpperCase()}</p>

      <div className="mt-2 space-y-0.5 text-sm">
        {descricaoDoCarro && (
          <p>
            {descricaoDoCarro}
            {veiculo?.motor ? ` · Motor ${veiculo.motor}` : ''}
          </p>
        )}
        <p>Cliente: {veiculo?.cliente?.nome ?? 'não informado'}</p>
        <p>Entrada em {new Date(os.createdAt).toLocaleDateString('pt-BR')}</p>
        {os.kmRegistrado != null && <p>Quilometragem: {os.kmRegistrado} km</p>}
      </div>

      {os.queixaInicial && (
        <div className="mt-5">
          <h2 className="text-sm font-bold">O que foi relatado</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm">{os.queixaInicial}</p>
        </div>
      )}

      {fotosDeEntrada.length > 0 && (
        <div className="mt-5">
          <h2 className="text-sm font-bold">Como o carro chegou</h2>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {fotosDeEntrada.map((foto) => (
              <figure key={foto.id} className="break-inside-avoid">
                <img
                  src={foto.url}
                  alt={foto.descricao ?? 'Foto de entrada'}
                  className="h-44 w-full object-contain"
                />
                {foto.descricao && (
                  <figcaption className="mt-1 text-xs text-[#555555]">{foto.descricao}</figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
