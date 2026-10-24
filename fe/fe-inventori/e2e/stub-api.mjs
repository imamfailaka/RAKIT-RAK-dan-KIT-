// Minimal stateful stand-in for be-inventori, used only by the browser smoke test.
import http from "node:http";

const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (id, role) => `${enc({ alg: "HS256" })}.${enc({ id, role, exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
const env = (data, extra = {}, status = 200, message = "ok") => ({ status, body: { meta: { status, message }, data, ...extra } });
const pg = (n) => ({ pagination: { current: 1, total: n, totalPages: 1 } });

const cat = { _id: "c1", name: "OTDR" };
const equipment = [
  { _id: "E1", serial: "OTDR-001", name: "OTDR", category: cat, location: "Gudang A", condition: "good", status: "available", nextCalibration: "2026-11-01T00:00:00Z" },
  { _id: "E2", serial: "SPL-777", name: "Fusion Splicer", category: null, location: "", condition: "good", status: "available" },
];
const technicians = [{ _id: "T1", name: "Budi", email: "tech@x.id", role: "technician", isActive: true }];
let loans = [];
let n = 0;

const loanView = (l) => ({ ...l, equipment: equipment.find((e) => e._id === l.equipmentId) ?? null, technician: technicians.find((t) => t._id === l.technicianId) ?? null });

function handle(method, path, query, body, auth) {
  if (method === "POST" && path === "/api/auth/login") {
    if (body.email === "admin@x.id") return env(jwt("A1", "admin"));
    if (body.email === "tech@x.id") return env(jwt("T1", "technician"));
    return env({ password: "Email atau password salah" }, {}, 400, "failed to login");
  }
  if (!auth) return env(null, {}, 403, "unauthorized");
  const role = JSON.parse(Buffer.from(auth.split(".")[1], "base64url").toString()).role;
  if (method === "GET" && path === "/api/dashboard") {
    return env({
      equipmentByStatus: { available: equipment.filter((e) => e.status === "available").length, borrowed: equipment.filter((e) => e.status === "borrowed").length },
      equipmentByCondition: { good: 2, broken: 0, repair: 0 },
      activeLoans: loans.filter((l) => !l.returnedAt).length,
      overdueLoansCount: 0, overdueLoans: [], calibrationDueCount: 1,
      calibrationDue: [{ _id: "E1", name: "OTDR", serial: "OTDR-001", nextCalibration: "2026-11-01T00:00:00Z" }],
      equipmentByCategory: [{ name: "OTDR", count: 1 }], overdueDays: 7,
    });
  }
  if (method === "GET" && path === "/api/equipment") {
    const list = query.get("status") === "available" ? equipment : equipment;
    return env(list, pg(list.length));
  }
  if (method === "GET" && path === "/api/categories") return env([cat]);
  if (method === "GET" && path === "/api/users") return env(technicians, pg(1));
  if (method === "GET" && path === "/api/loans/mine") {
    const mine = loans.filter((l) => l.technicianId === "T1").map(loanView);
    return env(mine, pg(mine.length));
  }
  if (method === "GET" && path === "/api/loans") {
    const list = loans.filter((l) => query.get("open") !== "true" || !l.returnedAt).map(loanView);
    return env(list, pg(list.length));
  }
  if (method === "POST" && path === "/api/loans") {
    if (role !== "admin") return env(null, {}, 403, "forbidden");
    const e = equipment.find((x) => x._id === body.equipment);
    if (!e || e.status === "borrowed") return env(null, {}, 409, "equipment is already borrowed");
    e.status = "borrowed";
    const loan = { _id: `L${++n}`, equipmentId: e._id, technicianId: body.technician, borrowedAt: new Date().toISOString(), returnedAt: null };
    loans.push(loan);
    return env(loanView(loan), {}, 201);
  }
  const ret = path.match(/^\/api\/loans\/(.+)\/return$/);
  if (method === "POST" && ret) {
    const loan = loans.find((l) => l._id === ret[1]);
    if (!loan) return env(null, {}, 404, "loan not found");
    if (loan.returnedAt) return env(null, {}, 409, "this loan has already been returned");
    loan.returnedAt = new Date().toISOString();
    loan.returnCondition = body.returnCondition;
    const e = equipment.find((x) => x._id === loan.equipmentId);
    e.status = "available";
    e.condition = body.returnCondition;
    return env(loanView(loan));
  }
  if (method === "GET" && path === "/api/scan/category/c1") {
    const items = equipment.map((e) => {
      const loan = loans.find((l) => l.equipmentId === e._id && !l.returnedAt);
      const mine = !!loan && loan.technicianId === "T1";
      const action = role !== "technician" ? "view" : e.status === "borrowed" ? (mine ? "return" : "locked") : e.condition === "good" ? "borrow" : "locked";
      return { id: e._id, serial: e.serial, name: e.name, status: e.status, condition: e.condition, mine, action, borrower: loan ? "Budi" : undefined, borrowedAt: loan?.borrowedAt };
    });
    return env({ category: { id: "c1", name: "OTDR" }, items });
  }
  const sc = path.match(/^\/api\/scan\/(.+)\/(borrow|return)$/);
  if (method === "POST" && sc) {
    const e = equipment.find((x) => x.serial === decodeURIComponent(sc[1]));
    if (!e) return env(null, {}, 404, "equipment not found");
    if (sc[2] === "borrow") {
      if (e.status === "borrowed") return env(null, {}, 409, "equipment is already borrowed");
      e.status = "borrowed";
      loans.push({ _id: `L${++n}`, equipmentId: e._id, technicianId: "T1", borrowedAt: new Date().toISOString(), returnedAt: null });
      return env({ id: `L${n}` }, {}, 201);
    }
    const loan = loans.find((l) => l.equipmentId === e._id && !l.returnedAt);
    if (!loan) return env(null, {}, 409, "there is no active loan for this equipment");
    loan.returnedAt = new Date().toISOString();
    e.status = "available";
    e.condition = body.returnCondition;
    return env({ id: loan._id });
  }
  return env(null, {}, 404, "not found");
}

http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3001");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, "http://x");
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const auth = (req.headers.authorization || "").replace("Bearer ", "");
    const { status, body } = handle(req.method, url.pathname, url.searchParams, raw ? JSON.parse(raw) : {}, auth);
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  });
}).listen(3000, () => console.log("stub on 3000"));
