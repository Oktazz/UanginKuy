// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingModal } from "@/app/(nasabah)/dashboard/_components/OnboardingModal";

afterEach(cleanup);

describe("OnboardingModal (Interactive Product Tour)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the 5 onboarding steps sequentially and calls completeAction", async () => {
    const completeAction = vi.fn().mockResolvedValue(undefined);

    render(<OnboardingModal completeAction={completeAction} />);

    // Fast-forward initial timer to open tour
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Step 1: Saldo
    expect(screen.getByText("Total Saldo Aktif")).toBeInTheDocument();
    
    // Advance to Step 2
    const nextBtn1 = screen.getByRole("button", { name: /lanjut/i });
    await act(async () => {
      nextBtn1.click();
    });

    // Step 2: Asisten Sortir
    expect(screen.getByText("Asisten Sortir AI")).toBeInTheDocument();

    // Advance to Step 3
    const nextBtn2 = screen.getByRole("button", { name: /lanjut/i });
    await act(async () => {
      nextBtn2.click();
    });

    // Step 3: Booking
    expect(screen.getByText("Booking Penjemputan")).toBeInTheDocument();

    // Advance to Step 4
    const nextBtn3 = screen.getByRole("button", { name: /lanjut/i });
    await act(async () => {
      nextBtn3.click();
    });

    // Step 4: Tiket
    expect(screen.getByText("Tiket & Status Timbangan")).toBeInTheDocument();

    // Advance to Step 5
    const nextBtn4 = screen.getByRole("button", { name: /lanjut/i });
    await act(async () => {
      nextBtn4.click();
    });

    // Step 5: AI Chat
    expect(screen.getByText("UanginBot Siap Membantu")).toBeInTheDocument();

    // Finish button
    const doneBtn = screen.getByRole("button", { name: /mulai sekarang/i });
    await act(async () => {
      doneBtn.click();
    });

    await waitFor(() => {
      expect(completeAction).toHaveBeenCalledWith("dashboard");
    });
  });

  it("calls completeAction on skip", async () => {
    const completeAction = vi.fn().mockResolvedValue(undefined);

    render(<OnboardingModal completeAction={completeAction} />);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText("Total Saldo Aktif")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: /tutup tur/i });
    await act(async () => {
      closeBtn.click();
    });

    await waitFor(() => {
      expect(completeAction).toHaveBeenCalledWith("dashboard");
    });
  });
});
