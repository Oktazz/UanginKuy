import { z } from 'zod';
import { errorResponse } from './api-response';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown, statusCode?: number) {
  console.error('API Error:', error);

  if (error instanceof z.ZodError) {
    const firstIssue = error.issues[0]?.message;
    const errorMessage =
      firstIssue && !firstIssue.toLowerCase().includes('validation error')
        ? firstIssue
        : 'Data input tidak valid.';
    return errorResponse(
      errorMessage,
      400,
      error.issues,
      'Data yang dimasukkan tidak memenuhi ketentuan validasi.'
    );
  }

  if (error instanceof ApiError) {
    return errorResponse(error.message, error.statusCode);
  }

  if (error instanceof Error && error.message) {
    const status = statusCode ?? 500;
    if (!error.message.includes('password=') && !error.message.includes('DATABASE_URL')) {
      return errorResponse(error.message, status);
    }
  }

  if (statusCode) {
    return errorResponse('Terjadi kesalahan saat memproses permintaan.', statusCode);
  }

  return errorResponse(
    'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.',
    500
  );
}

