import { NextRequest } from 'next/server';
import { IotSyncSchema } from '@/validations/iot.schema';
import { syncIotWeight } from '@/services/iot.service';
import { successResponse } from '@/utils/api-response';
import { handleApiError } from '@/utils/error-handler';
import { errorResponse } from '@/utils/api-response';
import { isValidIotApiKey } from '@/lib/iot-auth';

export async function POST(req: NextRequest) {
  try {
    if (!isValidIotApiKey(req.headers.get('x-iot-api-key'))) {
      return errorResponse('Unauthorized IoT device', 401);
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
