import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profileSingle: vi.fn(),
  update: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  revalidatePath: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: vi.fn(), set: vi.fn() })),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: mocks.profileSingle })),
      })),
    })),
  })),
}));

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

import { completeOnboarding } from "@/app/(nasabah)/dashboard/actions";

describe("completeOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mocks.profileSingle.mockResolvedValue({
      data: { role: "nasabah", onboarding_completed_at: null },
    });

    const roleEq = vi.fn().mockResolvedValue({ error: null });
    const idEq = vi.fn(() => ({ eq: roleEq }));
    mocks.update.mockReturnValue({ eq: idEq });
    mocks.createAdminClient.mockReturnValue({
      from: vi.fn(() => ({ update: mocks.update })),
    });
  });

  it("requires an authenticated user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    await expect(completeOnboarding("dashboard")).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("does not update onboarding for another role", async () => {
    mocks.profileSingle.mockResolvedValue({
      data: { role: "kurir", onboarding_completed_at: null },
    });

    await expect(completeOnboarding("booking")).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard",
    );
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it.each([
    ["dashboard", "/dashboard"],
    ["booking", "/booking"],
  ] as const)("stores completion before redirecting to %s", async (destination, path) => {
    await expect(completeOnboarding(destination)).rejects.toThrow(
      `NEXT_REDIRECT:${path}`,
    );

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ onboarding_completed_at: expect.any(String) }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("fails closed when the destination is not allowlisted", async () => {
    await expect(
      completeOnboarding("https://evil.test" as "dashboard"),
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard");

    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("does not write the completion timestamp twice", async () => {
    mocks.profileSingle.mockResolvedValue({
      data: {
        role: "nasabah",
        onboarding_completed_at: "2026-08-05T00:00:00.000Z",
      },
    });

    await expect(completeOnboarding("booking")).rejects.toThrow(
      "NEXT_REDIRECT:/booking",
    );
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("returns to the open dashboard modal when persistence fails", async () => {
    const roleEq = vi
      .fn()
      .mockResolvedValue({ error: new Error("write failed") });
    const idEq = vi.fn(() => ({ eq: roleEq }));
    mocks.update.mockReturnValue({ eq: idEq });

    await expect(completeOnboarding("booking")).rejects.toThrow(
      /NEXT_REDIRECT:\/dashboard\?onboardingError=/,
    );
  });
});
