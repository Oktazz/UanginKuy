// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SignInPage } from "@/components/ui/sign-in";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ prefetch: vi.fn(), push: vi.fn() }),
}));

afterEach(cleanup);

describe("SignInPage", () => {
  it("renders the production login controls and destinations", () => {
    render(<SignInPage signInAction={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: /selamat datang kembali/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/alamat email/i)).toHaveAttribute(
      "autocomplete",
      "email",
    );
    expect(screen.getByLabelText(/^kata sandi$/i)).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(
      screen.getByRole("link", { name: /lupa kata sandi/i }),
    ).toHaveAttribute("href", "/forgot-password");
    expect(screen.getByRole("link", { name: /buat akun/i })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.queryByText(/google/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ingat saya/i)).not.toBeInTheDocument();
  });

  it("shows and hides the password with an accessible control", async () => {
    const user = userEvent.setup();
    render(<SignInPage signInAction={vi.fn()} />);

    const password = screen.getByLabelText(/^kata sandi$/i);
    const toggle = screen.getByRole("button", {
      name: /tampilkan kata sandi/i,
    });

    expect(password).toHaveAttribute("type", "password");
    await user.click(toggle);
    expect(password).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: /sembunyikan kata sandi/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("announces a login error", () => {
    render(
      <SignInPage
        signInAction={vi.fn()}
        error="Email atau kata sandi salah."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Email atau kata sandi salah.",
    );
    expect(screen.getByLabelText(/alamat email/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
