import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { Campo } from '../components/Campo';
import { Botao } from '../components/Botao';
import { StatusTag } from '../components/StatusTag';
import { useAuth } from '../lib/AuthContext';
import { ApiError } from '../lib/api';
import { criarUsuario, desativarUsuario, listarUsuarios } from '../lib/usuariosApi';
import { listarOrdensServico } from '../lib/ordensServicoApi';
import type { OrdemServico, PapelUsuario, Usuario } from '../lib/types';

export function Usuarios() {
  const { usuario: usuarioLogado } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nome, setNome] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [papel, setPapel] = useState<PapelUsuario>('MECANICO');
  const [salvando, setSalvando] = useState(false);

  // Usuário selecionado pra ver as OS que ele abriu
  const [selecionado, setSelecionado] = useState<Usuario | null>(null);
  const [ordensDoUsuario, setOrdensDoUsuario] = useState<OrdemServico[]>([]);
  const [carregandoOrdens, setCarregandoOrdens] = useState(false);

  const [removendoId, setRemovendoId] = useState<string | null>(null);

  function carregar() {
    setCarregando(true);
    setErro(null);
    listarUsuarios()
      .then(setUsuarios)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar os usuários.'))
      .finally(() => setCarregando(false));
  }

  useEffect(carregar, []);

  // Só a moderadora acessa essa tela - mesma regra do backend, refletida aqui
  if (usuarioLogado && usuarioLogado.papel !== 'MODERADOR') {
    return <Navigate to="/" replace />;
  }

  async function aoCriar(evento: FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      await criarUsuario({ nome, login, senha, papel });
      setNome('');
      setLogin('');
      setSenha('');
      setPapel('MECANICO');
      setMostrarForm(false);
      carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível criar o usuário.');
    } finally {
      setSalvando(false);
    }
  }

  function verOrdens(usuario: Usuario) {
    setSelecionado(usuario);
    setCarregandoOrdens(true);
    listarOrdensServico({ criadoPorId: usuario.id })
      .then(setOrdensDoUsuario)
      .catch(() => setOrdensDoUsuario([]))
      .finally(() => setCarregandoOrdens(false));
  }

  async function aoRemover(u: Usuario) {
    const confirmado = window.confirm(
      `Remover o acesso de ${u.nome}? Ele(a) não vai mais conseguir entrar no sistema, mas as OS que já abriu continuam no histórico.`,
    );
    if (!confirmado) return;

    setRemovendoId(u.id);
    setErro(null);
    try {
      await desativarUsuario(u.id);
      carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível remover esse usuário.');
    } finally {
      setRemovendoId(null);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <Topbar />

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-ink">Usuários</h1>
          <Botao type="button" onClick={() => setMostrarForm((v) => !v)}>
            {mostrarForm ? 'Cancelar' : '+ Novo login'}
          </Botao>
        </div>

        {mostrarForm && (
          <form onSubmit={aoCriar} className="mb-5 flex flex-col gap-3 rounded-lg border border-line bg-white p-4">
            <Campo rotulo="Nome" id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo="Login" id="login" value={login} onChange={(e) => setLogin(e.target.value)} required />
              <Campo
                rotulo="Senha provisória"
                id="senha"
                type="text"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="mín. 6 caracteres"
                required
              />
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-soft">Papel</span>
              <select
                value={papel}
                onChange={(e) => setPapel(e.target.value as PapelUsuario)}
                className="rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-accent"
              >
                <option value="MECANICO">Mecânico</option>
                <option value="MODERADOR">Moderador</option>
              </select>
            </label>
            <Botao type="submit" disabled={salvando}>
              {salvando ? 'Criando...' : 'Criar login'}
            </Botao>
          </form>
        )}

        {erro && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

        {carregando && <p className="py-6 text-center text-sm text-ink-soft">Carregando...</p>}

        <ul className="flex flex-col gap-2">
          {usuarios.map((u) => (
            <li key={u.id}>
              <div
                className={`flex items-center justify-between gap-2 rounded-lg border bg-white px-4 py-3 transition-colors ${
                  selecionado?.id === u.id ? 'border-accent' : 'border-line'
                } ${u.ativo === false ? 'opacity-60' : ''}`}
              >
                <button onClick={() => verOrdens(u)} className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-medium text-ink">{u.nome}</p>
                  <p className="text-xs text-ink-soft">@{u.login}</p>
                </button>

                <span className="rounded-full bg-bg px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                  {u.papel === 'MODERADOR' ? 'Moderador' : 'Mecânico'}
                </span>

                {u.ativo === false ? (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700">
                    Removido
                  </span>
                ) : u.id !== usuarioLogado?.id ? (
                  <button
                    onClick={() => aoRemover(u)}
                    disabled={removendoId === u.id}
                    className="text-xs font-medium text-ink-soft underline hover:text-red-700"
                  >
                    {removendoId === u.id ? 'Removendo...' : 'Remover'}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        {selecionado && (
          <div className="mt-6">
            <h2 className="mb-3 text-sm font-semibold text-ink">
              Ordens de Serviço abertas por {selecionado.nome}
            </h2>

            {carregandoOrdens && <p className="text-sm text-ink-soft">Carregando...</p>}

            {!carregandoOrdens && ordensDoUsuario.length === 0 && (
              <p className="text-sm text-ink-soft">Esse usuário ainda não abriu nenhuma OS.</p>
            )}

            <ul className="flex flex-col gap-2">
              {ordensDoUsuario.map((os) => (
                <li key={os.id}>
                  <Link
                    to={`/os/${os.id}`}
                    className="flex items-center justify-between rounded-lg border border-line bg-white px-4 py-3 hover:border-ink/40"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{os.veiculo.cliente.nome}</p>
                      <p className="font-mono text-xs text-ink-soft">{os.veiculo.placa}</p>
                    </div>
                    <StatusTag status={os.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}