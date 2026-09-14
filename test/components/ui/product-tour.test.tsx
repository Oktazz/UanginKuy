// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Tour, type TourStep } from "@/components/ui/product-tour";

afterEach(cleanup);

const mockSteps: TourStep[] = [
  {
    target: "#step-1",
    title: "Langkah Pertama",
    content: "Konten untuk langkah pertama.",
    placement: "bottom",
  },
  {
    target: "#step-2",
    title: "Langkah Kedua",
    content: "Konten untuk langkah kedua.",
    placement: "top",
  },
];

describe("Product Tour Component", () => {
  it("renders the tour dialog with initial step and navigates to next step", async () => {
    const user = userEvent.setup();
    const handleFinish = vi.fn();
    const handleSkip = vi.fn();

    // Setup dummy target elements in DOM
    const target1 = document.createElement("div");
    target1.id = "step-1";
    document.body.appendChild(target1);

    const target2 = document.createElement("div");
    target2.id = "step-2";
    document.body.appendChild(target2);

    render(
      <Tour
        open={true}
        steps={mockSteps}
        onFinish={handleFinish}
        onSkip={handleSkip}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Langkah Pertama")).toBeInTheDocument();
    expect(screen.getByText("Konten untuk langkah pertama.")).toBeInTheDocument();

    // Click "Lanjut"
    const nextBtn = screen.getByRole("button", { name: /lanjut/i });
    await user.click(nextBtn);

    expect(screen.getByText("Langkah Kedua")).toBeInTheDocument();
    expect(screen.getByText("Konten untuk langkah kedua.")).toBeInTheDocument();

    // Now on last step, button should say "Selesai"
    const doneBtn = screen.getByRole("button", { name: /selesai/i });
    await user.click(doneBtn);

    expect(handleFinish).toHaveBeenCalledTimes(1);

    target1.remove();
    target2.remove();
  });

  it("can navigate back using back button", async () => {
    const user = userEvent.setup();

    render(
      <Tour
        open={true}
        steps={mockSteps}
        nextLabel="Next"
        prevLabel="Back"
        doneLabel="Finish"
      />
    );

    const nextBtn = screen.getByRole("button", { name: /next/i });
    await user.click(nextBtn);

    expect(screen.getByText("Langkah Kedua")).toBeInTheDocument();

    const backBtn = screen.getByRole("button", { name: /back/i });
    await user.click(backBtn);

    expect(screen.getByText("Langkah Pertama")).toBeInTheDocument();
  });

  it("calls onSkip when close button is clicked", async () => {
    const user = userEvent.setup();
    const handleSkip = vi.fn();

    render(
      <Tour
        open={true}
        steps={mockSteps}
        onSkip={handleSkip}
      />
    );

    const closeBtn = screen.getByRole("button", { name: /tutup tur/i });
    await user.click(closeBtn);

    expect(handleSkip).toHaveBeenCalledTimes(1);
  });

  it("calls onSkip when Escape key is pressed", () => {
    const handleSkip = vi.fn();

    render(
      <Tour
        open={true}
        steps={mockSteps}
        onSkip={handleSkip}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleSkip).toHaveBeenCalledTimes(1);
  });

  it("supports custom radius and overlayColor", () => {
    const customSteps: TourStep[] = [
      {
        target: "#custom-target",
        title: "Kustom",
        content: "Konten kustom",
        radius: 9999,
      },
    ];

    const target = document.createElement("div");
    target.id = "custom-target";
    document.body.appendChild(target);

    render(
      <Tour
        open={true}
        steps={customSteps}
        overlayColor="rgba(0, 0, 0, 0.8)"
      />
    );

    expect(screen.getByText("Kustom")).toBeInTheDocument();
    target.remove();
  });
});
