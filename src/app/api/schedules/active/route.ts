import { getActiveSchedules } from '@/services/schedule.service';
import { successResponse } from '@/utils/api-response';
import { handleApiError } from '@/utils/error-handler';

export async function GET() {
  try {
    const schedules = await getActiveSchedules();
    return successResponse(schedules, 'Jadwal aktif berhasil dimuat');
  } catch (error) {
    return handleApiError(error);
  }
}
