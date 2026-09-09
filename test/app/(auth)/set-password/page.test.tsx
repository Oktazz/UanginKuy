// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SetPasswordPage from "@/app/(auth)/set-password/page";

afterEach(cleanup);

describe("SetPasswordPage", () => {
  it("renders the set password form correctly", async () => {
    const page = await SetPasswordPage({
      searchParams: Promise.resolve({}),
    });
    render(page);

    expect(
      screen.getByRole("heading", { name: /buat password/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/password baru/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ulangi password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /simpan password & lanjutkan/i })
    ).toBeInTheDocument();
  });

  it("translates english same-password error message in searchParams to indonesian", async () => {
    const page = await SetPasswordPage({
      searchParams: Promise.resolve({
        error: "New password should be different from the old password.",
      }),
    });
    render(page);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Kata sandi baru harus berbeda dengan kata sandi lama."
    );
  });
});
