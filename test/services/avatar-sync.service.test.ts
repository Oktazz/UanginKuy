import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
}));

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: mocks.upload,
        getPublicUrl: mocks.getPublicUrl,
      })),
    },
    from: vi.fn(() => ({
      update: mocks.update,
    })),
  })),
}));

import { syncGoogleAvatarToStorage } from "@/services/avatar-sync.service";

describe("syncGoogleAvatarToStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockResolvedValue({ error: null });
    mocks.getPublicUrl.mockReturnValue({
      data: { publicUrl: "https://supabase.co/storage/avatars/user-1/google.jpg" },
    });
  });

  it("returns null when googleAvatarUrl is missing", async () => {
    const result = await syncGoogleAvatarToStorage("user-1", null);
    expect(result).toBeNull();
  });

  it("downloads Google avatar and uploads to Supabase storage", async () => {
    const mockImageBytes = new Uint8Array([137, 80, 78, 71]);
    const mockResponse = new Response(mockImageBytes, {
      headers: { "content-type": "image/png" },
    });
    vi.spyOn(global, "fetch").mockResolvedValueOnce(mockResponse);
    mocks.upload.mockResolvedValueOnce({ error: null });

    const result = await syncGoogleAvatarToStorage(
      "user-1",
      "https://lh3.googleusercontent.com/photo.png",
    );

    expect(result).toBe("https://supabase.co/storage/avatars/user-1/google.jpg");
    expect(mocks.upload).toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        avatar_url: "https://supabase.co/storage/avatars/user-1/google.jpg",
      }),
    );
  });

  it("falls back to Google URL if storage upload fails", async () => {
    const mockImageBytes = new Uint8Array([255, 216, 255]);
    const mockResponse = new Response(mockImageBytes, {
      headers: { "content-type": "image/jpeg" },
    });
    vi.spyOn(global, "fetch").mockResolvedValueOnce(mockResponse);
    mocks.upload.mockResolvedValueOnce({ error: new Error("storage quota exceeded") });

    const result = await syncGoogleAvatarToStorage(
      "user-1",
      "https://lh3.googleusercontent.com/photo.jpg",
    );

    expect(result).toBe("https://lh3.googleusercontent.com/photo.jpg");
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        avatar_url: "https://lh3.googleusercontent.com/photo.jpg",
      }),
    );
  });
});
