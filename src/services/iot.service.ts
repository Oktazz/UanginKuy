import { createAdminClient } from '@/utils/supabase/admin';
import { IotSyncPayload } from '@/validations/iot.schema';

export async function syncIotWeight(payload: IotSyncPayload) {
  // Use admin client because the ESP8266 does not have a user session (RLS bypass needed)
  const supabase = createAdminClient();

  // Validate that the device exists
  const { data: device, error: deviceError } = await supabase
    .from('iot_devices')
    .select('*')
    .eq('id', payload.id_timbangan)
    .single();

  if (deviceError || !device) {
    throw new Error('Device not found or not registered.');
  }

  // Here you can either:
  // 1. Update the device's last known weight in the DB
  // 2. Broadcast the weight using Supabase Realtime so the Courier app receives it instantly
  
  // For this step, we will broadcast it via Realtime channel
  const channel = supabase.channel(`iot_sync_${payload.id_timbangan}`);
  await channel.send({
    type: 'broadcast',
    event: 'weight_update',
    payload: { weight: payload.weight, timestamp: new Date().toISOString() },
  });

  // Also update last_ping status
  await supabase
    .from('iot_devices')
    .update({ 
      is_online: true, 
      last_ping: new Date().toISOString() 
    })
    .eq('id', payload.id_timbangan);

  return { success: true, broadcasted: true, deviceId: payload.id_timbangan };
}
