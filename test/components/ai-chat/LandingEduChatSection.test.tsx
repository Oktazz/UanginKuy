// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LandingEduChatSection } from "@/components/ai-chat/LandingEduChatSection";

const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
};

const localStorageMock = createLocalStorageMock();
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});
Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

afterEach(() => {
  cleanup();
  localStorageMock.clear();
  vi.restoreAllMocks();
});

describe("LandingEduChatSection", () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Mock scrollIntoView and scrollTo
    Element.prototype.scrollTo = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("renders the educational section header, starter prompts, and enforces no reset button", () => {
    render(<LandingEduChatSection />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Penasaran Soal Bank Sampah\?/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/Apa itu UanginKuy\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Sampah & Harga per Kg/i)).toBeInTheDocument();
    expect(screen.getByText("Fitur Unggulan")).toBeInTheDocument();
    expect(screen.getByText("Alur Penjemputan")).toBeInTheDocument();
    expect(screen.getByText("Mode Tamu")).toBeInTheDocument();
    expect(screen.queryByText(/Sisa \d+ Pertanyaan/i)).not.toBeInTheDocument();

    // Pastikan tidak ada tombol reset di header
    expect(screen.queryByRole("button", { name: /Mulai Sesi Baru/i })).not.toBeInTheDocument();
  });

  it("sends message when a starter prompt is clicked and renders sources from SSE", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode('data: {"text":"UanginKuy adalah platform bank sampah digital."}\n\n'),
        );
        controller.enqueue(
          encoder.encode(
            'data: {"sources":[{"title":"Panduan Layanan UanginKuy","filename":"panduan.pdf"}]}\n\n',
          ),
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: stream,
    });
    global.fetch = mockFetch;

    render(<LandingEduChatSection />);

    const promptBtn = screen.getByText(/Apa itu UanginKuy\?/i).closest("button")!;
    fireEvent.click(promptBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/ai/landing-chat",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Apa itu platform UanginKuy dan bagaimana cara kerjanya?"),
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/UanginKuy adalah platform bank sampah digital\./i),
      ).toBeInTheDocument();
      expect(screen.queryByText(/Sisa \d+ Pertanyaan/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Sumber \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Panduan Layanan UanginKuy/i)).toBeInTheDocument();
    });

    // Check localStorage includes sources
    const saved = JSON.parse(localStorage.getItem("uanginkuy_landing_edu_chat_v1") || "{}");
    expect(saved.count).toBe(1);
    expect(saved.messages.length).toBe(2);
    expect(saved.messages[1].sources.length).toBe(1);
  });

  it("locks input and displays smart CTA card directly without error message or reset button when limit is reached", async () => {
    localStorage.setItem(
      "uanginkuy_landing_edu_chat_v1",
      JSON.stringify({
        count: 5,
        messages: [
          { id: "1", role: "user", content: "Tanya 1" },
          { id: "2", role: "model", content: "Jawab 1" },
          { id: "3", role: "user", content: "Tanya 2" },
          { id: "4", role: "model", content: "Jawab 2" },
          { id: "5", role: "user", content: "Tanya 3" },
          { id: "6", role: "model", content: "Jawab 3" },
          { id: "7", role: "user", content: "Tanya 4" },
          { id: "8", role: "model", content: "Jawab 4" },
          { id: "9", role: "user", content: "Tanya 5" },
          { id: "10", role: "model", content: "Jawab 5" },
        ],
      }),
    );

    render(<LandingEduChatSection />);

    // Tidak ada hitungan kuota habis atau sisa pertanyaan yang mengganggu
    expect(screen.queryByText(/Kuota Habis/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sisa \d+ Pertanyaan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Batas 5 pertanyaan/i)).not.toBeInTheDocument();

    // CTA cards ditampilkan langsung
    expect(screen.getByText("Mode Tamu")).toBeInTheDocument();
    expect(
      screen.getByText(/Siap Mengubah Sampah Menjadi Saldo Nyata\?/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Tertarik mencoba layanan UanginKuy\?/i),
    ).toBeInTheDocument();

    const registerLinks = screen.getAllByRole("link", { name: /Daftar/i });
    expect(registerLinks.some((el) => el.getAttribute("href") === "/register")).toBe(true);

    const loginLinks = screen.getAllByRole("link", { name: /Masuk/i });
    expect(loginLinks.some((el) => el.getAttribute("href") === "/login")).toBe(true);

    // Textarea harus tidak ada saat kuota tercapai, langsung berganti ke CTA
    expect(screen.queryByPlaceholderText(/Ketik pertanyaanmu/i)).not.toBeInTheDocument();

    // Pastikan TIDAK ADA tombol reset atau mulai ulang di kartu CTA
    expect(screen.queryByText(/Mulai Ulang Pertanyaan/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Mulai Sesi Baru/i })).not.toBeInTheDocument();
  });
});
