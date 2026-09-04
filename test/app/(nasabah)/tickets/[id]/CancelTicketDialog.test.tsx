// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockCancelTicket = vi.fn();
const mockRefresh = vi.fn();

vi.mock("@/app/(nasabah)/tickets/[id]/actions", () => ({
  cancelTicket: (...args: unknown[]) => mockCancelTicket(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

import { CancelTicketDialog } from "@/app/(nasabah)/tickets/[id]/CancelTicketDialog";

afterEach(cleanup);

describe("CancelTicketDialog", () => {
  const defaultProps = {
    ticketId: "ticket-uuid-123",
    shortId: "TK-123456",
    currentStatus: "pending",
  };

  it("does not render when status is completed or cancelled or on_the_way", () => {
    const { container: completedContainer } = render(
      <CancelTicketDialog {...defaultProps} currentStatus="completed" />
    );
    expect(completedContainer).toBeEmptyDOMElement();

    const { container: cancelledContainer } = render(
      <CancelTicketDialog {...defaultProps} currentStatus="cancelled" />
    );
    expect(cancelledContainer).toBeEmptyDOMElement();

    const { container: onTheWayContainer } = render(
      <CancelTicketDialog {...defaultProps} currentStatus="on_the_way" />
    );
    expect(onTheWayContainer).toBeEmptyDOMElement();
  });

  it("renders trigger button when status is pending or scheduled", () => {
    render(<CancelTicketDialog {...defaultProps} currentStatus="pending" />);
    expect(
      screen.getByRole("button", { name: /batalkan jadwal penjemputan/i })
    ).toBeInTheDocument();
  });

  it("opens confirmation dialog when trigger button is clicked", async () => {
    const user = userEvent.setup();
    render(<CancelTicketDialog {...defaultProps} currentStatus="pending" />);

    await user.click(
      screen.getByRole("button", { name: /batalkan jadwal penjemputan/i })
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/batalkan penjemputan\?/i)).toBeInTheDocument();
    expect(screen.getByText(/#TK-123456/i)).toBeInTheDocument();
  });

  it("shows courier warning notice if ticket is scheduled", async () => {
    const user = userEvent.setup();
    render(
      <CancelTicketDialog
        {...defaultProps}
        currentStatus="scheduled"
        courierName="Pak Budi"
      />
    );

    await user.click(
      screen.getByRole("button", { name: /batalkan jadwal penjemputan/i })
    );

    expect(screen.getByText(/kurir telah dijadwalkan/i)).toBeInTheDocument();
    expect(screen.getByText(/pak budi/i)).toBeInTheDocument();
  });

  it("allows selecting reason and submitting cancellation successfully", async () => {
    const user = userEvent.setup();
    mockCancelTicket.mockResolvedValue({ success: true });

    render(<CancelTicketDialog {...defaultProps} currentStatus="pending" />);

    await user.click(
      screen.getByRole("button", { name: /batalkan jadwal penjemputan/i })
    );

    // Select second reason
    const radio = screen.getByLabelText(/sampah daur ulang belum siap/i);
    await user.click(radio);

    // Click confirm cancel button
    const confirmBtn = screen.getByRole("button", { name: /ya, batalkan/i });
    await user.click(confirmBtn);

    expect(mockCancelTicket).toHaveBeenCalledWith(
      "ticket-uuid-123",
      "Sampah daur ulang belum siap / belum dipilah"
    );
    expect(mockRefresh).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("allows typing custom reason when 'Lainnya' is chosen", async () => {
    const user = userEvent.setup();
    mockCancelTicket.mockResolvedValue({ success: true });

    render(<CancelTicketDialog {...defaultProps} currentStatus="pending" />);

    await user.click(
      screen.getByRole("button", { name: /batalkan jadwal penjemputan/i })
    );

    const lainnyaRadio = screen.getByLabelText(/^lainnya/i);
    await user.click(lainnyaRadio);

    const textarea = screen.getByPlaceholderText(/tuliskan alasan pembatalan anda/i);
    await user.type(textarea, "Pindah rumah mendadak");

    const confirmBtn = screen.getByRole("button", { name: /ya, batalkan/i });
    await user.click(confirmBtn);

    expect(mockCancelTicket).toHaveBeenCalledWith(
      "ticket-uuid-123",
      "Pindah rumah mendadak"
    );
  });

  it("displays error message when cancellation fails", async () => {
    const user = userEvent.setup();
    mockCancelTicket.mockResolvedValue({
      success: false,
      error: "Gagal membatalkan tiket karena kendala server.",
    });

    render(<CancelTicketDialog {...defaultProps} currentStatus="pending" />);

    await user.click(
      screen.getByRole("button", { name: /batalkan jadwal penjemputan/i })
    );

    const confirmBtn = screen.getByRole("button", { name: /ya, batalkan/i });
    await user.click(confirmBtn);

    expect(
      screen.getByText(/gagal membatalkan tiket karena kendala server/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
