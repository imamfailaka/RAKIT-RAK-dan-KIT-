import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Badge from "@/components/Badge";

describe("Badge", () => {
  it("shows its text and exposes the tone, so colour is never the only signal", () => {
    render(<Badge tone="danger">Rusak</Badge>);
    const el = screen.getByText("Rusak");
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("data-tone", "danger");
  });
  it("falls back to neutral when no tone is given", () => {
    render(<Badge>Aktif</Badge>);
    expect(screen.getByText("Aktif")).toHaveAttribute("data-tone", "neutral");
  });
});
