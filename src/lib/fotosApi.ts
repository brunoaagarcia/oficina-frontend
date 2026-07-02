import { api, ApiError } from './api';
import type { Foto, TipoMidia } from './types';

const MAX_DIMENSAO = 1600;
const QUALIDADE_JPEG = 0.82;
const MAX_DURACAO_VIDEO_S = 16;

export function solicitarUrlUpload(osId: string, contentType: string) {
  return api<{ uploadUrl: string; key: string; publicUrl: string }>(
    `/ordens-servico/${osId}/fotos/upload-url`,
    { method: 'POST', body: { contentType } },
  );
}

// Reduz resolução e comprime imagem no navegador antes de enviar pro R2
export async function comprimirImagem(arquivo: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(arquivo);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIMENSAO || height > MAX_DIMENSAO) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSAO) / width);
          width = MAX_DIMENSAO;
        } else {
          width = Math.round((width * MAX_DIMENSAO) / height);
          height = MAX_DIMENSAO;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Falha ao comprimir imagem.')); return; }
          resolve(new File([blob], arquivo.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        },
        'image/jpeg',
        QUALIDADE_JPEG,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível ler a imagem.')); };
    img.src = url;
  });
}

// Valida duração do vídeo antes de enviar
export function validarDuracaoVideo(arquivo: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(arquivo);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (video.duration > MAX_DURACAO_VIDEO_S) {
        reject(new Error(`O vídeo deve ter no máximo 15 segundos (esse tem ${Math.round(video.duration)}s).`));
      } else {
        resolve();
      }
    };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível ler o vídeo.')); };
    video.src = url;
  });
}

// Upload direto para o R2 usando a URL assinada - não passa pelo nosso backend
export async function uploadParaR2(uploadUrl: string, arquivo: File): Promise<void> {
  const resposta = await fetch(uploadUrl, {
    method: 'PUT',
    body: arquivo,
    headers: { 'Content-Type': arquivo.type },
  });
  if (!resposta.ok) throw new ApiError('Falha ao enviar a mídia para o armazenamento.', resposta.status);
}

export function registrarFoto(osId: string, key: string, tipo: TipoMidia, descricao?: string) {
  return api<Foto>(`/ordens-servico/${osId}/fotos`, {
    method: 'POST',
    body: { key, tipo, descricao },
  });
}

export function deletarFoto(osId: string, fotoId: string) {
  return api<void>(`/ordens-servico/${osId}/fotos/${fotoId}`, { method: 'DELETE' });
}
