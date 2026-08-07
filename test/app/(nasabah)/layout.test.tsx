// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  single: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: vi.fn(), set: vi.fn() })),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: mocks.single })),
      })),
    })),
  })),
}));
vi.mock("@/components/ui/ClientNav", () => ({ ClientNav: () => null }));
vi.mock("@/components/ui/AiChatWidget", () => ({ AiChatWidget: () => null }));

import NasabahLayout from "@/app/(nasabah)/layout";

afterEach(cleanup);

describe("NasabahLayout", () => {
  it("allows an incomplete nasabah to reach the dashboard shell", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mocks.single.mockResolvedValue({
      data: { role: "nasabah", onboarding_completed_at: null },
    });

    render(await NasabahLayout({ children: <p>Dashboard nasabah</p> }));

    expect(screen.getByText("Dashboard nasabah")).toBeInTheDocument();
    expect(mocks.redirect).not.toHaveBeenCalledWith("/onboarding");
  });
});
