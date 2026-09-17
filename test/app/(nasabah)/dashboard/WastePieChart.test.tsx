// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockPie = vi.fn();
vi.mock("react-chartjs-2", () => ({
  Pie: (props: unknown) => {
    mockPie(props);
    return <div data-testid="mock-pie-chart" />;
  },
}));

import { WastePieChart } from "@/app/(nasabah)/dashboard/_components/WastePieChart";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("WastePieChart component", () => {
  it("renders empty state when data is empty", () => {
    render(<WastePieChart data={[]} />);
    expect(screen.getByText("Belum ada data setoran.")).toBeInTheDocument();
  });

  it("renders chart with maintainAspectRatio: false and proper container", () => {
    const mockData = [
      { label: "Plastik", value: 10, color: "#22C55E" },
      { label: "Kertas", value: 5, color: "#F59E0B" },
    ];

    const { container } = render(<WastePieChart data={mockData} />);

    expect(screen.getByTestId("mock-pie-chart")).toBeInTheDocument();
    expect(mockPie).toHaveBeenCalledTimes(1);

    const callArgs = mockPie.mock.calls[0][0] as {
      options: { responsive: boolean; maintainAspectRatio: boolean };
      data: { labels: string[]; datasets: { data: number[] }[] };
    };

    expect(callArgs.options.responsive).toBe(true);
    expect(callArgs.options.maintainAspectRatio).toBe(false);
    expect(callArgs.data.labels).toEqual(["Plastik", "Kertas"]);
    expect(callArgs.data.datasets[0].data).toEqual([10, 5]);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("flex", "flex-col", "lg:flex-row");

    // Breakdown list checks
    expect(screen.getByText("Plastik")).toBeInTheDocument();
    expect(screen.getByText("Kertas")).toBeInTheDocument();
    expect(screen.getByText("66.7%")).toBeInTheDocument();
    expect(screen.getByText("33.3%")).toBeInTheDocument();
  });
});
