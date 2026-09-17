// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WasteSortClient } from "@/app/(nasabah)/cek-sampah/_components/WasteSortClient";

describe("WasteSortClient", () => {
  let mockBlobSize = 10;
  beforeEach(() => {
    mockBlobSize = 10;
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:preview"),
      revokeObjectURL: vi.fn(),
    });

    class MockImage {
      onload: (() => void) | null = null;
      width = 800;
      height = 600;
      set src(_val: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    }
    vi.stubGlobal("Image", MockImage);

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn(),
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback: (blob: Blob | null) => void) => {
      callback(new Blob([new Uint8Array(mockBlobSize)], { type: "image/webp" }));
    }) as unknown as typeof HTMLCanvasElement.prototype.toBlob;
    HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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

    mockBlobSize = 6 * 1024 * 1024;
    fireEvent.change(input, {
      target: { files: [new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" })] },
    });
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/Ukuran foto/i));
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

  it("renders visible choices for taking photo from camera and selecting from file", () => {
    render(<WasteSortClient />);

    expect(screen.getByText("Pilih Metode Pengambilan Foto")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ambil dari Kamera/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pilih dari File/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Ambil foto dari kamera")).toHaveAttribute("capture", "environment");
    expect(screen.getByLabelText("Pilih foto sampah")).not.toHaveAttribute("capture");
  });

  it("triggers file input when 'Pilih dari File' is clicked", async () => {
    const user = userEvent.setup();
    render(<WasteSortClient />);

    const fileInput = screen.getByLabelText("Pilih foto sampah");
    const clickSpy = vi.spyOn(fileInput, "click");

    await user.click(screen.getByRole("button", { name: /Pilih dari File/i }));
    expect(clickSpy).toHaveBeenCalled();
  });

  it("supports drag and drop to select a file", async () => {
    render(<WasteSortClient />);

    const dropzone = screen.getByText("Pilih Metode Pengambilan Foto").closest("div");
    expect(dropzone).toBeInTheDocument();

    const file = new File(["dropped-image"], "sampah.jpg", { type: "image/jpeg" });
    fireEvent.dragOver(dropzone!);
    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [file],
      },
    });

    expect(await screen.findByAltText("Pratinjau sampah yang akan dianalisis")).toBeInTheDocument();
  });

  it("opens source selection dialog when clicking 'Pilih foto lain' or 'Ganti foto'", async () => {
    const user = userEvent.setup();
    render(<WasteSortClient />);

    const input = screen.getByLabelText("Pilih foto sampah");
    await user.upload(input, new File(["image"], "botol.jpg", { type: "image/jpeg" }));

    expect(screen.getByAltText("Pratinjau sampah yang akan dianalisis")).toBeInTheDocument();

    // Click 'Pilih foto lain'
    await user.click(screen.getByRole("button", { name: "Pilih foto lain" }));

    expect(await screen.findByText("Pilih Sumber Foto")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Ambil dari Kamera/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /Pilih dari File/i })).toHaveLength(1);

    // Cancel modal
    await user.click(screen.getByRole("button", { name: "Batal" }));
    await waitFor(() => expect(screen.queryByText("Pilih Sumber Foto")).not.toBeInTheDocument());
  });

  it("opens live webcam modal on desktop and captures a photo", async () => {
    const stopMock = vi.fn();
    const mockStream = {
      getTracks: vi.fn(() => [{ stop: stopMock }]),
    };

    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
        enumerateDevices: vi.fn().mockResolvedValue([
          { kind: "videoinput", deviceId: "cam1" },
          { kind: "videoinput", deviceId: "cam2" },
        ]),
      },
      writable: true,
      configurable: true,
    });

    const user = userEvent.setup();
    render(<WasteSortClient />);

    await user.click(screen.getByRole("button", { name: /Ambil dari Kamera/i }));

    expect(await screen.findByText("Kamera Langsung")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Jepret Foto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Balik Kamera/i })).toBeInTheDocument();

    // Snap photo
    await user.click(screen.getByRole("button", { name: "Jepret Foto" }));

    expect(stopMock).toHaveBeenCalled();
    expect(await screen.findByAltText("Pratinjau sampah yang akan dianalisis")).toBeInTheDocument();
  });

  it("handles camera permission error in live camera modal with fallback to file picker", async () => {
    const notAllowedError = new Error("Permission denied");
    notAllowedError.name = "NotAllowedError";

    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(notAllowedError),
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
      writable: true,
      configurable: true,
    });

    const user = userEvent.setup();
    render(<WasteSortClient />);

    await user.click(screen.getByRole("button", { name: /Ambil dari Kamera/i }));

    expect(await screen.findByText(/Izin akses kamera ditolak/i)).toBeInTheDocument();
    const fileFallbackButton = screen.getByRole("button", { name: /Pilih dari File/i });
    expect(fileFallbackButton).toBeInTheDocument();

    const fileInput = screen.getByLabelText("Pilih foto sampah");
    const clickSpy = vi.spyOn(fileInput, "click");
    await user.click(fileFallbackButton);

    expect(clickSpy).toHaveBeenCalled();
  });
});
