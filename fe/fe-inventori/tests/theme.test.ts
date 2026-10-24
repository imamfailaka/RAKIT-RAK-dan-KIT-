import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("app/globals.css", "utf8");

describe("tema Malam", () => {
  it.each([
    "--color-canvas",
    "--color-surface",
    "--color-surface-alt",
    "--color-line",
    "--color-ink",
    "--color-muted",
    "--color-accent",
    "--color-accent-ink",
    "--color-danger-bg",
    "--color-danger-ink",
    "--color-warn-bg",
    "--color-warn-ink",
    "--color-info-bg",
    "--color-info-ink",
    "--color-ok-bg",
    "--color-ok-ink",
  ])("mendefinisikan token %s", (token) => {
    expect(css).toMatch(new RegExp(`${token}:\\s*#[0-9a-fA-F]{6}`));
  });

  it("tidak memakai hitam atau putih murni sebagai nilai token", () => {
    const values = [...css.matchAll(/--color-[a-z-]+:\s*(#[0-9a-fA-F]{6})/g)].map((m) => m[1].toLowerCase());
    expect(values).not.toContain("#000000");
    expect(values).not.toContain("#ffffff");
  });

  it("memakai skema warna gelap", () => {
    expect(css).toMatch(/color-scheme:\s*dark/);
  });
});
