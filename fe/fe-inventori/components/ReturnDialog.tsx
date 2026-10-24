"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useToast } from "@/components/Toast";
import { reportError } from "@/lib/handle-error";
import { refName } from "@/lib/labels";
import type { Condition } from "@/services/equipment";
import type { Loan } from "@/services/loans";

export default function ReturnDialog({
  loan,
  submit,
  onDone,
}: {
  loan: Loan;
  submit: (id: string, input: { returnCondition: Condition; note?: string }) => Promise<unknown>;
  onDone: () => void;
}) {
  const router = useRouter();
  const notify = useToast();
  const [condition, setCondition] = useState<Condition>("good");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const locked = useRef(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setLoading(true);
    try {
      await submit(loan._id, { returnCondition: condition, note: note.trim() || undefined });
      notify("Pengembalian dicatat.", "success");
      onDone();
    } catch (err) {
      reportError(err, { notify, onSession: () => router.replace("/auth/login") });
      locked.current = false;
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        {refName(loan.equipment)} dipinjam {refName(loan.technician)}
      </p>
      <div className="flex flex-col gap-1">
        <label htmlFor="r-cond" className="text-sm font-medium text-ink">Kondisi saat kembali</label>
        <select id="r-cond" value={condition} onChange={(e) => setCondition(e.target.value as Condition)} className="h-12 rounded-[14px] border border-line-strong bg-canvas px-3.5 text-sm">
          <option value="good">Baik</option>
          <option value="broken">Rusak</option>
          <option value="repair">Perlu perbaikan</option>
        </select>
      </div>
      <Input label="Catatan" name="note" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button type="submit" loading={loading}>Catat pengembalian</Button>
    </form>
  );
}
