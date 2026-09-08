import { beforeEach, describe, expect, it, vi } from "vitest";

const { resetPasswordForEmail, createClient } = vi.hoisted(() => {
  const reset = vi.fn();
  return {
    resetPasswordForEmail: reset,
    createClient: vi.fn(async () => ({
      auth: { resetPasswordForEmail: reset },
    })),
  };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: vi.fn(), set: vi.fn() })),
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/utils/supabase/server", () => ({ createClient }));

import { requestPasswordReset } from "@/app/(auth)/forgot-password/actions";
import { initialResetPasswordState } from "@/app/(auth)/forgot-password/state";

describe("requestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPasswordForEmail.mockResolvedValue({ error: null });
    process.env.SITE_URL = "https://uanginkuy.test/";
  });

  it("rejects an invalid email before calling Supabase", async () => {
    const formData = new FormData();
    formData.set("email", "bukan-email");

    const state = await requestPasswordReset(
      initialResetPasswordState,
      formData,
    );

    expect(state.status).toBe("error");
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("requests a reset using the trusted callback URL", async () => {
    const formData = new FormData();
    formData.set("email", " USER@EXAMPLE.COM ");

    const state = await requestPasswordReset(
      initialResetPasswordState,
      formData,
    );

    expect(resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
      redirectTo: "https://uanginkuy.test/auth/confirm?next=%2Fset-password",
    });
    expect(state).toEqual({
      status: "success",
      message: "Jika email terdaftar, tautan pemulihan akan segera dikirim.",
    });
  });

  it("does not reveal whether Supabase knows the email", async () => {
    resetPasswordForEmail.mockResolvedValue({
      error: new Error("User not found"),
    });
    const formData = new FormData();
    formData.set("email", "missing@example.com");

    const state = await requestPasswordReset(
      initialResetPasswordState,
      formData,
    );

    expect(state.status).toBe("success");
    expect(state.message).not.toMatch(/not found/i);
  });

  it("fails safely when the trusted site URL is invalid", async () => {
    process.env.SITE_URL = "bukan-url";
    const formData = new FormData();
    formData.set("email", "user@example.com");

    const state = await requestPasswordReset(
      initialResetPasswordState,
      formData,
    );

    expect(state.status).toBe("error");
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("auto-detects Vercel production URL when SITE_URL is not set", async () => {
    delete process.env.SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "uangin-kuy.vercel.app";

    const formData = new FormData();
    formData.set("email", "user@example.com");

    const state = await requestPasswordReset(
      initialResetPasswordState,
      formData,
    );

    expect(resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
      redirectTo:
        "https://uangin-kuy.vercel.app/auth/confirm?next=%2Fset-password",
    });
    expect(state.status).toBe("success");

    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  });
});
