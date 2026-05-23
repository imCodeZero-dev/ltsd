import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname:     vi.fn().mockReturnValue("/deals"),
  useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import { usePathname, useSearchParams } from "next/navigation";
import { CategoryMobileStrip } from "@/components/layout/category-mobile-strip";

const mockPathname     = vi.mocked(usePathname);
const mockSearchParams = vi.mocked(useSearchParams);

describe("CategoryMobileStrip — deal type pills", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/deals");
    mockSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("renders all 4 pills", () => {
    render(<CategoryMobileStrip />);
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Lightning")).toBeInTheDocument();
    expect(screen.getByText("Price Drops")).toBeInTheDocument();
    expect(screen.getByText("Limited Time")).toBeInTheDocument();
  });

  it("'All' pill links to /deals", () => {
    render(<CategoryMobileStrip />);
    expect(screen.getByText("All").closest("a")).toHaveAttribute("href", "/deals");
  });

  it("each type pill links to correct URL", () => {
    render(<CategoryMobileStrip />);
    expect(screen.getByText("Lightning").closest("a")).toHaveAttribute("href", "/deals?type=LIGHTNING_DEAL");
    expect(screen.getByText("Price Drops").closest("a")).toHaveAttribute("href", "/deals?type=PRICE_DROP");
    expect(screen.getByText("Limited Time").closest("a")).toHaveAttribute("href", "/deals?type=LIMITED_TIME");
  });

  it("highlights active type pill when on /deals", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("type=PRICE_DROP"));
    render(<CategoryMobileStrip />);
    expect(screen.getByText("Price Drops").closest("a")).toHaveClass("border-badge-bg");
  });

  it("highlights 'All' when on /deals with no type param", () => {
    render(<CategoryMobileStrip />);
    expect(screen.getByText("All").closest("a")).toHaveClass("border-badge-bg");
  });

  it("does not highlight any pill when not on /deals", () => {
    mockPathname.mockReturnValue("/dashboard");
    mockSearchParams.mockReturnValue(new URLSearchParams("type=PRICE_DROP"));
    render(<CategoryMobileStrip />);
    expect(screen.getByText("Price Drops").closest("a")).not.toHaveClass("border-badge-bg");
  });

  it("only one pill is highlighted at a time", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("type=LIGHTNING_DEAL"));
    render(<CategoryMobileStrip />);
    const highlighted = screen
      .getAllByRole("link")
      .filter((el) => el.classList.contains("border-badge-bg"));
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0]).toHaveTextContent("Lightning");
  });
});
