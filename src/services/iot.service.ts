import { createAdminClient } from '@/utils/supabase/admin';
import { IotSyncPayload } from '@/validations/iot.schema';
import { ApiError } from '@/utils/error-handler';
import { redis } from '@/lib/redis';
import {
  iotDeviceRegistrationKey,
  iotLiveKey,
  type IotLiveSample,
} from '@/lib/iot-live';

const LIVE_SAMPLE_TTL_SECONDS = 120;

async function ensureRegisteredDevice(deviceId: string, allowCache: boolean) {
  if (allowCache) {
    try {
      const cached = await redis.get<boolean>(iotDeviceRegistrationKey(deviceId));
      if (cached === true) return;
    } catch (error) {
      console.error('Failed to read IoT registration cache:', error);
    }
  }

  const supabase = createAdminClient();
  const { data: device, error: deviceError } = await supabase
    .from('iot_devices')
    .select('id')
    .eq('id', deviceId)
    .maybeSingle();

  if (deviceError || !device) {
    throw new ApiError('Device not found or not registered.', 404);
  }

  if (allowCache) {
    try {
      await redis.setex(
        iotDeviceRegistrationKey(deviceId),
        LIVE_SAMPLE_TTL_SECONDS,
        true,
      );
    } catch (error) {
      console.error('Failed to write IoT registration cache:', error);
    }
  }
}

export async function syncIotWeight(payload: IotSyncPayload) {
  const measuredAt = new Date().toISOString();
  const liveSample: IotLiveSample = {
    weight: payload.weight,
    measuredAt,
    stable: payload.stable,
  };

  if (!payload.stable) {
    await ensureRegisteredDevice(payload.id_timbangan, true);
    await redis.setex(
      iotLiveKey(payload.id_timbangan),
      LIVE_SAMPLE_TTL_SECONDS,
      liveSample,
    );

    return {
      success: true,
      preview: true,
      deviceId: payload.id_timbangan,
      weight: payload.weight,
      measuredAt,
    };
  }

  await ensureRegisteredDevice(payload.id_timbangan, false);
  // Use admin client because the ESP8266 does not have a user session (RLS bypass needed)
  const supabase = createAdminClient();
  const { error: updateError } = await supabase
    .from('iot_devices')
    .update({
      is_online: true,
      last_ping: measuredAt,
      last_weight: payload.weight,
      last_measurement_at: measuredAt,
    })
    .eq('id', payload.id_timbangan);

  if (updateError) {
    throw new Error(`Failed to persist IoT measurement: ${updateError.message}`);
  }

  try {
    await redis.setex(
      iotLiveKey(payload.id_timbangan),
      LIVE_SAMPLE_TTL_SECONDS,
      liveSample,
    );
  } catch (error) {
    console.error('Failed to cache final IoT measurement:', error);
  }

  // Keep the existing broadcast for clients that want live updates. The courier
  // flow uses the persisted reading so measurements are not lost when its page
  // was closed at the time of weighing.
  const channel = supabase.channel(`iot_sync_${payload.id_timbangan}`);
  const broadcastStatus = await channel.send({
    type: 'broadcast',
    event: 'weight_update',
    payload: { weight: payload.weight, timestamp: measuredAt },
  });
  await supabase.removeChannel(channel);

  return {
    success: true,
    broadcasted: broadcastStatus === 'ok',
    deviceId: payload.id_timbangan,
    weight: payload.weight,
    measuredAt,
  };
}
