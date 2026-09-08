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
    return errorResponse(
      'Validation Error',
      400,
      error.issues,
      'Invalid input data provided.'
    );
  }

  if (error instanceof ApiError) {
    return errorResponse('Something went wrong', error.statusCode);
  }

  if (statusCode) {
    return errorResponse('Something went wrong', statusCode);
  }

  return errorResponse('Something went wrong', 500);
}
