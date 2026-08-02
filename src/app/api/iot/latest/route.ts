import { cookies } from "next/headers";

import { successResponse, errorResponse } from "@/utils/api-response";
import { handleApiError } from "@/utils/error-handler";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { redis } from "@/lib/redis";
import {
  iotLiveKey,
  isIotLiveSample,
  type IotLiveSample,
} from "@/lib/iot-live";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient(await cookies());
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Sesi kurir tidak valid", 401);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "kurir") {
      return errorResponse("Akses kurir diperlukan", 403);
    }

    const admin = createAdminClient();
    const { data: device, error: deviceError } = await admin
      .from("iot_devices")
      .select("id, last_weight, last_measurement_at")
      .eq("assigned_courier_id", user.id)
      .maybeSingle();

    if (deviceError) throw deviceError;
    if (!device) {
      return errorResponse("Belum ada timbangan IoT yang ditugaskan", 404);
    }

    let liveSample: IotLiveSample | null = null;
    try {
      const cached = await redis.get<unknown>(iotLiveKey(device.id));
      if (isIotLiveSample(cached)) liveSample = cached;
    } catch (error) {
      console.error("Failed to read live IoT measurement:", error);
    }

    return successResponse({
      deviceId: device.id,
      weight: device.last_weight,
      measuredAt: device.last_measurement_at,
      liveWeight: liveSample?.weight ?? null,
      liveMeasuredAt: liveSample?.measuredAt ?? null,
      liveStable: liveSample?.stable ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
