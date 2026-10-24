import { describe, it, expect } from "vitest";
import { buildUserPayload } from "../src/services/payloads";

describe("buildUserPayload", () => {
  it("keeps only the allowed fields", () => {
    const p = buildUserPayload({ name: "Budi", email: "b@x.id", password: "Abc12345", role: "technician", isActive: true, _id: "x", isAdmin: true, createdAt: "z" });
    expect(Object.keys(p).sort()).toEqual(["email", "isActive", "name", "password", "role"]);
  });
  it("does not let an unknown role through", () => {
    expect(buildUserPayload({ role: "superuser" }).role).toBeUndefined();
  });
});
