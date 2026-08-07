// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OnboardingDialog } from "@/components/ui/OnboardingDialog";

afterEach(cleanup);

describe("OnboardingDialog", () => {
  it("welcomes a new customer in an accessible modal", () => {
    render(
      <OnboardingDialog
        userName="Ayu Lestari"
        completeAction={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog")).toHaveAccessibleName(
      /selamat datang, ayu/i,
    );
    expect(screen.getByText(/simpan beberapa alamat/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /tutup onboarding/i }),
    ).toBeInTheDocument();
  });

  it("uses a friendly fallback when the profile name is unavailable", () => {
    render(<OnboardingDialog completeAction={vi.fn()} />);

    expect(screen.getByRole("dialog")).toHaveAccessibleName(
      /selamat datang, nasabah baru/i,
    );
  });

  it("finishes onboarding and opens booking from the primary action", async () => {
    const user = userEvent.setup();
    const completeAction = vi.fn().mockResolvedValue(undefined);
    render(
      <OnboardingDialog
        userName="Ayu"
        completeAction={completeAction}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /mulai setor sampah/i }),
    );

    expect(completeAction).toHaveBeenCalledWith("booking");
  });

  it("finishes onboarding while staying on dashboard from the secondary action", async () => {
    const user = userEvent.setup();
    const completeAction = vi.fn().mockResolvedValue(undefined);
    render(
      <OnboardingDialog
        userName="Ayu"
        completeAction={completeAction}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /jelajahi dashboard dulu/i }),
    );

    expect(completeAction).toHaveBeenCalledWith("dashboard");
  });

  it("treats Escape as completing onboarding on the dashboard", async () => {
    const completeAction = vi.fn().mockResolvedValue(undefined);
    render(
      <OnboardingDialog
        userName="Ayu"
        completeAction={completeAction}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(completeAction).toHaveBeenCalledWith("dashboard");
    });
  });

  it("treats the close button as completing onboarding on the dashboard", async () => {
    const user = userEvent.setup();
    const completeAction = vi.fn().mockResolvedValue(undefined);
    render(
      <OnboardingDialog
        userName="Ayu"
        completeAction={completeAction}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /tutup onboarding/i }),
    );

    expect(completeAction).toHaveBeenCalledWith("dashboard");
  });

  it("announces a persistence error", () => {
    render(
      <OnboardingDialog
        userName="Ayu"
        error="Gagal menyimpan status onboarding."
        completeAction={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/gagal menyimpan/i);
  });
});
