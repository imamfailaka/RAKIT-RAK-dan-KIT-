import { describe, it, expect, vi } from "vitest";
import { deleteUser, type UserDeleteStore } from "../src/services/user-delete";

function store(over: Partial<UserDeleteStore> = {}): UserDeleteStore {
  return {
    exists: vi.fn(async () => true),
    hasActiveLoan: vi.fn(async () => false),
    remove: vi.fn(async () => {}),
    ...over,
  };
}

describe("deleteUser (hapus akun permanen)", () => {
  it("menghapus akun yang tidak memegang alat", async () => {
    const s = store();
    expect(await deleteUser(s, "ADMIN", "T1")).toBe("deleted");
    expect(s.remove).toHaveBeenCalledWith("T1");
  });
  it("menolak menghapus akun sendiri", async () => {
    const s = store();
    expect(await deleteUser(s, "A1", "A1")).toBe("self");
    expect(s.remove).not.toHaveBeenCalled();
  });
  it("menolak bila akun masih memegang alat", async () => {
    const s = store({ hasActiveLoan: vi.fn(async () => true) });
    expect(await deleteUser(s, "ADMIN", "T1")).toBe("has_active_loan");
    expect(s.remove).not.toHaveBeenCalled();
  });
  it("melapor not_found bila akun tidak ada", async () => {
    const s = store({ exists: vi.fn(async () => false) });
    expect(await deleteUser(s, "ADMIN", "X")).toBe("not_found");
    expect(s.remove).not.toHaveBeenCalled();
  });
});
