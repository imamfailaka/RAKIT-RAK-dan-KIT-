// @vitest-environment node
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { makeJwt } from "./helpers";

const future = Math.floor(Date.now() / 1000) + 3600;
const req = (path: string, token?: string) =>
  new NextRequest(`http://localhost:3001${path}`, {
    headers: token ? { cookie: `inventori_token=${token}` } : {},
  });
const location = (res: Response) => new URL(res.headers.get("location")!);
const admin = () => makeJwt({ id: "u1", role: "admin", exp: future });
const tech = () => makeJwt({ id: "u2", role: "technician", exp: future });

describe("proxy", () => {
  it("redirects to login with next when there is no cookie", () => {
    const res = proxy(req("/admin/equipment"));
    expect(location(res).pathname).toBe("/auth/login");
    expect(location(res).searchParams.get("next")).toBe("/admin/equipment");
  });
  it("redirects to login when the token is expired", () => {
    const t = makeJwt({ id: "u1", role: "technician", exp: 100 });
    expect(location(proxy(req("/my", t))).pathname).toBe("/auth/login");
  });
  it("redirects to login when the cookie is garbage", () => {
    expect(location(proxy(req("/admin", "garbage"))).pathname).toBe("/auth/login");
  });
  it("sends a technician away from /admin to /my", () => {
    expect(location(proxy(req("/admin/users", tech()))).pathname).toBe("/my");
  });
  it("sends an admin away from /my to /admin", () => {
    expect(location(proxy(req("/my", admin()))).pathname).toBe("/admin");
  });
  it("lets each role into its own area", () => {
    expect(proxy(req("/admin", admin())).headers.get("location")).toBeNull();
    expect(proxy(req("/my", tech())).headers.get("location")).toBeNull();
  });
  it("sends / to the right home for each visitor", () => {
    expect(location(proxy(req("/"))).pathname).toBe("/auth/login");
    expect(location(proxy(req("/", admin()))).pathname).toBe("/admin");
    expect(location(proxy(req("/", tech()))).pathname).toBe("/my");
  });
  it("lets the login page through", () => {
    expect(proxy(req("/auth/login")).headers.get("location")).toBeNull();
  });
});
