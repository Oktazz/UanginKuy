import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyOtp, exchangeCodeForSession, createClient } = vi.hoisted(() => {
  const verify = vi.fn();
  const exchange = vi.fn();
  return {
    verifyOtp: verify,
    exchangeCodeForSession: exchange,
    createClient: vi.fn(async () => ({
      auth: { verifyOtp: verify, exchangeCodeForSession: exchange },
    })),
  };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: vi.fn(), set: vi.fn() })),
}));

vi.mock("@/utils/supabase/server", () => ({ createClient }));

import { GET } from "@/app/(auth)/auth/confirm/route";

describe("GET /auth/confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyOtp.mockResolvedValue({ error: null });
    exchangeCodeForSession.mockResolvedValue({ error: null });
  });

  it("sends recovery token hashes to the password page", async () => {
    const response = await GET(
      new NextRequest(
        "https://uanginkuy.test/auth/confirm?token_hash=token&type=recovery",
      ),
    );

    expect(verifyOtp).toHaveBeenCalledWith({
      token_hash: "token",
      type: "recovery",
    });
    expect(response.headers.get("location")).toBe(
      "https://uanginkuy.test/set-password",
    );
  });

  it("sends signup confirmations to the dashboard", async () => {
    const response = await GET(
      new NextRequest(
        "https://uanginkuy.test/auth/confirm?token_hash=token&type=signup",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://uanginkuy.test/dashboard",
    );
  });

  it("sends email changes back to the profile with confirmation", async () => {
    const response = await GET(
      new NextRequest(
        "https://uanginkuy.test/auth/confirm?token_hash=token&type=email_change",
      ),
    );

    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/profile/edit");
    expect(location.searchParams.get("success")).toMatch(
      /berhasil diperbarui/i,
    );
  });

  it("sends other verified token types to the dashboard", async () => {
    const response = await GET(
      new NextRequest(
        "https://uanginkuy.test/auth/confirm?token_hash=token&type=magiclink",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://uanginkuy.test/dashboard",
    );
  });

  it("exchanges a PKCE code and accepts the password-page destination", async () => {
    const response = await GET(
      new NextRequest(
        "https://uanginkuy.test/auth/confirm?code=pkce&next=%2Fset-password",
      ),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("pkce");
    expect(response.headers.get("location")).toBe(
      "https://uanginkuy.test/set-password",
    );
  });

  it("does not allow an arbitrary redirect destination", async () => {
    const response = await GET(
      new NextRequest(
        "https://uanginkuy.test/auth/confirm?code=pkce&next=https%3A%2F%2Fevil.test",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://uanginkuy.test/dashboard",
    );
  });

  it("returns to login when verification fails", async () => {
    verifyOtp.mockResolvedValue({ error: new Error("expired") });
    const response = await GET(
      new NextRequest(
        "https://uanginkuy.test/auth/confirm?token_hash=bad&type=recovery",
      ),
    );

    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toMatch(/tidak valid/i);
  });
});
