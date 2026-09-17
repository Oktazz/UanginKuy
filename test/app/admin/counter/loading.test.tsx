// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import CounterLoading from "@/app/admin/counter/loading";

afterEach(cleanup);

describe("CounterLoading Component", () => {
  it("renders the skeleton loading layout for the loket bank sampah page", () => {
    const { container } = render(<CounterLoading />);

    // Top-level container
    expect(container.firstChild).toHaveClass("space-y-6", "max-w-6xl", "animate-in");

    // Check header exists with animated pulses
    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();

    // Check sections exist
    const sections = container.querySelectorAll("section");
    expect(sections).toHaveLength(3);

    // Check pulse skeleton elements
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(15);
  });
});
