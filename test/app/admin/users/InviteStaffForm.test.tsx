// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InviteStaffForm } from "@/app/admin/users/InviteStaffForm";

vi.mock("@/app/admin/users/actions", () => ({
  inviteStaff: vi.fn(),
}));

afterEach(cleanup);

describe("InviteStaffForm Component", () => {
  it("renders aligned inputs and select component matching admin styling", () => {
    render(<InviteStaffForm />);

    const nameInput = screen.getByPlaceholderText("Contoh: Made Pratama");
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveClass("rounded-xl");
    expect(nameInput).toHaveClass("bg-gray-50");
    expect(nameInput).toHaveClass("border-gray-200");
    expect(nameInput).toHaveClass("h-12");

    const emailInput = screen.getByPlaceholderText("nama@uanginkuy.id");
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveClass("rounded-xl");
    expect(emailInput).toHaveClass("bg-gray-50");
    expect(emailInput).toHaveClass("border-gray-200");
    expect(emailInput).toHaveClass("h-12");

    const roleSelect = screen.getByRole("combobox");
    expect(roleSelect).toBeInTheDocument();
    expect(roleSelect).toHaveClass("rounded-xl");
    expect(roleSelect).toHaveClass("border-gray-200");
    expect(roleSelect).toHaveClass("bg-gray-50");
    expect(roleSelect).toHaveClass("h-12");

    const submitBtn = screen.getByRole("button", { name: /Kirim Undangan/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toHaveClass("rounded-xl");
    expect(submitBtn).toHaveClass("h-12");
  });
});
