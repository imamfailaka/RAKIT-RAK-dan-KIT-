import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BRAND } from "@/lib/brand";
import Wordmark from "@/components/Wordmark";

describe("Wordmark", () => {
  it("pembaca layar mendapat satu kata utuh sama dengan nama aplikasi", () => {
    const { getByText } = render(<Wordmark />);
    expect(getByText(BRAND.app, { selector: ".sr-only" })).toBeInTheDocument();
  });

  it("potongan berwarna tersembunyi dari pembaca layar dan gabungannya sama dengan nama", () => {
    const { container } = render(<Wordmark />);
    const visual = container.querySelector("[aria-hidden='true']");
    expect(visual).not.toBeNull();
    expect(visual?.textContent).toBe(BRAND.app);
  });

  it("bagian lead memakai text-ink dan bagian accent memakai text-accent", () => {
    const { getByText } = render(<Wordmark />);
    expect(getByText(BRAND.wordmark.lead)).toHaveClass("text-ink");
    expect(getByText(BRAND.wordmark.accent)).toHaveClass("text-accent");
  });

  it("meneruskan className ke elemen akar", () => {
    const { container } = render(<Wordmark className="truncate" />);
    expect(container.firstElementChild).toHaveClass("truncate", "uppercase");
  });
});
