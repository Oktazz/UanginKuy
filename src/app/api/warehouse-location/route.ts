import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { successResponse, errorResponse } from "@/utils/api-response";
import { handleApiError } from "@/utils/error-handler";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const admin = createAdminClient();
    const { data: settings, error } = await admin
      .from("app_settings")
      .select("key, value")
      .in("key", ["warehouse_location", "warehouse_operating_hours"]);

    if (error) {
      console.error("Failed to fetch warehouse settings:", error);
      return errorResponse("Gagal mengambil data pengaturan bank sampah", 500);
    }

    const locSetting = settings?.find((s) => s.key === "warehouse_location")?.value as
      | Record<string, unknown>
      | undefined;
    const hoursSetting = settings?.find((s) => s.key === "warehouse_operating_hours")?.value as
      | Record<string, unknown>
      | undefined;

    // Default configuration
    const defaultLocation = {
      latitude: -6.2088,
      longitude: 106.8456,
      address: "Gudang Utama UanginKuy, Kawasan Daur Ulang Mandiri",
      name: "Gudang & Depo Utama UanginKuy",
      operatingHours: "08.00 - 16.00 WIB",
      operatingDays: "Senin - Sabtu",
      notes: "Istirahat loket: 12.00 - 13.00 WIB",
      isOpen: true,
      isDefault: true,
    };

    let operatingHours = defaultLocation.operatingHours;
    let operatingDays = defaultLocation.operatingDays;
    let notes = defaultLocation.notes;
    let isOpen = defaultLocation.isOpen;

    if (hoursSetting) {
      const open = typeof hoursSetting.openTime === "string" ? hoursSetting.openTime.replace(":", ".") : "08.00";
      const close = typeof hoursSetting.closeTime === "string" ? hoursSetting.closeTime.replace(":", ".") : "16.00";
      operatingHours = `${open} - ${close} WIB`;

      if (typeof hoursSetting.daysLabel === "string" && hoursSetting.daysLabel.trim()) {
        operatingDays = hoursSetting.daysLabel;
      }
      if (typeof hoursSetting.notes === "string") {
        notes = hoursSetting.notes;
      }
      if (typeof hoursSetting.isActive === "boolean") {
        isOpen = hoursSetting.isActive;
      }
    }

    const rawLat = Number(locSetting?.latitude);
    const rawLon = Number(locSetting?.longitude);
    const hasValidCoords =
      locSetting &&
      Number.isFinite(rawLat) &&
      Number.isFinite(rawLon) &&
      rawLat !== 0 &&
      rawLon !== 0;

    if (hasValidCoords) {
      return successResponse({
        latitude: rawLat,
        longitude: rawLon,
        address:
          typeof locSetting?.address === "string" && locSetting.address.trim()
            ? locSetting.address
            : defaultLocation.address,
        name:
          typeof locSetting?.name === "string" && locSetting.name.trim()
            ? locSetting.name
            : defaultLocation.name,
        phone: typeof locSetting?.phone === "string" ? locSetting.phone : undefined,
        operatingHours,
        operatingDays,
        notes,
        isOpen,
        isDefault: false,
      });
    }

    return successResponse({
      ...defaultLocation,
      operatingHours,
      operatingDays,
      notes,
      isOpen,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
