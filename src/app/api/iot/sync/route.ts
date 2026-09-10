import { NextRequest } from 'next/server';
import { IotSyncSchema } from '@/validations/iot.schema';
import { syncIotWeight } from '@/services/iot.service';
import { successResponse, errorResponse } from '@/utils/api-response';
import { handleApiError } from '@/utils/error-handler';
import { isValidIotApiKey } from '@/lib/iot-auth';
import { checkRateLimit } from '@/utils/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-iot-api-key');
    if (!isValidIotApiKey(apiKey)) {
      return errorResponse('Unauthorized IoT device', 401);
    }

    // Perangkat bisa mengirim data terus-menerus — batasi frekuensi per key
    const rateLimit = await checkRateLimit(`iot:sync:${apiKey}`, 60);
    if (!rateLimit.allowed) {
      return errorResponse('Too many requests', 429);
    }

    const body = await req.json();
    
    // Validate input
    const payload = IotSyncSchema.parse(body);
    
    // Process service logic
    const result = await syncIotWeight(payload);
    
    return successResponse(result, 'IoT data synced successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
