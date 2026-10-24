type EquipmentLite = {
  status: "available" | "borrowed";
  condition: "good" | "broken" | "repair";
  nextCalibration?: Date | string | null;
  category?: { name?: string } | null;
};
type LoanLite = { borrowedAt: Date | string };

export function computeDashboard<E extends EquipmentLite, L extends LoanLite>(
  data: { equipment: E[]; openLoans: L[] },
  now: Date,
  cfg: { overdueDays: number; calibrationDays: number },
) {
  const day = 86400000;
  const equipmentByStatus = { available: 0, borrowed: 0 };
  const equipmentByCondition = { good: 0, broken: 0, repair: 0 };
  const byCategory = new Map<string, number>();
  for (const e of data.equipment) {
    if (e.status in equipmentByStatus) equipmentByStatus[e.status]++;
    if (e.condition in equipmentByCondition) equipmentByCondition[e.condition]++;
    const name = e.category?.name || "Tanpa kategori";
    byCategory.set(name, (byCategory.get(name) ?? 0) + 1);
  }
  const equipmentByCategory = [...byCategory.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const overdueBefore = now.getTime() - cfg.overdueDays * day;
  const overdueLoans = data.openLoans.filter((l) => new Date(l.borrowedAt).getTime() < overdueBefore);
  const dueUntil = now.getTime() + cfg.calibrationDays * day;
  const calibrationDue = data.equipment.filter((e) => {
    if (!e.nextCalibration) return false;
    const t = new Date(e.nextCalibration).getTime();
    return !Number.isNaN(t) && t <= dueUntil;
  });
  return { equipmentByStatus, equipmentByCondition, equipmentByCategory, activeLoans: data.openLoans.length, overdueLoans, calibrationDue };
}
