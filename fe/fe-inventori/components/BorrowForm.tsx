"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useToast } from "@/components/Toast";
import { reportError } from "@/lib/handle-error";
import type { Equipment } from "@/services/equipment";
import type { AppUser } from "@/services/users";

export default function BorrowForm({
  equipment,
  technicians,
  submit,
  onDone,
}: {
  equipment: Equipment[];
  technicians: AppUser[];
  submit: (input: { equipment: string; technician: string; note?: string }) => Promise<unknown>;
  onDone: () => void;
}) {
  const router = useRouter();
  const notify = useToast();
  const [unit, setUnit] = useState("");
  const [tech, setTech] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const locked = useRef(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!unit || !tech || locked.current) return;
    locked.current = true;
    setLoading(true);
    try {
      await submit({ equipment: unit, technician: tech, note: note.trim() || undefined });
      notify("Peminjaman dicatat.", "success");
      onDone();
    } catch (err) {
      reportError(err, { notify, onSession: () => router.replace("/auth/login") });
      locked.current = false;
      setLoading(false);
    }
  }

  const select = "h-12 rounded-[14px] border border-line-strong bg-canvas px-3.5 text-sm";
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="b-equipment" className="text-sm font-medium text-ink">Alat</label>
        <select id="b-equipment" value={unit} onChange={(e) => setUnit(e.target.value)} className={select}>
          <option value="">Pilih alat tersedia...</option>
          {equipment.map((e) => (
            <option key={e._id} value={e._id}>{e.name} ({e.serial})</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="b-tech" className="text-sm font-medium text-ink">Teknisi</label>
        <select id="b-tech" value={tech} onChange={(e) => setTech(e.target.value)} className={select}>
          <option value="">Pilih teknisi...</option>
          {technicians.map((t) => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>
      </div>
      <Input label="Catatan" name="note" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button type="submit" disabled={!unit || !tech} loading={loading}>Pinjamkan</Button>
    </form>
  );
}
