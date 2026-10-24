import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import LoginShell from "@/components/LoginShell";

describe("LoginShell", () => {
  it("merender anak (formulir) dan panel sorotan", () => {
    render(
      <LoginShell>
        <form aria-label="Masuk" />
      </LoginShell>,
    );
    expect(screen.getByRole("form", { name: "Masuk" })).toBeInTheDocument();
    expect(screen.getByTestId("login-showcase")).toBeInTheDocument();
  });

  it("formulir mendahului panel sorotan di DOM", () => {
    render(
      <LoginShell>
        <form aria-label="Masuk" />
      </LoginShell>,
    );
    const form = screen.getByRole("form", { name: "Masuk" });
    const showcase = screen.getByTestId("login-showcase");
    expect(form.compareDocumentPosition(showcase) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("panel sorotan hanya tampil di layar lebar dan merek ringkas hanya di bawahnya", () => {
    const { container } = render(
      <LoginShell>
        <form aria-label="Masuk" />
      </LoginShell>,
    );
    expect(screen.getByTestId("login-showcase").parentElement).toHaveClass("hidden", "lg:flex", "lg:order-first");
    expect(container.querySelector("a[href='/']")?.parentElement).toHaveClass("lg:hidden");
  });
});
