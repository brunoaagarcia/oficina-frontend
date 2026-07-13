import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { BotaoVoltar } from '../components/BotaoVoltar';
import { Botao } from '../components/Botao';
import { useAuth } from '../lib/AuthContext';
import { ApiError } from '../lib/api';
import { listarArquivaveis, removerFotosDeOS, type FotoArquivavel, type OSArquivavel } from '../lib/ordensServicoApi';

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function nomearArquivo(f: FotoArquivavel, iServico: number, iVideo: number): string {
  if (f.tipo === 'VIDEO') return `video-${String(iVideo).padStart(2, '0')}.webm`;
  if (f.categoria === 'ENTRADA') {
    const slug = f.descricao ? slugify(f.descricao) : `entrada-${iServico}`;
    return `entrada-${slug}.jpg`;
  }
  return `servico-${String(iServico).padStart(2, '0')}.jpg`;
}

export function Backup() {
  const { usuario } = useAuth();

  const [lista, setLista] = useState<OSArquivavel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<string[]>([]);

  const [progresso, setProgresso] = useState<Record<string, { atual: number; total: number } | null>>({});
  const [baixados, setBaixados] = useState<Set<string>>(new Set());
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [placaDigitada, setPlacaDigitada] = useState('');
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  if (usuario && usuario.papel !== 'MODERADOR') return <Navigate to="/" replace />;

  useEffect(() => {
    listarArquivaveis()
      .then(setLista)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar.'))
      .finally(() => setCarregando(false));
  }, []);

  async function baixarZip(os: OSArquivavel) {
    setErro(null);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const total = os.fotos.length;
      let atual = 0;
      let iServico = 0;
      let iVideo = 0;

      setProgresso((p) => ({ ...p, [os.id]: { atual: 0, total } }));

      for (const f of os.fotos) {
        if (f.tipo === 'VIDEO') iVideo++;
        else if (f.categoria !== 'ENTRADA') iServico++;
        const nome = nomearArquivo(f, iServico, iVideo);

        const resp = await fetch(f.url);
        if (!resp.ok) throw new Error(`Erro ${resp.status} ao baixar ${nome}`);
        const blob = await resp.blob();
        zip.file(nome, blob);
        atual++;
        setProgresso((p) => ({ ...p, [os.id]: { atual, total } }));
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${os.veiculo.placa}-${os.id.slice(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBaixados((b) => new Set([...b, os.id]));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao gerar o arquivo .zip.');
    } finally {
      setProgresso((p) => ({ ...p, [os.id]: null }));
    }
  }

  async function confirmarExclusao(os: OSArquivavel) {
    setExcluindoId(os.id);
    setErro(null);
    try {
      const { removidos } = await removerFotosDeOS(os.id);
      setLista((l) => l.filter((o) => o.id !== os.id));
      setMensagens((m) => [
        ...m,
        `Fotos de ${os.veiculo.placa} excluídas (${removidos} arquivo${removidos !== 1 ? 's' : ''}).`,
      ]);
      setConfirmandoId(null);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível excluir as fotos.');
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <Topbar />

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <BotaoVoltar />
        <div className="mb-5">
          <h1 className="font-display text-xl font-bold text-ink">Backup de fotos</h1>
          <p className="text-sm text-ink-soft">OS finalizadas ou recusadas com arquivos no sistema</p>
        </div>

        {mensagens.length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            {mensagens.map((msg, i) => (
              <p key={i} className="rounded-md bg-success-bg px-3 py-2.5 text-sm text-success">
                {msg}
              </p>
            ))}
          </div>
        )}

        {erro && (
          <p className="mb-4 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{erro}</p>
        )}

        {carregando && <p className="py-10 text-center text-sm text-ink-soft">Carregando...</p>}

        {!carregando && lista.length === 0 && (
          <div className="rounded-lg border border-dashed border-line bg-surface px-6 py-12 text-center">
            <p className="text-sm text-ink-soft">Nenhuma OS com arquivos para arquivar.</p>
          </div>
        )}

        <ul className="flex flex-col gap-3">
          {lista.map((os) => {
            const prog = progresso[os.id];
            const baixando = prog !== undefined && prog !== null;
            const jaBaixado = baixados.has(os.id);
            const totalFotos = os.fotos.filter((f) => f.tipo === 'FOTO').length;
            const totalVideos = os.fotos.filter((f) => f.tipo === 'VIDEO').length;
            const esteConfirmando = confirmandoId === os.id;
            const esteExcluindo = excluindoId === os.id;

            return (
              <li key={os.id} className="rounded-lg border border-line bg-surface p-4">
                <div className="mb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold tracking-widest text-ink">{os.veiculo.placa}</span>
                      <span className="ml-2 text-sm text-ink">{os.veiculo.modelo}</span>
                    </div>
                    <span className="shrink-0 text-xs text-ink-soft">
                      {os.finalizadoEm ? new Date(os.finalizadoEm).toLocaleDateString('pt-BR') : '—'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-ink-soft">{os.veiculo.cliente.nome}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {totalFotos} foto{totalFotos !== 1 ? 's' : ''}
                    {totalVideos > 0 ? ` · ${totalVideos} vídeo${totalVideos !== 1 ? 's' : ''}` : ''}
                  </p>
                </div>

                {!esteConfirmando ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Botao
                      type="button"
                      variante="secundario"
                      onClick={() => baixarZip(os)}
                      disabled={baixando}
                    >
                      {baixando ? `${prog!.atual} de ${prog!.total}...` : jaBaixado ? 'Baixar de novo' : 'Baixar .zip'}
                    </Botao>

                    {jaBaixado ? (
                      <Botao
                        type="button"
                        variante="perigo"
                        onClick={() => {
                          setConfirmandoId(os.id);
                          setPlacaDigitada('');
                          setErro(null);
                        }}
                      >
                        Excluir fotos do sistema
                      </Botao>
                    ) : (
                      <span className="text-xs text-ink-soft">
                        Baixe o backup antes de excluir
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border border-danger/30 bg-danger-bg p-3">
                    <p className="mb-2 text-xs font-medium text-danger">
                      Digite{' '}
                      <span className="font-mono font-bold">{os.veiculo.placa}</span>{' '}
                      para confirmar a exclusão permanente:
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={placaDigitada}
                        onChange={(e) => setPlacaDigitada(e.target.value.toUpperCase())}
                        placeholder={os.veiculo.placa}
                        autoFocus
                        className="flex-1 rounded-md border border-danger/40 bg-surface px-3 py-2 font-mono text-sm text-ink focus:border-danger focus:outline-none"
                      />
                      <Botao
                        type="button"
                        variante="perigo"
                        onClick={() => confirmarExclusao(os)}
                        disabled={placaDigitada !== os.veiculo.placa || esteExcluindo}
                      >
                        {esteExcluindo ? 'Excluindo...' : 'Excluir'}
                      </Botao>
                      <Botao
                        type="button"
                        variante="secundario"
                        onClick={() => setConfirmandoId(null)}
                        disabled={esteExcluindo}
                      >
                        Cancelar
                      </Botao>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
