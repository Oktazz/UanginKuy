import { createAdminClient } from "@/utils/supabase/admin";
import { compressImageToWebP } from "./image.service";

export async function syncGoogleAvatarToStorage(
  userId: string,
  googleAvatarUrl?: string | null,
): Promise<string | null> {
  if (!googleAvatarUrl || typeof googleAvatarUrl !== "string") {
    return null;
  }

  try {
    const response = await fetch(googleAvatarUrl, { cache: "no-store" });
    if (!response.ok) {
      console.warn(
        `[syncGoogleAvatarToStorage] Failed to fetch avatar from Google (${response.status})`,
      );
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let webpBuffer: Buffer;
    let contentType = "image/webp";
    let extension = "webp";

    try {
      webpBuffer = await compressImageToWebP(buffer);
    } catch (compressErr) {
      console.warn(
        "[syncGoogleAvatarToStorage] Could not compress avatar to WebP, falling back to original:",
        compressErr,
      );
      webpBuffer = buffer;
      const originalContentType = response.headers.get("content-type") || "image/jpeg";
      contentType = originalContentType;
      extension = originalContentType.includes("png")
        ? "png"
        : originalContentType.includes("webp")
          ? "webp"
          : "jpg";
    }

    const filePath = `avatars/${userId}/google-${Date.now()}.${extension}`;
    let admin;
    try {
      admin = createAdminClient();
    } catch (adminErr) {
      console.warn(
        "[syncGoogleAvatarToStorage] Admin client unavailable (check SUPABASE_SERVICE_ROLE_KEY):",
        adminErr,
      );
      return null;
    }

    const { error: uploadError } = await admin.storage
      .from("public-assets")
      .upload(filePath, webpBuffer, {
        contentType,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error(
        "[syncGoogleAvatarToStorage] Failed to upload avatar to Supabase Storage:",
        uploadError,
      );
      // Fallback: gunakan link Google langsung jika upload storage terkendala
      await admin
        .from("profiles")
        .update({
          avatar_url: googleAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      return googleAvatarUrl;
    }

    const { data } = admin.storage
      .from("public-assets")
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;

    await admin
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    return publicUrl;
  } catch (err) {
    console.error(
      "[syncGoogleAvatarToStorage] Unexpected error syncing avatar:",
      err,
    );
    return null;
  }
}
