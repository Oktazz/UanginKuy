// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatHeader } from "@/components/ai-chat/ChatHeader";

describe("ChatHeader Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders in chat view with bot title and actions", () => {
    const onToggleView = vi.fn();
    const onNewChat = vi.fn();
    const onClose = vi.fn();

    render(
      <ChatHeader
        view="chat"
        onToggleView={onToggleView}
        onNewChat={onNewChat}
        onClose={onClose}
        activeTitle="Pertanyaan Jadwal"
      />
    );

    expect(screen.getByText("UanginBot")).toBeInTheDocument();
    expect(screen.getByText("Pertanyaan Jadwal")).toBeInTheDocument();

    // Klik menu
    const menuBtn = screen.getByRole("button", { name: "Buka daftar riwayat sesi" });
    fireEvent.click(menuBtn);
    expect(onToggleView).toHaveBeenCalledTimes(1);

    // Klik new chat
    const newChatBtn = screen.getByRole("button", { name: "Mulai obrolan baru" });
    fireEvent.click(newChatBtn);
    expect(onNewChat).toHaveBeenCalledTimes(1);

    // Klik close
    const closeBtn = screen.getByRole("button", { name: "Tutup chat" });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders in sessions view with back button and sessions title", () => {
    const onToggleView = vi.fn();

    render(
      <ChatHeader
        view="sessions"
        onToggleView={onToggleView}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Riwayat Sesi")).toBeInTheDocument();
    expect(screen.getByText("Kelola percakapan")).toBeInTheDocument();

    const backBtn = screen.getByRole("button", { name: "Kembali ke obrolan" });
    fireEvent.click(backBtn);
    expect(onToggleView).toHaveBeenCalledTimes(1);

    // New chat button should not be present in header when in sessions view
    expect(screen.queryByRole("button", { name: "Mulai obrolan baru" })).not.toBeInTheDocument();
  });
});
