// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profile: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: vi.fn(), set: vi.fn() })),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mocks.profile })),
          })),
        };
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({ data: [] }),
          })),
        })),
      };
    }),
  })),
}));
vi.mock("@/components/ui/WastePieChart", () => ({
  WastePieChart: () => null,
}));
vi.mock("@/components/ui/NewsSection", () => ({ NewsSection: () => null }));
vi.mock("@/components/OnboardingModal", () => ({
  OnboardingModal: () => (
    <div role="dialog" aria-label="Onboarding" />
  ),
}));

import DashboardPage from "@/app/(nasabah)/dashboard/page";

afterEach(cleanup);

describe("DashboardPage onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("shows onboarding when the profile explicitly has no completion time", async () => {
    mocks.profile.mockResolvedValue({
      data: {
        name: "Ayu Lestari",
        balance: 0,
        onboarding_completed_at: null,
      },
    });

    render(
      await DashboardPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByRole("dialog", { name: /onboarding/i })).toBeInTheDocument();
  });

  it("does not show onboarding after completion", async () => {
    mocks.profile.mockResolvedValue({
      data: {
        name: "Ayu Lestari",
        balance: 0,
        onboarding_completed_at: "2026-08-05T00:00:00.000Z",
      },
    });

    render(await DashboardPage({ searchParams: Promise.resolve({}) }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not mistake a missing profile for a new customer", async () => {
    mocks.profile.mockResolvedValue({ data: null });

    render(await DashboardPage({ searchParams: Promise.resolve({}) }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
