const ROLES = ["admin", "technician"] as const;

const pick = (body: any, keys: string[]) => {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (body && body[k] !== undefined) out[k] = body[k];
  return out;
};

export function buildUserPayload(body: any) {
  const p = pick(body, ["name", "email", "password", "role", "isActive"]) as any;
  if (p.role !== undefined && !ROLES.includes(p.role)) delete p.role;
  return p as { name?: string; email?: string; password?: string; role?: "admin" | "technician"; isActive?: boolean };
}

const CONDITIONS = ["good", "broken", "repair"];
export function buildCategoryPayload(body: any) {
  return pick(body, ["name"]) as { name?: string };
}

/** `status` is never client-controlled; it only changes through loans. */
export function buildEquipmentPayload(body: any) {
  const p = pick(body, ["serial", "name", "category", "location", "condition", "lastCalibration", "nextCalibration", "photo"]) as any;
  if (p.condition !== undefined && !CONDITIONS.includes(p.condition)) delete p.condition;
  for (const k of ["lastCalibration", "nextCalibration"]) if (p[k] === "" || p[k] === null) delete p[k];
  return p;
}
