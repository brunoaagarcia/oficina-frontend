const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const CHAVE_TOKEN = 'oficina:token';

export function obterToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN);
}

export function salvarToken(token: string) {
  localStorage.setItem(CHAVE_TOKEN, token);
}

export function limparToken() {
  localStorage.removeItem(CHAVE_TOKEN);
}

// Erro customizado pra diferenciar "erro de negócio" (mensagem da nossa
// API, ex: "Essa OS já foi finalizada") de erro de rede/conexão.
export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

interface Opcoes {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
}

export async function api<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const token = obterToken();

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE_URL}${caminho}`, {
      method: opcoes.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua internet.', 0);
  }

  // Sessão expirada ou inválida - limpa o token guardado.
  if (resposta.status === 401) {
    limparToken();
  }

  if (!resposta.ok) {
    let mensagem = 'Algo deu errado. Tente novamente.';
    try {
      const corpo = await resposta.json();
      if (Array.isArray(corpo.message)) {
        mensagem = corpo.message.join(', ');
      } else if (typeof corpo.message === 'string') {
        mensagem = corpo.message;
      }
    } catch {
      // resposta sem corpo JSON - mantém a mensagem padrão
    }
    throw new ApiError(mensagem, resposta.status);
  }

  if (resposta.status === 204) {
    return undefined as T;
  }

  return resposta.json() as Promise<T>;
}
