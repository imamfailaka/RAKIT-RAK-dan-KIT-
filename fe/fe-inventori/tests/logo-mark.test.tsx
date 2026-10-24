import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LogoMark from "@/components/LogoMark";

describe("LogoMark", () => {
  it("dekoratif dan bertanda data-logo-mark", () => {
    const { container } = render(<LogoMark />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("data-logo-mark");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("memakai ukuran dari prop, default 36", () => {
    const { container, rerender } = render(<LogoMark />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "36");
    expect(container.querySelector("svg")).toHaveAttribute("height", "36");
    rerender(<LogoMark size={72} />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "72");
    expect(container.querySelector("svg")).toHaveAttribute("height", "72");
  });

  it("tidak memakai warna mentah", () => {
    const { container } = render(<LogoMark />);
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it("berbentuk rak: 1 garis dan 5 persegi (bingkai + 4 blok)", () => {
    const { container } = render(<LogoMark />);
    expect(container.querySelectorAll("line")).toHaveLength(1);
    expect(container.querySelectorAll("rect")).toHaveLength(5);
  });
});
