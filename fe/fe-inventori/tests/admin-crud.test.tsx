import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DataTable from "@/components/DataTable";
import { makeCrud } from "@/lib/crud";
import { setToken } from "@/lib/auth";

type Row = { _id: string; name: string };
const columns = [{ header: "Nama", render: (r: Row) => r.name }];

describe("DataTable", () => {
  it("renders rows", () => {
    render(<DataTable columns={columns} rows={[{ _id: "1", name: "Kabel" }]} status="ready" />);
    expect(screen.getByText("Kabel")).toBeInTheDocument();
  });
  it("shows the empty state", () => {
    render(<DataTable columns={columns} rows={[]} status="ready" />);
    expect(screen.getByText(/belum ada data/i)).toBeInTheDocument();
  });
  it("shows a retry button on failure", async () => {
    const onRetry = vi.fn();
    render(<DataTable columns={columns} rows={[]} status="error" errorMessage="Gagal" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button", { name: /coba lagi/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
  it("asks for confirmation before deleting", async () => {
    const onDelete = vi.fn();
    const row = { _id: "1", name: "Kabel" };
    render(<DataTable columns={columns} rows={[row]} status="ready" onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: /hapus/i }));
    expect(onDelete).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: /ya, hapus/i }));
    expect(onDelete).toHaveBeenCalledWith(row);
  });
});

describe("makeCrud", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.NEXT_PUBLIC_API_URL = "http://api.test/api";
    setToken("tok");
  });
  it("sends DELETE with the Bearer token", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ meta: { status: 200, message: "ok" }, data: {} }))),
    );
    await makeCrud<Row, Row>("/categories").remove("abc");
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.test/api/categories/abc");
    expect(init.method).toBe("DELETE");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });
  it("sends POST with a JSON body on create", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ meta: { status: 200, message: "ok" }, data: {} }))),
    );
    await makeCrud<Row, { name: string }>("/categories").create({ name: "x" });
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "x" }));
  });
});
