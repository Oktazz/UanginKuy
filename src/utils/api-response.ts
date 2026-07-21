import { NextResponse } from 'next/server';

type SuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

type ErrorResponse = {
  success: false;
  error: string;
  message?: string;
  details?: any;
};

export function successResponse<T>(data: T, message?: string, status = 200) {
  const body: SuccessResponse<T> = { success: true, data };
  if (message) body.message = message;
  
  return NextResponse.json(body, { status });
}

export function errorResponse(error: string, status = 400, details?: any, message?: string) {
  const body: ErrorResponse = { success: false, error };
  if (details) body.details = details;
  if (message) body.message = message;
  
  return NextResponse.json(body, { status });
}
