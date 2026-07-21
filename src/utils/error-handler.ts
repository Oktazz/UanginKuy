import { z } from 'zod';
import { errorResponse } from './api-response';

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof z.ZodError) {
    return errorResponse(
      'Validation Error',
      400,
      (error as any).issues || (error as any).errors,
      'Invalid input data provided.'
    );
  }

  if (error instanceof Error) {
    return errorResponse(
      error.message || 'Internal Server Error',
      500
    );
  }

  return errorResponse('An unexpected error occurred', 500);
}
