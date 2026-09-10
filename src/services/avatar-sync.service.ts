import { createAdminClient } from "@/utils/supabase/admin";

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
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const extension = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";

    const filePath = `avatars/${userId}/google-${Date.now()}.${extension}`;
    const admin = createAdminClient();

    const { error: uploadError } = await admin.storage
      .from("public-assets")
      .upload(filePath, buffer, {
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
