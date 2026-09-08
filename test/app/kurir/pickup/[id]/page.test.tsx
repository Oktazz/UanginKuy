// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({
  push: vi.fn(),
}));

const supabaseMock = vi.hoisted(() => vi.fn());

const completePickupMock = vi.hoisted(() => vi.fn());
const getTicketDebugMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useParams: () => ({ id: "TEST1234" }),
}));

vi.mock("next/link", () => ({
  default: React.forwardRef<
    HTMLAnchorElement,
    React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
  >(function MockLink({ href, children, ...props }, ref) {
    return (
      <a ref={ref} href={href} {...props}>
        {children}
      </a>
    );
  }),
}));

vi.mock("@/components/ui/CustomSelect", () => ({
  CustomSelect: ({ onChange }: { onChange: (v: string) => void }) => (
    <select
      data-testid="waste-category"
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select...</option>
      <option value="1">Plastik Botol</option>
    </select>
  ),
}));

vi.mock("@/components/ui/CourierWhatsAppButton", () => ({
  CourierWhatsAppButton: () => <div />,
}));

vi.mock("@/utils/supabase/client", () => ({
  createClient: supabaseMock,
}));

vi.mock("@/app/kurir/pickup/[id]/actions", () => ({
  completePickup: completePickupMock,
  getTicketDebug: getTicketDebugMock,
}));

import PickupPage from "@/app/kurir/pickup/[id]/page";

const catChain = () => ({
  order: () =>
    Promise.resolve({
      data: [
        { id: 1, name: "Plastik Botol", material_group: "plastic", price_per_kg: 2000 },
      ],
      error: null,
    }),
});

const ticketSelect = (status: string) => ({
  eq: () => ({
    single: () =>
      Promise.resolve({
        data: {
          id: "ticket-1",
          short_id: "TEST1234",
          status,
          user_addresses:
            status === "completed"
              ? null
              : [
                  {
                    recipient_name: "Budi",
                    full_address: "Jl. Contoh 1",
                    phone_number: "081234567890",
                  },
                ],
        },
      }),
  }),
});

beforeEach(() => {
  getTicketDebugMock.mockResolvedValue(undefined);
  completePickupMock.mockReset();
  router.push.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("PickupPage success animation", () => {
  it("renders static completed screen on revisit of completed ticket", async () => {
    supabaseMock.mockImplementation(() => ({
      from: (table: string) =>
        table === "tickets"
          ? { select: () => ticketSelect("completed") }
          : { select: () => catChain() },
    }));

    render(<PickupPage />);
    expect(await screen.findByText("Penjemputan Sudah Selesai")).toBeInTheDocument();
    expect(screen.queryByText("Berhasil!")).not.toBeInTheDocument();
  });

  it("shows success animation then button after completing pickup", async () => {
    supabaseMock.mockImplementation(() => ({
      from: (table: string) =>
        table === "tickets"
          ? { select: () => ticketSelect("scheduled") }
          : { select: () => catChain() },
    }));
    completePickupMock.mockResolvedValueOnce(undefined);

    render(<PickupPage />);

    const addButton = await screen.findByText("Tambah ke Daftar");
    fireEvent.change(screen.getByTestId("waste-category"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByPlaceholderText("0.00"), {
      target: { value: "2" },
    });
    fireEvent.click(addButton);
    fireEvent.click(screen.getByText(/Selesaikan & Bayar/i));

    expect(await screen.findByText(/Berhasil!/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Kembali ke Dashboard/i }),
    ).toBeInTheDocument();
  });

  it("navigates to dashboard when button clicked", async () => {
    supabaseMock.mockImplementation(() => ({
      from: (table: string) =>
        table === "tickets"
          ? { select: () => ticketSelect("scheduled") }
          : { select: () => catChain() },
    }));
    completePickupMock.mockResolvedValueOnce(undefined);

    render(<PickupPage />);

    const addButton = await screen.findByText("Tambah ke Daftar");
    fireEvent.change(screen.getByTestId("waste-category"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByPlaceholderText("0.00"), {
      target: { value: "2" },
    });
    fireEvent.click(addButton);
    fireEvent.click(screen.getByText(/Selesaikan & Bayar/i));

    const done = await screen.findByRole("button", {
      name: /Kembali ke Dashboard/i,
    });
    fireEvent.click(done);
    expect(router.push).toHaveBeenCalledWith("/kurir/dashboard");
  });
});