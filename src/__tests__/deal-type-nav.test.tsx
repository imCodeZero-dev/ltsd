import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname:     vi.fn().mockReturnValue("/deals"),
  useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, onClick, className }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} onClick={onClick} className={className}>{children}</a>
  ),
}));

import { usePathname, useSearchParams } from "next/navigation";
import { CategoryNavDropdown } from "@/components/layout/category-nav-dropdown";

const mockPathname     = vi.mocked(usePathname);
const mockSearchParams = vi.mocked(useSearchParams);

describe("CategoryNavDropdown — deal type nav", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/deals");
    mockSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("renders 'Deals' as button label when no type is selected", () => {
    render(<CategoryNavDropdown />);
    expect(screen.getByRole("button", { name: /^Deals/i })).toBeInTheDocument();
  });

  it("shows active type name in button when on /deals with type param", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("type=PRICE_DROP"));
    render(<CategoryNavDropdown />);
    expect(screen.getByRole("button", { name: /^Price Drops/i })).toBeInTheDocument();
  });

  it("shows 'Deals' button when type param set but not on /deals", () => {
    mockPathname.mockReturnValue("/dashboard");
    mockSearchParams.mockReturnValue(new URLSearchParams("type=PRICE_DROP"));
    render(<CategoryNavDropdown />);
    expect(screen.getByRole("button", { name: /^Deals/i })).toBeInTheDocument();
  });

  it("dropdown is hidden before button click", () => {
    render(<CategoryNavDropdown />);
    // The dropdown panel links should not exist yet — button just shows "Deals"
    expect(screen.queryByRole("link", { name: "All Deals" })).not.toBeInTheDocument();
  });

  it("opens dropdown and shows all 4 options on button click", () => {
    render(<CategoryNavDropdown />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("link", { name: "All Deals" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lightning Deals" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Price Drops" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Limited Time" })).toBeInTheDocument();
  });

  it("closes dropdown when an option is clicked", () => {
    render(<CategoryNavDropdown />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("link", { name: "Lightning Deals" }));
    expect(screen.queryByRole("link", { name: "All Deals" })).not.toBeInTheDocument();
  });

  it("each type option links to the correct URL", () => {
    render(<CategoryNavDropdown />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("link", { name: "Lightning Deals" })).toHaveAttribute("href", "/deals?type=LIGHTNING_DEAL");
    expect(screen.getByRole("link", { name: "Price Drops" })).toHaveAttribute("href", "/deals?type=PRICE_DROP");
    expect(screen.getByRole("link", { name: "Limited Time" })).toHaveAttribute("href", "/deals?type=LIMITED_TIME");
  });

  it("'All Deals' option links to /deals without params", () => {
    render(<CategoryNavDropdown />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("link", { name: "All Deals" })).toHaveAttribute("href", "/deals");
  });

  it("applies active highlight class to the current type", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("type=LIGHTNING_DEAL"));
    render(<CategoryNavDropdown />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("link", { name: "Lightning Deals" })).toHaveClass("bg-badge-tint");
  });

  it("closes dropdown on outside click", () => {
    render(<CategoryNavDropdown />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("link", { name: "All Deals" })).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("link", { name: "All Deals" })).not.toBeInTheDocument();
  });
});
