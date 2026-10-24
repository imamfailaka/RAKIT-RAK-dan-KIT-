import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (name: string) => readFileSync(path.join(__dirname, "..", "app", name), "utf8");
const token = (css: string, name: string) => {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --color-${name} tidak ditemukan di globals.css`);
  return m[1].toLowerCase();
};

describe("icon.svg", () => {
  const svg = read("icon.svg").toLowerCase();
  const css = read("globals.css");

  it.each(["canvas", "ink", "accent"])("memakai warna token %s dari globals.css", (name) => {
    expect(svg).toContain(token(css, name));
  });

  it("berupa SVG 64x64 tanpa skrip", () => {
    expect(svg).toContain('viewbox="0 0 64 64"');
    expect(svg).not.toContain("<script");
  });
});
