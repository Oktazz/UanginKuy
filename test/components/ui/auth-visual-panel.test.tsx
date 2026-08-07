// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AuthVisualPanel } from "@/components/ui/auth-visual-panel";

afterEach(cleanup);

describe("AuthVisualPanel", () => {
  it("marks the login aside to enter from its right-hand edge", () => {
    render(<AuthVisualPanel variant="login" />);

    expect(screen.getByRole("complementary")).toHaveAttribute(
      "data-auth-aside",
      "login",
    );
  });

  it("marks the mirrored register aside to enter from its left-hand edge", () => {
    render(<AuthVisualPanel variant="register" />);

    expect(screen.getByRole("complementary")).toHaveAttribute(
      "data-auth-aside",
      "register",
    );
  });

  it.each(["login", "register"] as const)(
    "exposes both %s visual cards for the staggered entrance",
    (variant) => {
      const { container } = render(<AuthVisualPanel variant={variant} />);

      expect(
        container.querySelector('[data-auth-card="primary"]'),
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-auth-card="secondary"]'),
      ).toBeInTheDocument();
    },
  );
});
