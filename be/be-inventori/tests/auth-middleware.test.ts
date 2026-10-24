import { describe, it, expect, beforeAll } from "vitest";
import jwt from "jsonwebtoken";

process.env.SECRET = "test-secret";
let makeAuthMiddleware: any, requireRole: any, signToken: any;
let dbUser: { role: string; isActive: boolean } | null = { role: "admin", isActive: true };
let authMiddleware: any;

beforeAll(async () => {
  ({ makeAuthMiddleware } = await import("../src/middlewares/auth"));
  authMiddleware = makeAuthMiddleware(async () => dbUser);
  ({ requireRole } = await import("../src/middlewares/role"));
  ({ signToken } = await import("../src/utils/jwt"));
});

const run = async (mw: any, req: any) => {
  const out: any = { status: 0, nextCalled: false };
  const res: any = {
    status(c: number) { out.status = c; return res; },
    json(b: any) { out.body = b; return res; },
  };
  await mw(req, res, () => { out.nextCalled = true; });
  return out;
};
const bearer = (t?: string) => ({ headers: t ? { authorization: `Bearer ${t}` } : {} });

describe("authMiddleware", () => {
  it("returns 403 when the token is missing", async () => {
    const o = await run(authMiddleware, bearer());
    expect(o.status).toBe(403);
    expect(o.nextCalled).toBe(false);
  });
  it("returns 403, not an exception, for a garbage token", async () => {
    expect((await run(authMiddleware, bearer("abc.def.ghi"))).status).toBe(403);
  });
  it("returns 403 for an expired token", async () => {
    const t = jwt.sign({ id: "u1", role: "admin" }, "test-secret", { expiresIn: -10 });
    expect((await run(authMiddleware, bearer(t))).status).toBe(403);
  });
  it("returns 403 for a token signed with another secret", async () => {
    const t = jwt.sign({ id: "u1", role: "admin" }, "other", { expiresIn: 60 });
    expect((await run(authMiddleware, bearer(t))).status).toBe(403);
  });
  it("passes a valid token and attaches the user", async () => {
    dbUser = { role: "technician", isActive: true };
    const req: any = bearer(signToken({ id: "u1", role: "technician" }));
    const o = await run(authMiddleware, req);
    expect(o.nextCalled).toBe(true);
    expect(req.user).toMatchObject({ id: "u1", role: "technician" });
  });
  it("rejects a valid token whose account was deactivated since login", async () => {
    dbUser = { role: "technician", isActive: false };
    const o = await run(authMiddleware, bearer(signToken({ id: "u1", role: "technician" })));
    expect(o.status).toBe(403);
    expect(o.nextCalled).toBe(false);
  });
  it("rejects a valid token whose account no longer exists", async () => {
    dbUser = null;
    expect((await run(authMiddleware, bearer(signToken({ id: "u1", role: "admin" })))).status).toBe(403);
  });
  it("uses the role stored in the database, so a demoted admin loses admin rights at once", async () => {
    dbUser = { role: "technician", isActive: true };
    const req: any = bearer(signToken({ id: "u1", role: "admin" }));
    await run(authMiddleware, req);
    expect(req.user.role).toBe("technician");
    expect((await run(requireRole("admin"), req)).status).toBe(403);
  });
});

describe("requireRole", () => {
  it("returns 403 for a technician on an admin-only route", async () => {
    const o = await run(requireRole("admin"), { user: { id: "u1", role: "technician" } });
    expect(o.status).toBe(403);
    expect(o.nextCalled).toBe(false);
  });
  it("lets an admin through", async () => {
    expect((await run(requireRole("admin"), { user: { id: "u1", role: "admin" } })).nextCalled).toBe(true);
  });
});
