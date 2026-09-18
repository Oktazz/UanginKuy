import { cookies } from "next/headers";
import { NextRequest } from "next/server";

import { successResponse, errorResponse } from "@/utils/api-response";
import { handleApiError } from "@/utils/error-handler";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { redis } from "@/lib/redis";
import { checkRateLimit } from "@/utils/rate-limit";
import {
  iotLiveKey,
  isIotLiveSample,
  type IotLiveSample,
} from "@/lib/iot-live";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient(await cookies());
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Sesi tidak valid", 401);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !profile ||
      !["kurir", "admin", "super_admin"].includes(profile.role)
    ) {
      return errorResponse("Akses tidak diizinkan", 403);
    }

    // Polling rate limit per user
    const rateLimit = await checkRateLimit(`iot:latest:${user.id}`, 60);
    if (!rateLimit.allowed) {
      return errorResponse("Terlalu banyak permintaan status timbangan. Silakan tunggu beberapa saat.", 429);
    }

    const admin = createAdminClient();
    let device: {
      id: string;
      last_weight: number | null;
      last_measurement_at: string | null;
    } | null = null;

    if (profile.role === "kurir") {
      // Kurir hanya membaca timbangan yang ditugaskan kepadanya
      const { data, error: deviceError } = await admin
        .from("iot_devices")
        .select("id, last_weight, last_measurement_at")
        .eq("assigned_courier_id", user.id)
        .maybeSingle();

      if (deviceError) throw deviceError;
      device = data;
    } else {
      // Admin / Super Admin (Loket Bank Sampah)
      const { searchParams } = new URL(req.url);
      const requestedDeviceId = searchParams.get("deviceId");

      if (requestedDeviceId) {
        const { data, error: deviceError } = await admin
          .from("iot_devices")
          .select("id, last_weight, last_measurement_at")
          .eq("id", requestedDeviceId)
          .maybeSingle();

        if (deviceError) throw deviceError;
        device = data;
      } else {
        // Prioritaskan timbangan khusus loket (yang tidak ditugaskan ke kurir / unassigned)
        const { data: loketDevice, error: loketError } = await admin
          .from("iot_devices")
          .select("id, last_weight, last_measurement_at")
          .is("assigned_courier_id", null)
          .order("last_measurement_at", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();

        if (loketError) throw loketError;

        if (loketDevice) {
          device = loketDevice;
        } else {
          // Fallback: Ambil timbangan aktif terakhir jika semua perangkat ditugaskan ke kurir
          const { data: anyDevice, error: anyError } = await admin
            .from("iot_devices")
            .select("id, last_weight, last_measurement_at")
            .order("last_measurement_at", { ascending: false, nullsFirst: false })
            .limit(1)
            .maybeSingle();

          if (anyError) throw anyError;
          device = anyDevice;
        }
      }
    }

    if (!device) {
      return errorResponse(
        profile.role === "kurir"
          ? "Belum ada timbangan IoT yang ditugaskan"
          : "Belum ada perangkat timbangan IoT yang terdaftar / aktif",
        404
      );
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
