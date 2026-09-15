// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemberIdRow } from "@/app/(nasabah)/profile/_components/MemberIdRow";

describe("MemberIdRow Component", () => {
  const writeTextMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders member ID and QR indicator", () => {
    render(<MemberIdRow accountNumber="UKN-AB12CD" userName="Budi Nasabah" />);

    expect(screen.getByText("UKN-AB12CD")).toBeInTheDocument();
    expect(screen.getByText("Lihat QR")).toBeInTheDocument();
  });

  it("opens modal when member ID row is clicked", async () => {
    render(<MemberIdRow accountNumber="UKN-AB12CD" userName="Budi Nasabah" />);

    const triggerButton = screen.getByRole("button", { name: /ID Nasabah: UKN-AB12CD/i });
    fireEvent.click(triggerButton);

    expect(await screen.findByText("QR Code Akun Nasabah")).toBeInTheDocument();
    expect(screen.getByText("Member ID (Budi Nasabah)")).toBeInTheDocument();
    expect(screen.getByText("Tunjukkan QR Code ini kepada admin loket untuk verifikasi setor sampah (Drop-off) atau penarikan tunai.")).toBeInTheDocument();
  });

  it("copies member ID when copy button inside modal is clicked", async () => {
    render(<MemberIdRow accountNumber="UKN-AB12CD" userName="Budi Nasabah" />);

    fireEvent.click(screen.getByRole("button", { name: /ID Nasabah: UKN-AB12CD/i }));

    const copyBtn = await screen.findByTitle("Salin ID");
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith("UKN-AB12CD");
  });

  it("closes modal when Tutup button is clicked", async () => {
    render(<MemberIdRow accountNumber="UKN-AB12CD" userName="Budi Nasabah" />);

    fireEvent.click(screen.getByRole("button", { name: /ID Nasabah: UKN-AB12CD/i }));

    const closeBtn = await screen.findByRole("button", { name: "Tutup" });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText("QR Code Akun Nasabah")).not.toBeInTheDocument();
    });
  });
});
