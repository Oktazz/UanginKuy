import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  updateUser: vi.fn(),
  profileSingle: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: vi.fn(), set: vi.fn() })),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
      updateUser: mocks.updateUser,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: mocks.profileSingle })),
      })),
    })),
  })),
}));

import {
  getTranslatedPasswordError,
  setInvitedUserPassword,
} from "@/app/(auth)/set-password/actions";

describe("getTranslatedPasswordError", () => {
  it("translates same_password code to Indonesian", async () => {
    const error = { message: "New password should be different from the old password.", code: "same_password" };
    expect(await getTranslatedPasswordError(error)).toBe(
      "Kata sandi baru harus berbeda dengan kata sandi lama."
    );
  });

  it("translates English same password message when code is not provided", async () => {
    const error = { message: "New password should be different from the old password." };
    expect(await getTranslatedPasswordError(error)).toBe(
      "Kata sandi baru harus berbeda dengan kata sandi lama."
    );
  });

  it("translates short password message", async () => {
    const error = { message: "Password should be at least 6 characters" };
    expect(await getTranslatedPasswordError(error)).toBe(
      "Kata sandi minimal 8 karakter."
    );
  });

  it("translates expired session message", async () => {
    const error = { message: "Auth session missing!" };
    expect(await getTranslatedPasswordError(error)).toBe(
      "Sesi pemulihan telah kedaluwarsa. Silakan minta tautan baru."
    );
  });

  it("preserves unmapped error messages as fallback", async () => {
    const error = { message: "Network connection lost." };
    expect(await getTranslatedPasswordError(error)).toBe("Network connection lost.");
  });
});

describe("setInvitedUserPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mocks.updateUser.mockResolvedValue({ error: null });
    mocks.profileSingle.mockResolvedValue({ data: { role: "nasabah" } });
  });

  it("redirects with validation error if password is less than 8 characters", async () => {
    const formData = new FormData();
    formData.set("password", "12345");
    formData.set("confirmation", "12345");

    await expect(setInvitedUserPassword(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/set-password?error=Password%20minimal%208%20karakter."
    );
  });

  it("redirects with validation error if passwords do not match", async () => {
    const formData = new FormData();
    formData.set("password", "password123");
    formData.set("confirmation", "password456");

    await expect(setInvitedUserPassword(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/set-password?error=Konfirmasi%20password%20tidak%20sama."
    );
  });

  it("redirects to login if user is not authenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const formData = new FormData();
    formData.set("password", "password123");
    formData.set("confirmation", "password123");

    await expect(setInvitedUserPassword(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/login"
    );
  });

  it("redirects with translated Indonesian error if new password is same as old password", async () => {
    mocks.updateUser.mockResolvedValue({
      error: {
        message: "New password should be different from the old password.",
        code: "same_password",
      },
    });

    const formData = new FormData();
    formData.set("password", "password123");
    formData.set("confirmation", "password123");

    await expect(setInvitedUserPassword(formData)).rejects.toThrow(
      `NEXT_REDIRECT:/set-password?error=${encodeURIComponent(
        "Kata sandi baru harus berbeda dengan kata sandi lama."
      )}`
    );
  });

  it("redirects to dashboard for nasabah role on success", async () => {
    const formData = new FormData();
    formData.set("password", "newpassword123");
    formData.set("confirmation", "newpassword123");

    await expect(setInvitedUserPassword(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard"
    );
  });

  it("redirects to admin dashboard for admin role on success", async () => {
    mocks.profileSingle.mockResolvedValue({ data: { role: "admin" } });

    const formData = new FormData();
    formData.set("password", "newpassword123");
    formData.set("confirmation", "newpassword123");

    await expect(setInvitedUserPassword(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/dashboard"
    );
  });

  it("redirects to kurir dashboard for kurir role on success", async () => {
    mocks.profileSingle.mockResolvedValue({ data: { role: "kurir" } });

    const formData = new FormData();
    formData.set("password", "newpassword123");
    formData.set("confirmation", "newpassword123");

    await expect(setInvitedUserPassword(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/kurir/dashboard"
    );
  });
});
