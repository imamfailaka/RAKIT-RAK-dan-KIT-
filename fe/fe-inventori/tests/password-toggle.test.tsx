import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Input from "@/components/Input";

describe("Input password dengan ikon mata", () => {
  it("menyembunyikan password secara default dan menampilkannya saat ikon mata diklik", () => {
    render(<Input label="Password" name="password" type="password" />);
    const field = screen.getByLabelText("Password") as HTMLInputElement;
    expect(field.type).toBe("password");

    const toggle = screen.getByRole("button", { name: "Tampilkan password" });
    fireEvent.click(toggle);
    expect(field.type).toBe("text");
    expect(screen.getByRole("button", { name: "Sembunyikan password" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Sembunyikan password" }));
    expect(field.type).toBe("password");
  });

  it("tidak menampilkan ikon mata pada input selain password", () => {
    render(<Input label="Email" name="email" type="email" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
