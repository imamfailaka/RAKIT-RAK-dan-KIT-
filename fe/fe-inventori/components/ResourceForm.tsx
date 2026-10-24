"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/Button";
import Input from "@/components/Input";

export type Field = {
  name: string;
  label: string;
  type: "text" | "number" | "textarea" | "checkbox" | "date" | "select" | "password";
  required?: boolean;
  options?: { value: string; label: string }[];
};

export type Values = Record<string, unknown>;

export default function ResourceForm({
  fields,
  initial = {},
  errors = {},
  onSubmit,
  onCancel,
}: {
  fields: Field[];
  initial?: Values;
  errors?: Record<string, string>;
  onSubmit: (values: Values) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Values>(initial);
  const [saving, setSaving] = useState(false);
  const set = (name: string, v: unknown) => setValues((prev) => ({ ...prev, [name]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {fields.map((f) => {
        const err = errors[f.name];
        const v = values[f.name];
        switch (f.type) {
          case "checkbox":
            return (
              <label key={f.name} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={Boolean(v)} onChange={(e) => set(f.name, e.target.checked)} />
                {f.label}
              </label>
            );
          case "textarea":
            return (
              <div key={f.name} className="flex flex-col gap-1">
                <label htmlFor={f.name} className="text-sm font-medium text-ink">{f.label}</label>
                <textarea
                  id={f.name}
                  rows={4}
                  required={f.required}
                  value={String(v ?? "")}
                  onChange={(e) => set(f.name, e.target.value)}
                  className="rounded-[14px] border border-line-strong bg-canvas px-3.5 py-2.5 text-sm"
                />
                {err && <p className="text-xs text-danger-ink">{err}</p>}
              </div>
            );
          case "select":
            return (
              <div key={f.name} className="flex flex-col gap-1">
                <label htmlFor={f.name} className="text-sm font-medium text-ink">{f.label}</label>
                <select
                  id={f.name}
                  required={f.required}
                  value={String(v ?? "")}
                  onChange={(e) => set(f.name, e.target.value)}
                  className="h-12 rounded-[14px] border border-line-strong bg-canvas px-3.5 text-sm"
                >
                  <option value="">Pilih...</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {err && <p className="text-xs text-danger-ink">{err}</p>}
              </div>
            );
          default:
            return (
              <Input
                key={f.name}
                label={f.label}
                name={f.name}
                type={f.type}
                required={f.required}
                value={String(v ?? "")}
                onChange={(e) => set(f.name, f.type === "number" ? (e.target.value === "" ? "" : e.target.valueAsNumber) : e.target.value)}
                error={err}
              />
            );
        }
      })}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Batal</Button>
        <Button type="submit" loading={saving}>Simpan</Button>
      </div>
    </form>
  );
}
