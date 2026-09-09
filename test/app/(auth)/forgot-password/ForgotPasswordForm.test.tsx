// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ForgotPasswordForm } from "@/app/(auth)/forgot-password/ForgotPasswordForm";

afterEach(cleanup);

describe("ForgotPasswordForm", () => {
  it("renders an accessible email form and a way back to login", () => {
    render(<ForgotPasswordForm resetAction={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: /atur ulang kata sandi/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/alamat email/i)).toHaveAttribute(
      "autocomplete",
      "email",
    );
    expect(
      screen.getByRole("button", { name: /kirim tautan pemulihan/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /kembali ke halaman masuk/i }),
    ).toHaveAttribute("href", "/login");
  });

  it("replaces the form with a generic success status", async () => {
    const user = userEvent.setup();
    const resetAction = vi.fn(async () => ({
      status: "success" as const,
      message: "Jika email terdaftar, tautan pemulihan akan segera dikirim.",
    }));
    render(<ForgotPasswordForm resetAction={resetAction} />);

    await user.type(screen.getByLabelText(/alamat email/i), "user@example.com");
    await user.click(
      screen.getByRole("button", { name: /kirim tautan pemulihan/i }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      /jika email terdaftar/i,
    );
    expect(screen.queryByLabelText(/alamat email/i)).not.toBeInTheDocument();
  });

  it("keeps the form available and marks the email invalid on action errors", async () => {
    const user = userEvent.setup();
    const resetAction = vi.fn(async () => ({
      status: "error" as const,
      message: "Masukkan alamat email yang valid.",
    }));
    render(<ForgotPasswordForm resetAction={resetAction} />);

    const input = screen.getByLabelText(/alamat email/i);
    await user.type(input, "user@example.com");
    await user.click(
      screen.getByRole("button", { name: /kirim tautan pemulihan/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /alamat email yang valid/i,
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("shows loading state and disables inputs while submission is pending", async () => {
    let resolveAction!: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });
    const user = userEvent.setup();
    const resetAction = vi.fn(() => pendingPromise as any);
    render(<ForgotPasswordForm resetAction={resetAction} />);

    const input = screen.getByLabelText(/alamat email/i);
    await user.type(input, "user@example.com");
    await user.click(
      screen.getByRole("button", { name: /kirim tautan pemulihan/i }),
    );

    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByText(/memproses\.\.\./i)).toBeInTheDocument();
    expect(input).toBeDisabled();

    resolveAction({
      status: "success",
      message: "Jika email terdaftar, tautan pemulihan akan segera dikirim.",
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      /jika email terdaftar/i,
    );
  });
});
