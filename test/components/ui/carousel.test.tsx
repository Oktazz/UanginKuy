// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NewsCarousel, type NewsCarouselItem } from "@/components/ui/carousel";

afterEach(cleanup);

const items: NewsCarouselItem[] = [
  {
    id: "hutan",
    title: "Menjaga hutan untuk masa depan",
    summary: "Cerita terbaru tentang upaya masyarakat merawat lingkungan.",
    publishedAt: "5 Agustus 2026",
    imageSrc: "https://example.com/hutan.jpg",
    href: "https://example.com/hutan",
    source: "Mongabay Indonesia",
    isNew: true,
  },
  {
    id: "laut",
    title: "Aksi bersama membersihkan laut",
    summary: "Gerakan sederhana yang memberi dampak nyata.",
    publishedAt: "4 Agustus 2026",
    imageSrc: "https://example.com/laut.jpg",
    href: "https://example.com/laut",
  },
];

describe("NewsCarousel", () => {
  it("renders news as safe external article links", () => {
    render(<NewsCarousel items={items} />);

    expect(screen.getByRole("heading", { name: "Kabar Lingkungan" })).toBeInTheDocument();
    expect(screen.getByText("Menjaga hutan untuk masa depan")).toBeInTheDocument();
    expect(screen.getByText("Terbaru")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Menjaga hutan/i })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });

  it("does not render an empty carousel", () => {
    const { container } = render(<NewsCarousel items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("scrolls the track and updates navigation availability", () => {
    render(<NewsCarousel items={items} />);

    const track = screen.getByTestId("news-carousel-track");
    Object.defineProperties(track, {
      clientWidth: { configurable: true, value: 500 },
      scrollWidth: { configurable: true, value: 1200 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });
    const scrollBy = vi.fn();
    Object.defineProperty(track, "scrollBy", { configurable: true, value: scrollBy });
    fireEvent.scroll(track);

    expect(screen.getByRole("button", { name: "Geser ke kiri" })).toBeDisabled();
    const nextButton = screen.getByRole("button", { name: "Geser ke kanan" });
    expect(nextButton).toBeEnabled();
    fireEvent.click(nextButton);
    expect(scrollBy).toHaveBeenCalledWith({ left: 400, behavior: "smooth" });

    Object.defineProperty(track, "scrollLeft", { configurable: true, value: 700 });
    fireEvent.scroll(track);
    expect(screen.getByRole("button", { name: "Geser ke kiri" })).toBeEnabled();
    expect(nextButton).toBeDisabled();
  });
});
