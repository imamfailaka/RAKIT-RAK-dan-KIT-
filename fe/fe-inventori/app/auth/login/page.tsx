"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useToast } from "@/components/Toast";
import LoginShell from "@/components/LoginShell";
import { decodeToken, setToken } from "@/lib/auth";
import { safeNext } from "@/lib/redirect";
import { normalizeError } from "@/lib/errors";
import { login } from "@/services/auth";

function LoginForm() {
  const params = useSearchParams();
  const notify = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    setError(undefined);
    try {
      const token = await login(String(form.get("email")), String(form.get("password")));
      setToken(token);
      const target = safeNext(params.get("next"), decodeToken(token)?.role);
      // Hard navigation so the proxy sees the new cookie and no cached redirect is reused.
      window.location.assign(new URL(target, window.location.origin).toString());
    } catch (err) {
      const n = normalizeError(err);
      if (n.kind === "session") setError("Akun tidak aktif. Hubungi admin gudang.");
      else if (n.kind === "validation" && n.fields) setError(Object.values(n.fields)[0]);
      else notify(n.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input label="Email" name="email" type="email" required autoComplete="username" />
      <Input label="Password" name="password" type="password" required autoComplete="current-password" />
      {error && <p role="alert" className="text-sm text-danger-ink">{error}</p>}
      <Button type="submit" loading={loading}>Masuk</Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <LoginShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold">Masuk</h1>
          <p className="text-sm text-muted">Pantau peminjaman alat teknisi dari satu tempat.</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </LoginShell>
  );
}
