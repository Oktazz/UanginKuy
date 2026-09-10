// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import {
  KnowledgeUploadProvider,
  useKnowledgeUpload,
} from "@/components/admin/KnowledgeUploadProvider";

function TestConsumer() {
  const { enqueueUploads, queue, isMinimized, setIsMinimized } =
    useKnowledgeUpload();

  return (
    <div>
      <span data-testid="queue-count">{queue.length}</span>
      <span data-testid="minimized-state">{isMinimized ? "min" : "max"}</span>
      <button
        type="button"
        onClick={() => {
          const file1 = new File(["test pdf content 1"], "doc1.pdf", {
            type: "application/pdf",
          });
          const file2 = new File(["test docx content 2"], "doc2.docx", {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
          enqueueUploads([
            { file: file1, title: "Dokumen Pertama" },
            { file: file2 },
          ]);
        }}
      >
        Upload Batch
      </button>
      <button type="button" onClick={() => setIsMinimized(true)}>
        Force Minimize
      </button>
    </div>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("KnowledgeUploadProvider", () => {
  beforeEach(() => {
    refreshMock.mockClear();
  });

  it("renders children without displaying any widget when queue is empty", () => {
    render(
      <KnowledgeUploadProvider>
        <TestConsumer />
      </KnowledgeUploadProvider>,
    );

    expect(screen.getByTestId("queue-count")).toHaveTextContent("0");
    expect(screen.queryByText(/Proses Embedding AI/i)).not.toBeInTheDocument();
  });

  it("enqueues multiple documents and processes them sequentially in the background", async () => {
    const user = userEvent.setup();

    let fetchCount = 0;
    const fetchMock = vi.fn().mockImplementation(async () => {
      fetchCount += 1;
      return {
        ok: true,
        json: async () => ({
          document: {
            id: `doc-${fetchCount}`,
            title: `Dokumen ${fetchCount}`,
            chunks: 3,
          },
        }),
      };
    });
    global.fetch = fetchMock;

    render(
      <KnowledgeUploadProvider>
        <TestConsumer />
      </KnowledgeUploadProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Upload Batch" }));

    // Queue harus memiliki 2 file
    expect(screen.getByTestId("queue-count")).toHaveTextContent("2");
    expect(screen.getByText(/Proses Embedding AI/i)).toBeInTheDocument();
    expect(screen.getByText("Dokumen Pertama")).toBeInTheDocument();
    expect(screen.getByText("doc2")).toBeInTheDocument();

    // Tunggu sampai kedua dokumen selesai diproses
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(refreshMock).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(screen.getByText(/2 dari 2 selesai/i)).toBeInTheDocument();
    });
  });

  it("allows minimizing and maximizing the floating widget", async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                document: { id: "1", title: "Doc", chunks: 2 },
              }),
            });
          }, 100);
        }),
    );

    render(
      <KnowledgeUploadProvider>
        <TestConsumer />
      </KnowledgeUploadProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Upload Batch" }));

    // Expanded view terlihat
    expect(screen.getByText(/Proses Embedding AI/i)).toBeInTheDocument();

    // Klik tombol minimize di header widget
    const minimizeBtn = screen.getByRole("button", {
      name: /minimize ke pojok kanan bawah/i,
    });
    await user.click(minimizeBtn);

    // Sekarang berada dalam mode minimized: detail hilang, kapsul kecil muncul
    expect(
      screen.queryByText(/Proses Embedding AI/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /perbesar tampilan/i }),
    ).toBeInTheDocument();

    // Klik tombol perbesar untuk kembali ke mode expanded
    await user.click(screen.getByRole("button", { name: /perbesar tampilan/i }));
    expect(screen.getByText(/Proses Embedding AI/i)).toBeInTheDocument();
  });

  it("handles isolated document failure without stopping subsequent uploads", async () => {
    const user = userEvent.setup();

    let call = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      call += 1;
      if (call === 1) {
        return {
          ok: false,
          json: async () => ({ error: "PDF scan tidak didukung." }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          document: { id: "2", title: "Doc 2", chunks: 5 },
        }),
      };
    });

    render(
      <KnowledgeUploadProvider>
        <TestConsumer />
      </KnowledgeUploadProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Upload Batch" }));

    await waitFor(() => {
      expect(screen.getByText(/PDF scan tidak didukung/i)).toBeInTheDocument();
      expect(screen.getByText(/5 bagian/i)).toBeInTheDocument();
    });
  });
});
