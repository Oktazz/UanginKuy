// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({
  prefetch: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
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

import {
  AuthTransitionLink,
  AuthTransitionSurface,
} from "@/components/ui/auth-transition";

beforeEach(() => {
  vi.useFakeTimers();
  router.prefetch.mockReset();
  router.push.mockReset();
  document.documentElement.removeAttribute("data-auth-enter");
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute("data-auth-enter");
});

function renderTransition(direction: "forward" | "backward" = "forward") {
  render(
    <AuthTransitionSurface className="auth-test-page">
      <aside data-auth-aside="login" />
      <AuthTransitionLink
        href={direction === "forward" ? "/register" : "/login"}
        direction={direction}
      >
        Pindah halaman
      </AuthTransitionLink>
    </AuthTransitionSurface>,
  );
}

describe("auth route transition", () => {
  it("consumes the destination entry marker after the first painted frame", () => {
    document.documentElement.dataset.authEnter = "forward";
    renderTransition();

    expect(document.documentElement).toHaveAttribute(
      "data-auth-enter",
      "forward",
    );
    expect(screen.getByRole("complementary")).toHaveAttribute(
      "data-auth-aside-skip",
    );
    vi.runAllTimers();
    expect(document.documentElement).not.toHaveAttribute("data-auth-enter");
  });

  it("prefetches and performs a directional pointer transition", () => {
    renderTransition("forward");

    expect(router.prefetch).toHaveBeenCalledWith("/register");
    const page = screen.getByTestId("auth-transition-surface");
    fireEvent.click(screen.getByRole("link"), { detail: 1 });

    expect(page).toHaveAttribute("data-auth-leaving", "forward");
    expect(router.push).not.toHaveBeenCalled();

    vi.advanceTimersByTime(160);
    expect(document.documentElement).toHaveAttribute(
      "data-auth-enter",
      "forward",
    );
    expect(router.push).toHaveBeenCalledWith("/register");
  });

  it("uses the opposite direction when returning to login", () => {
    renderTransition("backward");
    fireEvent.click(screen.getByRole("link"), { detail: 1 });

    expect(screen.getByTestId("auth-transition-surface")).toHaveAttribute(
      "data-auth-leaving",
      "backward",
    );
    vi.advanceTimersByTime(160);
    expect(router.push).toHaveBeenCalledWith("/login");
  });

  it("ignores repeated clicks while navigation is already in progress", () => {
    renderTransition();
    const link = screen.getByRole("link");
    fireEvent.click(link, { detail: 1 });
    const repeatedClick = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      detail: 1,
    });

    link.dispatchEvent(repeatedClick);
    vi.advanceTimersByTime(160);

    expect(repeatedClick.defaultPrevented).toBe(true);
    expect(router.push).toHaveBeenCalledTimes(1);
  });

  it("does not delay keyboard navigation", () => {
    renderTransition();
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      detail: 0,
    });

    screen.getByRole("link").dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(
      screen.getByTestId("auth-transition-surface"),
    ).not.toHaveAttribute("data-auth-leaving");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("skips motion when reduced motion is requested", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true }),
    );
    renderTransition();
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      detail: 1,
    });

    screen.getByRole("link").dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(
      screen.getByTestId("auth-transition-surface"),
    ).not.toHaveAttribute("data-auth-leaving");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("preserves modified clicks for opening a new tab", () => {
    renderTransition();
    fireEvent.click(screen.getByRole("link"), {
      detail: 1,
      ctrlKey: true,
    });

    expect(
      screen.getByTestId("auth-transition-surface"),
    ).not.toHaveAttribute("data-auth-leaving");
    expect(router.push).not.toHaveBeenCalled();
  });
});
