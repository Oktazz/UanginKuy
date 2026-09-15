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

  it("renders the educational section header and starter prompts", () => {
    render(<LandingEduChatSection />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Penasaran Soal Bank Sampah\?/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/Apa itu bank sampah\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Sampah yang diterima/i)).toBeInTheDocument();
    expect(screen.getByText(/Cara penjemputan/i)).toBeInTheDocument();
    expect(screen.getByText(/Asal saldo & pencairan/i)).toBeInTheDocument();
    expect(screen.getByText(/Sisa 5 Pertanyaan/i)).toBeInTheDocument();
  });

  it("sends message when a starter prompt is clicked", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode('data: {"text":"Bank sampah adalah sistem pengumpulan terpilah."}\n\ndata: [DONE]\n\n'),
        );
        controller.close();
      },
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: stream,
    });
    global.fetch = mockFetch;

    render(<LandingEduChatSection />);

    const promptBtn = screen.getByText(/Apa itu bank sampah\?/i).closest("button")!;
    fireEvent.click(promptBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/ai/landing-chat",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Apa itu bank sampah dan apa manfaatnya bagi warga?"),
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Bank sampah adalah sistem pengumpulan terpilah\./i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Sisa 4 Pertanyaan/i)).toBeInTheDocument();
    });

    // Check localStorage
    const saved = JSON.parse(localStorage.getItem("uanginkuy_landing_edu_chat_v1") || "{}");
    expect(saved.count).toBe(1);
    expect(saved.messages.length).toBe(2);
  });

  it("locks input and displays smart CTA card when limit of 5 questions is reached", async () => {
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

    expect(screen.getByText(/Kuota Habis/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Siap Mengubah Sampah Menjadi Saldo Nyata\?/i),
    ).toBeInTheDocument();

    const registerLinks = screen.getAllByRole("link", { name: /Daftar/i });
    expect(registerLinks.some((el) => el.getAttribute("href") === "/register")).toBe(true);

    const loginLinks = screen.getAllByRole("link", { name: /Masuk/i });
    expect(loginLinks.some((el) => el.getAttribute("href") === "/login")).toBe(true);

    // Textarea should not be rendered when limit is reached
    expect(screen.queryByPlaceholderText(/Ketik pertanyaanmu/i)).not.toBeInTheDocument();
  });

  it("resets session when reset button is clicked", async () => {
    localStorage.setItem(
      "uanginkuy_landing_edu_chat_v1",
      JSON.stringify({
        count: 2,
        messages: [
          { id: "1", role: "user", content: "Tanya 1" },
          { id: "2", role: "model", content: "Jawab 1" },
        ],
      }),
    );

    render(<LandingEduChatSection />);

    expect(screen.getByText(/Sisa 3 Pertanyaan/i)).toBeInTheDocument();
    expect(screen.getByText("Tanya 1")).toBeInTheDocument();

    const resetBtn = screen.getByRole("button", { name: /Mulai Sesi Baru/i });
    fireEvent.click(resetBtn);

    expect(screen.getByText(/Sisa 5 Pertanyaan/i)).toBeInTheDocument();
    expect(screen.queryByText("Tanya 1")).not.toBeInTheDocument();
    expect(screen.getByText(/Apa itu bank sampah\?/i)).toBeInTheDocument();
  });
});
