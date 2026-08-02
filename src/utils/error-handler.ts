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

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof z.ZodError) {
    return errorResponse(
      'Validation Error',
      400,
      error.issues,
      'Invalid input data provided.'
    );
  }

  if (error instanceof ApiError) {
    return errorResponse(error.message, error.statusCode);
  }

  if (error instanceof Error) {
    return errorResponse(
      error.message || 'Internal Server Error',
      500
    );
  }

  return errorResponse('An unexpected error occurred', 500);
}
