import { describe, it, expect, vi, beforeEach } from "vitest";
import LoanModel from "../src/models/loan.model";
import loanController from "../src/controllers/loan.controller";
import dashboardController from "../src/controllers/dashboard.controller";

const OTHER = "507f1f77bcf86cd799439011";
const chain = (rows: unknown[] = []) => {
  const c: any = {};
  for (const m of ["populate", "sort", "skip", "limit", "select"]) c[m] = () => c;
  c.lean = async () => rows;
  return c;
};
const res = () => { const r: any = {}; r.status = () => r; r.json = () => r; return r; };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const firstArg = (spy: any) => spy.mock.calls[0][0];
const tech = { id: "T1", role: "technician" as const };
const admin = { id: "A1", role: "admin" as const };

beforeEach(() => vi.restoreAllMocks());

describe("technicians only ever see their own data", () => {
  it("GET /loans ignores ?technician= for a technician", async () => {
    const find = vi.spyOn(LoanModel, "find").mockReturnValue(chain() as never);
    vi.spyOn(LoanModel, "countDocuments").mockResolvedValue(0 as never);
    await loanController.findAll({ user: tech, query: { technician: OTHER } } as never, res());
    expect(firstArg(find)).toMatchObject({ technician: "T1" });
  });
  it("GET /loans lets an admin filter by technician", async () => {
    const find = vi.spyOn(LoanModel, "find").mockReturnValue(chain() as never);
    vi.spyOn(LoanModel, "countDocuments").mockResolvedValue(0 as never);
    await loanController.findAll({ user: admin, query: { technician: OTHER } } as never, res());
    expect(firstArg(find)).toMatchObject({ technician: OTHER });
  });
  it("GET /loans/mine is always the caller's, even for an admin", async () => {
    const find = vi.spyOn(LoanModel, "find").mockReturnValue(chain() as never);
    vi.spyOn(LoanModel, "countDocuments").mockResolvedValue(0 as never);
    await loanController.mine({ user: admin, query: { technician: OTHER } } as never, res());
    expect(firstArg(find)).toMatchObject({ technician: "A1" });
  });
  it("GET /dashboard for a technician queries only their open loans", async () => {
    const find = vi.spyOn(LoanModel, "find").mockReturnValue(chain() as never);
    await dashboardController.get({ user: tech, query: {} } as never, res());
    expect(firstArg(find)).toEqual({ returnedAt: null, technician: "T1" });
  });
});
