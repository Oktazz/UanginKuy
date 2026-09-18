import { NextRequest } from 'next/server';
import { getActiveSchedules } from '@/services/schedule.service';
import { successResponse } from '@/utils/api-response';
import { handleApiError } from '@/utils/error-handler';

export async function GET(_req: NextRequest) {
  try {
    const schedules = await getActiveSchedules();
    return successResponse(schedules, 'Jadwal aktif berhasil dimuat');
  } catch (error) {
    return handleApiError(error);
  }
}
