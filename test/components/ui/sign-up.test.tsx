// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SignUpPage } from "@/components/ui/sign-up";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ prefetch: vi.fn(), push: vi.fn() }),
}));

afterEach(cleanup);

describe("SignUpPage", () => {
  it("renders an accessible registration form compatible with the signup action", () => {
    render(<SignUpPage signUpAction={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: /mulai perjalanan hijaumu/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/nama akun/i)).toHaveAttribute(
      "autocomplete",
      "name",
    );
    expect(screen.getByLabelText(/alamat email/i)).toHaveAttribute(
      "autocomplete",
      "email",
    );
    expect(screen.getByLabelText(/^kata sandi$/i)).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(
      screen.getByRole("button", { name: /buat akun sekarang/i }),
    ).toHaveAttribute("type", "submit");
    expect(screen.getByRole("link", { name: /^masuk$/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("shows and hides the new password", async () => {
    const user = userEvent.setup();
    render(<SignUpPage signUpAction={vi.fn()} />);

    const password = screen.getByLabelText(/^kata sandi$/i);
    expect(password).toHaveAttribute("type", "password");

    await user.click(
      screen.getByRole("button", { name: /tampilkan kata sandi/i }),
    );

    expect(password).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: /sembunyikan kata sandi/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("announces registration errors and marks fields invalid", () => {
    render(
      <SignUpPage
        signUpAction={vi.fn()}
        error="Alamat email sudah digunakan."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Alamat email sudah digunakan.",
    );
    expect(screen.getByLabelText(/alamat email/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
