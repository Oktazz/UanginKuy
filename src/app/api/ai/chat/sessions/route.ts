import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

async function invalidateUserChatCache(userId: string, sessionId?: string) {
  try {
    const { redis, isRedisConfigured } = await import("@/lib/redis");
    if (isRedisConfigured) {
      await redis.del(`chat:history:${userId}`).catch(() => {});
      if (sessionId) {
        await redis.del(`chat:history:${userId}:${sessionId}`).catch(() => {});
      }
    }
  } catch (e: unknown) {
    console.warn("[AI Chat Sessions] Failed to invalidate cache:", e);
  }
}

// ─── GET: Ambil daftar seluruh sesi percakapan user ───────────────────────────
export async function GET() {
  try {
    const supabase = await createClient(await cookies());
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Sesi tidak valid. Silakan login terlebih dahulu." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const admin = createAdminClient();
    const { data: sessions, error } = await admin
      .from("chat_sessions")
      .select("id, title, created_at, updated_at")
      .eq("profile_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return Response.json(
      { sessions: sessions ?? [] },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch {
    return new Response(JSON.stringify({ error: "Gagal memuat sesi percakapan karena gangguan server." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ─── POST: Buat sesi percakapan baru ──────────────────────────────────────────
export async function POST() {
  try {
    const supabase = await createClient(await cookies());
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Sesi tidak valid. Silakan login terlebih dahulu." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const admin = createAdminClient();
    const { data: session, error } = await admin
      .from("chat_sessions")
      .insert({ profile_id: user.id, title: "Percakapan Baru" })
      .select("id, title, created_at, updated_at")
      .single();

    if (error || !session) {
      return new Response(
        JSON.stringify({ error: error?.message ?? "Gagal membuat sesi baru." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    await invalidateUserChatCache(user.id, session.id);

    return Response.json({ session }, { status: 201 });
  } catch {
    return new Response(JSON.stringify({ error: "Gagal membuat sesi baru karena gangguan server." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ─── DELETE: Hapus sesi percakapan beserta seluruh pesannya ────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient(await cookies());
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Sesi tidak valid. Silakan login terlebih dahulu." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("id") ?? searchParams.get("sessionId");

    if (!sessionId) {
      return Response.json(
        { error: "ID sesi wajib disertakan." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Verifikasi bahwa sesi ini benar milik pengguna yang sedang login
    const { data: existing, error: findError } = await admin
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (findError || !existing) {
      return Response.json(
        { error: "Sesi percakapan tidak ditemukan atau bukan milik Anda." },
        { status: 404 },
      );
    }

    // Hapus pesan terkait terlebih dahulu (cascade safety)
    await admin.from("chat_messages").delete().eq("session_id", sessionId);

    // Hapus record sesi
    const { error: deleteError } = await admin
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId);

    if (deleteError) {
      return Response.json(
        { error: deleteError.message },
        { status: 500 },
      );
    }

    await invalidateUserChatCache(user.id, sessionId);

    return Response.json({ success: true });
  } catch {
    return new Response(JSON.stringify({ error: "Gagal menghapus sesi percakapan karena gangguan server." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
