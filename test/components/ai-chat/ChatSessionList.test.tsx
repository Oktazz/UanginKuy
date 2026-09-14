// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatSessionList } from "@/components/ai-chat/ChatSessionList";

describe("ChatSessionList Component", () => {
  afterEach(() => {
    cleanup();
  });

  const mockSessions = [
    {
      id: "sess-1",
      title: "Cek Saldo Koin",
      created_at: "2026-09-14T10:00:00Z",
      updated_at: "2026-09-14T10:05:00Z",
    },
    {
      id: "sess-2",
      title: "Jadwal Pickup",
      created_at: "2026-09-13T09:00:00Z",
      updated_at: "2026-09-13T09:10:00Z",
    },
  ];

  it("renders empty state when there are no sessions and not loading", () => {
    render(
      <ChatSessionList
        sessions={[]}
        activeSessionId={null}
        isLoading={false}
        onSelectSession={vi.fn()}
        onNewChat={vi.fn()}
        onDeleteSession={vi.fn()}
      />
    );

    expect(screen.getByText("Belum Ada Riwayat Sesi")).toBeInTheDocument();
    expect(screen.getByText("Obrolan Baru")).toBeInTheDocument();
  });

  it("renders loading state when isLoading is true", () => {
    render(
      <ChatSessionList
        sessions={[]}
        activeSessionId={null}
        isLoading={true}
        onSelectSession={vi.fn()}
        onNewChat={vi.fn()}
        onDeleteSession={vi.fn()}
      />
    );

    expect(screen.getByText("Memuat riwayat sesi...")).toBeInTheDocument();
  });

  it("renders sessions list and highlights active session", () => {
    render(
      <ChatSessionList
        sessions={mockSessions}
        activeSessionId="sess-1"
        isLoading={false}
        onSelectSession={vi.fn()}
        onNewChat={vi.fn()}
        onDeleteSession={vi.fn()}
      />
    );

    expect(screen.getByText("Cek Saldo Koin")).toBeInTheDocument();
    expect(screen.getByText("Jadwal Pickup")).toBeInTheDocument();
    expect(screen.getByText("Aktif")).toBeInTheDocument();
  });

  it("calls onSelectSession when clicking an inactive session", () => {
    const onSelectSession = vi.fn();
    render(
      <ChatSessionList
        sessions={mockSessions}
        activeSessionId="sess-1"
        isLoading={false}
        onSelectSession={onSelectSession}
        onNewChat={vi.fn()}
        onDeleteSession={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Jadwal Pickup"));
    expect(onSelectSession).toHaveBeenCalledWith("sess-2");
  });

  it("calls onNewChat when clicking Obrolan Baru button", () => {
    const onNewChat = vi.fn();
    render(
      <ChatSessionList
        sessions={mockSessions}
        activeSessionId="sess-1"
        isLoading={false}
        onSelectSession={vi.fn()}
        onNewChat={onNewChat}
        onDeleteSession={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Obrolan Baru"));
    expect(onNewChat).toHaveBeenCalledTimes(1);
  });

  it("shows confirmation prompt before deleting a session", async () => {
    const onDeleteSession = vi.fn().mockResolvedValue(undefined);
    render(
      <ChatSessionList
        sessions={mockSessions}
        activeSessionId="sess-1"
        isLoading={false}
        onSelectSession={vi.fn()}
        onNewChat={vi.fn()}
        onDeleteSession={onDeleteSession}
      />
    );

    const deleteButtons = screen.getAllByRole("button", { name: "Hapus sesi" });
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText("Hapus sesi ini?")).toBeInTheDocument();
    expect(screen.getByText("Batal")).toBeInTheDocument();

    // Klik Hapus
    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    expect(onDeleteSession).toHaveBeenCalledWith("sess-1");
  });
});
