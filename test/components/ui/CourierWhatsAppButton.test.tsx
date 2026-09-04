// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { CourierWhatsAppButton } from "@/components/ui/CourierWhatsAppButton";

afterEach(cleanup);

describe("CourierWhatsAppButton", () => {
  const defaultProps = {
    phoneNumber: "081234567890",
    recipientName: "Budi Santoso",
    courierName: "Ahmad",
    ticketId: "TK-ABC123",
    address: "Jl. Melati No. 4, RT 02/05",
    status: "on_the_way",
  };

  it("renders trigger button with WhatsApp icon and aria-label", () => {
    render(<CourierWhatsAppButton {...defaultProps} />);

    const button = screen.getByRole("button", { name: /chat whatsapp dengan budi santoso/i });
    expect(button).toBeInTheDocument();
  });

  it("returns null when phoneNumber is empty", () => {
    const { container } = render(<CourierWhatsAppButton {...defaultProps} phoneNumber="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("opens modal on click and displays recipient info and message preview", async () => {
    const user = userEvent.setup();
    render(<CourierWhatsAppButton {...defaultProps} />);

    const button = screen.getByRole("button", { name: /chat whatsapp dengan budi santoso/i });
    await user.click(button);

    // Modal dialog is displayed
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Chat WhatsApp Nasabah")).toBeInTheDocument();
    expect(screen.getByText("Budi Santoso", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText(/081234567890/)).toBeInTheDocument();

    // Default message should be pre-filled in textarea
    const textarea = screen.getByLabelText(/pesan yang akan dikirim/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain("Halo Kak Budi Santoso");
    expect(textarea.value).toContain("Ahmad");
    expect(textarea.value).toContain("TK-ABC123");
  });

  it("allows switching templates and updates message preview", async () => {
    const user = userEvent.setup();
    render(<CourierWhatsAppButton {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /chat whatsapp dengan budi santoso/i }));

    // Switch to "Sudah Tiba di Lokasi" template
    const arrivedTemplateBtn = screen.getByRole("button", { name: /sudah tiba di lokasi/i });
    await user.click(arrivedTemplateBtn);

    const textarea = screen.getByLabelText(/pesan yang akan dikirim/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain("sudah tiba di lokasi penjemputan");
  });

  it("allows courier to customize the message in the textarea", async () => {
    const user = userEvent.setup();
    render(<CourierWhatsAppButton {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /chat whatsapp dengan budi santoso/i }));

    const textarea = screen.getByLabelText(/pesan yang akan dikirim/i) as HTMLTextAreaElement;
    await user.clear(textarea);
    await user.type(textarea, "Halo Kak Budi, saya kurir sudah di depan pagar hitam ya.");

    expect(textarea.value).toBe("Halo Kak Budi, saya kurir sudah di depan pagar hitam ya.");

    // "Buka WhatsApp" link should reflect customized message
    const waLink = screen.getByRole("link", { name: /buka whatsapp/i });
    expect(waLink).toHaveAttribute(
      "href",
      expect.stringContaining("Halo%20Kak%20Budi%2C%20saya%20kurir%20sudah%20di%20depan%20pagar%20hitam%20ya.")
    );
  });

  it("closes modal on cancel button click", async () => {
    const user = userEvent.setup();
    render(<CourierWhatsAppButton {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /chat whatsapp dengan budi santoso/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: /batal/i });
    await user.click(cancelButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
