import { describe, it, expect, beforeAll } from "vitest";

process.env.SECRET = "test-secret";
let router: any, signToken: any, verifyToken: any, buildUserPayload: any;

beforeAll(async () => {
  router = (await import("../src/routes/api")).default;
  ({ signToken, verifyToken } = await import("../src/utils/jwt"));
  ({ buildUserPayload } = await import("../src/services/payloads"));
});

type Route = { path: string; method: string; guard?: (req: any, res: any, next: () => void) => void };
const routes = (): Route[] =>
  router.stack
    .filter((l: any) => l.route)
    .flatMap((l: any) =>
      Object.keys(l.route.methods).map((method) => ({
        path: l.route.path,
        method: method.toUpperCase(),
        guard: l.route.stack.map((s: any) => s.handle).find((h: any) => h.name === "roleGuard"),
      })),
    );

/** true bila role lolos guard rute (rute tanpa guard = semua pengguna login / publik). */
function allows(r: Route, role: string): boolean {
  if (!r.guard) return true;
  let ok = false;
  const res: any = { status: () => res, json: () => res };
  r.guard({ user: { id: "U1", role } }, res, () => { ok = true; });
  return ok;
}

const PUBLIC_WRITES = ["/auth/login", "/telegram/webhook", "/traccar"];

describe("role manager (pengawas, lihat saja)", () => {
  it("token dan payload pengguna menerima role manager", () => {
    expect(verifyToken(signToken({ id: "U1", role: "manager" })).role).toBe("manager");
    expect(buildUserPayload({ role: "manager" }).role).toBe("manager");
    expect(buildUserPayload({ role: "superadmin" }).role).toBeUndefined();
  });
  it("manager tidak bisa memakai satu pun rute yang mengubah data", () => {
    const writes = routes().filter((r) => r.method !== "GET" && !PUBLIC_WRITES.includes(r.path));
    expect(writes.length).toBeGreaterThan(5);
    for (const r of writes) expect(allows(r, "manager"), `${r.method} ${r.path}`).toBe(false);
  });
  it("manager boleh melihat pengguna, peta lokasi, peminjaman, alat, dan dashboard", () => {
    const get = (p: string) => routes().find((r) => r.method === "GET" && r.path === p)!;
    for (const p of ["/users", "/locations", "/loans", "/equipment", "/categories", "/dashboard", "/scan/borrowed"]) {
      expect(allows(get(p), "manager"), p).toBe(true);
    }
  });
  it("teknisi tetap tidak bisa melihat daftar pengguna dan peta lokasi", () => {
    const get = (p: string) => routes().find((r) => r.method === "GET" && r.path === p)!;
    expect(allows(get("/users"), "technician")).toBe(false);
    expect(allows(get("/locations"), "technician")).toBe(false);
  });
});
