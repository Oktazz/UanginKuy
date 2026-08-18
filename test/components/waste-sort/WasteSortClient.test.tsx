// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WasteSortClient } from "@/components/waste-sort/WasteSortClient";

describe("WasteSortClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("uploads a photo and presents sorting guidance", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: {
        status: "accepted",
        needsRetake: false,
        overallAdvice: "Siapkan sebelum dijemput.",
        items: [{
          categoryId: 1,
          name: "Botol PET",
          materialGroup: "plastic",
          confidence: "high",
          issues: ["Masih terlihat kotor atau memiliki sisa isi."],
          preparationSteps: ["Kosongkan dan bilas kemasan."],
        }],
      },
    }), { status: 200, headers: { "content-type": "application/json" } }));
    const user = userEvent.setup();
    render(<WasteSortClient />);

    const input = screen.getByLabelText("Pilih foto sampah");
    await user.upload(input, new File(["image"], "botol.jpg", { type: "image/jpeg" }));
    await user.click(screen.getByRole("button", { name: "Analisis foto" }));

    expect(await screen.findByRole("heading", { name: "Botol PET" })).toBeInTheDocument();
    expect(screen.getByText("Kosongkan dan bilas kemasan.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Buat jadwal jemput/i })).toHaveAttribute("href", "/booking");
  });

  it("announces an API failure and allows choosing another photo", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      success: false,
      error: "Foto belum cukup jelas.",
    }), { status: 415, headers: { "content-type": "application/json" } }));
    const user = userEvent.setup();
    render(<WasteSortClient />);

    await user.upload(
      screen.getByLabelText("Pilih foto sampah"),
      new File(["image"], "buram.jpg", { type: "image/jpeg" }),
    );
    await user.click(screen.getByRole("button", { name: "Analisis foto" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Foto belum cukup jelas."));
    expect(screen.getByRole("button", { name: "Analisis foto" })).toBeEnabled();
  });

  it("validates file type and size before sending anything", async () => {
    render(<WasteSortClient />);
    const input = screen.getByLabelText("Pilih foto sampah");

    fireEvent.change(input, {
      target: { files: [new File(["gif"], "waste.gif", { type: "image/gif" })] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Gunakan foto JPG, PNG, atau WebP.");

    fireEvent.change(input, {
      target: { files: [new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" })] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Ukuran foto maksimal 5 MB.");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("offers a photo retake when confidence is insufficient", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: {
        status: "uncertain",
        needsRetake: true,
        retakeReason: "Foto terlalu gelap.",
        overallAdvice: "Ambil foto ulang.",
        items: [],
      },
    }), { status: 200, headers: { "content-type": "application/json" } }));
    const user = userEvent.setup();
    render(<WasteSortClient />);

    await user.upload(screen.getByLabelText("Pilih foto sampah"), new File(["image"], "dark.jpg", { type: "image/jpeg" }));
    await user.click(screen.getByRole("button", { name: "Analisis foto" }));

    expect(await screen.findByText("Foto terlalu gelap.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Foto ulang" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Buat jadwal jemput/i })).not.toBeInTheDocument();
  });
});
