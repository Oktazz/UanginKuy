// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CustomSelect } from "@/components/ui/CustomSelect";

afterEach(cleanup);

describe("CustomSelect Component", () => {
  const defaultOptions = [
    { value: "courier-1", label: "Budi Santoso" },
    { value: "courier-2", label: "Siti Rahma" },
    { value: "courier-3", label: "Agus Pratama" },
  ];

  it("renders with placeholder when no value is selected", () => {
    render(
      <CustomSelect
        value=""
        onChange={vi.fn()}
        options={defaultOptions}
        placeholder="Pilih Kurir..."
      />
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("Pilih Kurir...");
  });

  it("renders selected option label", () => {
    render(
      <CustomSelect
        value="courier-2"
        onChange={vi.fn()}
        options={defaultOptions}
        placeholder="Pilih Kurir..."
      />
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("Siti Rahma");
  });

  it("opens dropdown and selects an option on click", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <CustomSelect
        value=""
        onChange={handleChange}
        options={defaultOptions}
        placeholder="Pilih Kurir..."
      />
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    const option = screen.getByRole("option", { name: /agus pratama/i });
    await user.click(option);

    expect(handleChange).toHaveBeenCalledWith("courier-3");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("renders hidden input with name and value when name prop is provided", () => {
    const { container } = render(
      <CustomSelect
        name="courier_id"
        value="courier-1"
        onChange={vi.fn()}
        options={defaultOptions}
      />
    );

    const hiddenInput = container.querySelector('input[type="hidden"]');
    expect(hiddenInput).toBeInTheDocument();
    expect(hiddenInput).toHaveAttribute("name", "courier_id");
    expect(hiddenInput).toHaveAttribute("value", "courier-1");
  });

  it("handles disabled state correctly", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <CustomSelect
        value="courier-1"
        onChange={handleChange}
        options={defaultOptions}
        disabled={true}
      />
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute("aria-disabled", "true");

    await user.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("renders grouped options correctly", async () => {
    const user = userEvent.setup();
    const groups = [
      {
        label: "Zona Barat",
        options: [{ value: "b-1", label: "Kurir Barat 1" }],
      },
      {
        label: "Zona Timur",
        options: [{ value: "t-1", label: "Kurir Timur 1" }],
      },
    ];

    render(
      <CustomSelect
        value=""
        onChange={vi.fn()}
        groups={groups}
        placeholder="Pilih Berdasarkan Zona..."
      />
    );

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByText("Zona Barat")).toBeInTheDocument();
    expect(screen.getByText("Zona Timur")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /kurir barat 1/i })).toBeInTheDocument();
  });
});
