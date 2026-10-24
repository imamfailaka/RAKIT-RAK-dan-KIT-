import { apiFetch } from "@/lib/api";

export type User = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "technician";
  isActive: boolean;
};

export async function login(email: string, password: string): Promise<string> {
  const res = await apiFetch<string>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return res.data;
}

export async function getMe(token: string): Promise<User> {
  const res = await apiFetch<User>("/auth/me", { token });
  return res.data;
}
