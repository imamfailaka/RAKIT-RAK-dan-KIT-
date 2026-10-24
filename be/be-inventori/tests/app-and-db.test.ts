import { describe, it, expect, vi } from "vitest";
import type { AddressInfo } from "net";
import express from "express";
import { mountApp } from "../src/create-app";
import { createDbConnector } from "../src/db";

const serve = async (app: express.Express) => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(r)) };
};

describe("createApp", () => {
  it("calls ensureDb before API routes but not before the health route", async () => {
    const ensureDb = vi.fn().mockRejectedValue(new Error("db down"));
    const s = await serve(mountApp(express(), ensureDb));
    const health = await fetch(`${s.url}/`);
    expect(health.status).toBe(200);
    expect(ensureDb).not.toHaveBeenCalled();
    const api = await fetch(`${s.url}/api/auth/me`);
    expect(ensureDb).toHaveBeenCalledTimes(1);
    expect(api.status).toBe(503);
    await s.close();
  });
});

describe("createDbConnector", () => {
  it("connects once for many calls and shares one in-flight attempt", async () => {
    const connect = vi.fn().mockResolvedValue(undefined);
    const ensure = createDbConnector(connect);
    await Promise.all([ensure(), ensure(), ensure()]);
    await ensure();
    expect(connect).toHaveBeenCalledTimes(1);
  });
  it("retries after a failed attempt instead of caching the failure", async () => {
    const connect = vi.fn().mockRejectedValueOnce(new Error("x")).mockResolvedValue(undefined);
    const ensure = createDbConnector(connect);
    await expect(ensure()).rejects.toThrow("x");
    await ensure();
    expect(connect).toHaveBeenCalledTimes(2);
  });
});
