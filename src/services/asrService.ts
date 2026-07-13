import { api } from 'src/services/api-client';

export interface AsrTranscribeResponse {
  transcript: string;
  provider: string;
  model: string;
  languageCode: string;
  latencyMs: number;
  audioDurationMs?: number;
  requestId?: string;
}

export async function transcribeAudio(
  file: Blob,
  languageCode?: string,
): Promise<AsrTranscribeResponse> {
  const formData = new FormData();
  const ext = file.type.includes('webm') ? 'webm' : file.type.includes('ogg') ? 'ogg' : 'wav';
  formData.append('file', file, `voice-command.${ext}`);
  if (languageCode) formData.append('languageCode', languageCode);

  const response = await api.post('/api/v1/asr/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data.data;
}
