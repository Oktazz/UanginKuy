import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  headers: vi.fn(async () => new Headers()),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: vi.fn(), set: vi.fn() })),
  headers: mocks.headers,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      signInWithOAuth: mocks.signInWithOAuth,
      signUp: mocks.signUp,
      signOut: mocks.signOut,
    },
  })),
}));

import { login, signInWithGoogle, signup, logout } from "@/app/(auth)/login/actions";

describe("login actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SITE_URL = "https://uanginkuy.test";
  });

  describe("signInWithGoogle", () => {
    it("calls signInWithOAuth with google provider and redirects to Google URL", async () => {
      mocks.signInWithOAuth.mockResolvedValue({
        data: { url: "https://accounts.google.com/o/oauth2/v2/auth?client_id=123" },
        error: null,
      });

      await expect(signInWithGoogle()).rejects.toThrow(
        "NEXT_REDIRECT:https://accounts.google.com/o/oauth2/v2/auth?client_id=123",
      );

      expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: "https://uanginkuy.test/auth/confirm?next=/dashboard",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
    });

    it("prioritizes incoming request origin over process.env.SITE_URL", async () => {
      const headersMap = new Headers();
      headersMap.set("origin", "http://localhost:3000");
      mocks.headers.mockResolvedValue(headersMap);

      mocks.signInWithOAuth.mockResolvedValue({
        data: { url: "https://accounts.google.com/o/oauth2/v2/auth?client_id=123" },
        error: null,
      });

      await expect(signInWithGoogle()).rejects.toThrow(
        "NEXT_REDIRECT:https://accounts.google.com/o/oauth2/v2/auth?client_id=123",
      );

      expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: "http://localhost:3000/auth/confirm?next=/dashboard",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
    });

    it("redirects to /login with error if signInWithOAuth fails", async () => {
      mocks.signInWithOAuth.mockResolvedValue({
        data: null,
        error: new Error("OAuth configuration failed"),
      });

      await expect(signInWithGoogle()).rejects.toThrow(
        /NEXT_REDIRECT:\/login\?error=/,
      );
    });
  });

  describe("login with email and password", () => {
    it("redirects to login when email or password is invalid", async () => {
      const formData = new FormData();
      formData.set("email", "invalid-email");
      formData.set("password", "pass");

      await expect(login(formData)).rejects.toThrow(
        "NEXT_REDIRECT:/login?error=Email%20atau%20kata%20sandi%20salah.",
      );
    });

    it("redirects to dashboard when credentials are valid", async () => {
      mocks.signInWithPassword.mockResolvedValue({ error: null });

      const formData = new FormData();
      formData.set("email", "user@example.com");
      formData.set("password", "secret123");

      await expect(login(formData)).rejects.toThrow(
        "NEXT_REDIRECT:/dashboard",
      );

      expect(mocks.signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "secret123",
      });
    });
  });

  describe("logout", () => {
    it("signs out and redirects to login", async () => {
      mocks.signOut.mockResolvedValue({ error: null });

      await expect(logout()).rejects.toThrow(
        "NEXT_REDIRECT:/login",
      );

      expect(mocks.signOut).toHaveBeenCalled();
    });
  });
});
